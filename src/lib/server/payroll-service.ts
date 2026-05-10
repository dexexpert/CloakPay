import { randomUUID } from "crypto";

import { PublicKey } from "@solana/web3.js";

import { batchSchema, validateRecipients } from "@/lib/validation/payroll";
import { AuditResolution, CreateBatchRequest } from "@/lib/server/types";
import { getRuntimeInfo } from "@/lib/server/runtime";
import { readState, updateState } from "@/lib/server/state";
import { buildLiveAuditReport, claimDemoPayment, claimLivePayment, executeDemoBatch, executeLiveBatch } from "@/lib/server/cloak-runtime";
import {
  AuditReport,
  AuditSession,
  DashboardPayload,
  DashboardStats,
  PayrollBatch,
  PayrollRecipient,
} from "@/lib/types";

function createId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

function ensureWallet(wallet: string) {
  return new PublicKey(wallet).toBase58();
}

function buildStats(batches: PayrollBatch[]): DashboardStats {
  return {
    totalBatches: batches.length,
    privateVolume: batches.reduce((sum, batch) => sum + batch.totalAmount, 0),
    recipientCount: batches.reduce((sum, batch) => sum + batch.recipientCount, 0),
    pendingClaims: batches.reduce(
      (sum, batch) => sum + batch.recipients.filter((recipient) => recipient.status !== "claimed").length,
      0,
    ),
  };
}

function buildBatch(input: CreateBatchRequest): PayrollBatch {
  const recipients: PayrollRecipient[] = input.recipients.map((recipient) => ({
    id: createId("recipient"),
    claimId: createId("claim"),
    name: recipient.name.trim(),
    wallet: ensureWallet(recipient.wallet.trim()),
    amount: recipient.amount,
    status: "pending",
  }));

  return {
    id: createId("batch"),
    title: input.title.trim(),
    token: input.token,
    createdAt: new Date().toISOString(),
    createdByWallet: input.createdByWallet.trim(),
    totalAmount: recipients.reduce((sum, recipient) => sum + recipient.amount, 0),
    recipientCount: recipients.length,
    status: "ready",
    recipients,
    note: input.note?.trim(),
    executionMode: getRuntimeInfo().mode,
  };
}

export async function getDashboardPayload(): Promise<DashboardPayload> {
  const state = await readState();
  return {
    batches: state.batches,
    stats: buildStats(state.batches),
    runtime: getRuntimeInfo(),
  };
}

export async function createAndExecuteBatch(input: CreateBatchRequest) {
  validateRecipients(input.recipients);
  batchSchema.parse({
    title: input.title,
    token: input.token,
    recipients: input.recipients,
  });

  return updateState(async (state) => {
    const batch = buildBatch(input);
    state.batches.unshift(batch);

    try {
      batch.status = "shielding";

      const execution =
        getRuntimeInfo().mode === "live"
          ? await executeLiveBatch(
              batch,
              state.utxos.filter((record) => record.owner === "treasury"),
              state.runtime.viewingKeyNkHex!,
            )
          : await executeDemoBatch(batch);

      batch.status = "completed";
      batch.cloakReference = execution.shieldResult.reference;
      batch.payoutReferences = execution.payoutReferences;
      batch.recipients = execution.updatedRecipients;
      state.utxos = [...execution.treasuryUtxos, ...execution.claimUtxos];

      state.claims = [...state.claims.filter((claim) => claim.batchId !== batch.id), ...execution.claimVaults];
      return batch;
    } catch (error) {
      batch.status = "failed";
      batch.failureReason = error instanceof Error ? error.message : "Batch execution failed.";
      return batch;
    }
  });
}

export async function getClaim(claimId: string) {
  const state = await readState();

  for (const batch of state.batches) {
    const recipient = batch.recipients.find((item) => item.claimId === claimId);
    if (recipient) {
      return { batch, recipient };
    }
  }

  return null;
}

export async function claimPayment(claimId: string) {
  return updateState(async (state) => {
    const claim = state.claims.find((item) => item.claimId === claimId);
    if (!claim) {
      throw new Error("Claim link was not found.");
    }

    const batch = state.batches.find((item) => item.id === claim.batchId);
    const recipient = batch?.recipients.find((item) => item.claimId === claimId);

    if (!batch || !recipient) {
      throw new Error("Claim recipient is no longer available.");
    }

    if (recipient.status === "claimed") {
      return { batch, recipient };
    }

    const result =
      getRuntimeInfo().mode === "live"
        ? await claimLivePayment(
            claim,
            state.utxos.filter((utxo) => claim.utxoIds.includes(utxo.id)),
            state.runtime.viewingKeyNkHex!,
          )
        : await claimDemoPayment(claim.recipientWallet);

    recipient.status = "claimed";
    recipient.claimedAt = new Date().toISOString();
    recipient.privateReference = result.reference;
    claim.status = "claimed";
    claim.claimedAt = recipient.claimedAt;
    claim.withdrawalReference = result.reference;
    state.utxos = state.utxos.filter((utxo) => !claim.utxoIds.includes(utxo.id));

    return { batch, recipient };
  });
}

function createAuditKey() {
  return `vk_${randomUUID().replace(/-/g, "")}`;
}

export async function listAuditState() {
  const state = await readState();
  return {
    batches: state.batches,
    sessions: state.auditSessions,
  };
}

export async function createAuditSession(batchId: string, scope: AuditSession["scope"]) {
  return updateState((state) => {
    const batch = state.batches.find((item) => item.id === batchId);
    if (!batch) {
      throw new Error("Batch not found for audit session.");
    }

    const session: AuditSession = {
      id: createId("audit"),
      batchId,
      key: createAuditKey(),
      scope,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    };

    batch.auditKey = session.key;
    state.auditSessions.unshift(session);
    return { session, batch };
  });
}

export async function resolveAuditKey(key: string): Promise<AuditResolution | null> {
  const state = await readState();
  const session = state.auditSessions.find((item) => item.key === key);
  if (!session) {
    return null;
  }

  const batch = state.batches.find((item) => item.id === session.batchId);
  if (!batch) {
    return null;
  }

  return { session, batch };
}

function buildDemoAuditReport(batch: PayrollBatch): AuditReport {
  const rows = batch.recipients.map((recipient) => ({
    signature: recipient.privateReference,
    txType: "transfer",
    amount: recipient.amount,
    fee: 0,
    netAmount: recipient.amount,
    runningBalance: 0,
    timestamp: new Date(batch.createdAt).getTime(),
    recipient: recipient.wallet,
    mint: batch.token,
    symbol: batch.token,
    outputMint: batch.token,
    outputSymbol: batch.token,
  }));

  return {
    source: "demo",
    generatedAt: new Date().toISOString(),
    batchId: batch.id,
    batchTitle: batch.title,
    rows,
    summary: {
      transactionCount: rows.length,
      totalAmount: rows.reduce((sum, row) => sum + row.amount, 0),
      totalFees: 0,
      finalBalance: 0,
    },
  };
}

export async function resolveAuditReport(key: string) {
  const resolved = await resolveAuditKey(key);
  if (!resolved) {
    return null;
  }

  const state = await readState();
  const report =
    getRuntimeInfo().mode === "live"
      ? await buildLiveAuditReport(resolved.batch, state.runtime.viewingKeyNkHex!)
      : buildDemoAuditReport(resolved.batch);

  return { ...resolved, report };
}
