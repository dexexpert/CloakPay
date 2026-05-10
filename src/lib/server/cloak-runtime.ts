import { randomUUID } from "crypto";

import {
  CLOAK_PROGRAM_ID,
  NATIVE_SOL_MINT,
  formatComplianceCsv,
  createUtxo,
  createZeroUtxo,
  deserializeUtxo,
  fullWithdraw,
  generateUtxoKeypair,
  scanTransactions,
  selectUtxos,
  serializeUtxo,
  toComplianceReport,
  transact,
  transfer,
  type TransactResult,
  type Utxo,
} from "@cloak.dev/sdk";
import { Connection, PublicKey } from "@solana/web3.js";

import { AuditReport, OperationResult, PayrollBatch } from "@/lib/types";
import { ClaimVault, StoredUtxo } from "@/lib/server/types";
import { getRuntimeInfo, requireTreasuryKeypair } from "@/lib/server/runtime";
const TOKEN_DECIMALS: Record<PayrollBatch["token"], number> = {
  SOL: 9,
  USDC: 6,
  USDT: 6,
};
const TOKEN_MINTS: Record<Exclude<PayrollBatch["token"], "SOL">, string> = {
  USDC: process.env.CLOAK_USDC_MINT ?? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: process.env.CLOAK_USDT_MINT ?? "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
};

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tokenToMint(token: PayrollBatch["token"]) {
  if (token === "SOL") {
    return NATIVE_SOL_MINT;
  }

  return new PublicKey(TOKEN_MINTS[token]);
}

function toAtomicAmount(token: PayrollBatch["token"], amount: number) {
  const decimals = TOKEN_DECIMALS[token];
  return BigInt(Math.round(amount * 10 ** decimals));
}

function fromAtomicAmount(token: PayrollBatch["token"], amount: bigint) {
  const decimals = TOKEN_DECIMALS[token];
  return Number(amount) / 10 ** decimals;
}

function serializeStoredUtxo(utxo: Utxo, owner: StoredUtxo["owner"], token: PayrollBatch["token"], claimId?: string): StoredUtxo {
  return {
    id: randomUUID(),
    mint: token,
    amount: String(fromAtomicAmount(token, utxo.amount)),
    data: Buffer.from(serializeUtxo(utxo)).toString("base64"),
    publicKey: utxo.keypair.publicKey.toString(),
    owner,
    claimId,
    createdAt: new Date().toISOString(),
  };
}

async function reviveUtxo(record: StoredUtxo) {
  const bytes = Buffer.from(record.data, "base64");
  return deserializeUtxo(bytes);
}

function buildClaimVault(batchId: string, recipientId: string, claimId: string, recipientWallet: string, token: PayrollBatch["token"], utxoIds: string[], transferReference: string): ClaimVault {
  return {
    claimId,
    batchId,
    recipientId,
    recipientWallet,
    token,
    status: "pending",
    utxoIds,
    transferReference,
    createdAt: new Date().toISOString(),
  };
}

function decodeNkHex(nkHex: string) {
  return Uint8Array.from(Buffer.from(nkHex, "hex"));
}

function getConnection() {
  const runtime = getRuntimeInfo();
  return new Connection(runtime.rpcUrl, "confirmed");
}

function baseTransactOptions(viewingKeyNkHex: string, result?: TransactResult) {
  const runtime = getRuntimeInfo();
  const treasuryKeypair = requireTreasuryKeypair();

  return {
    connection: getConnection(),
    programId: CLOAK_PROGRAM_ID,
    relayUrl: runtime.relayUrl,
    depositorKeypair: treasuryKeypair,
    walletPublicKey: treasuryKeypair.publicKey,
    chainNoteViewingKeyNk: decodeNkHex(viewingKeyNkHex),
    cachedMerkleTree: result?.merkleTree,
    addressLookupTableAccounts: result?.addressLookupTableAccounts,
  };
}

export async function executeDemoBatch(batch: PayrollBatch) {
  await pause(500);

  const claimVaults = batch.recipients.map((recipient) =>
    buildClaimVault(
      batch.id,
      recipient.id,
      recipient.claimId,
      recipient.wallet,
      batch.token,
      [],
      `cloak_demo_transfer_${recipient.claimId}`,
    ),
  );

  return {
    shieldResult: {
      reference: `cloak_shield_${batch.id}`,
      message: `Shielded ${batch.totalAmount} ${batch.token} for ${batch.recipientCount} recipients.`,
    },
    payoutResult: {
      reference: `cloak_pay_${batch.id}`,
      message: `Executed private payroll batch for ${batch.recipientCount} recipients.`,
    },
    updatedRecipients: batch.recipients.map((recipient) => ({
      ...recipient,
      status: "paid" as const,
      privateReference: `cloak_demo_transfer_${recipient.claimId}`,
    })),
    payoutReferences: claimVaults.map((claim) => claim.transferReference!),
    treasuryUtxos: [] as StoredUtxo[],
    claimUtxos: [] as StoredUtxo[],
    claimVaults,
  };
}

export async function executeLiveBatch(batch: PayrollBatch, existingTreasuryUtxos: StoredUtxo[], viewingKeyNkHex: string) {
  const mint = tokenToMint(batch.token);
  const depositAmount = toAtomicAmount(batch.token, batch.totalAmount);

  const depositKeypair = await generateUtxoKeypair();
  const depositOutput = await createUtxo(depositAmount, depositKeypair, mint);
  const zeroOutput = await createZeroUtxo(mint);

  const depositResult = await transact(
    {
      inputUtxos: [await createZeroUtxo(mint), await createZeroUtxo(mint)],
      outputUtxos: [depositOutput, zeroOutput],
      externalAmount: depositAmount,
      depositor: requireTreasuryKeypair().publicKey,
    },
    baseTransactOptions(viewingKeyNkHex),
  );

  let latestResult = depositResult;
  const liveTreasuryUtxos = [
    ...existingTreasuryUtxos.filter((record) => record.owner === "treasury"),
    ...depositResult.outputUtxos
      .filter((utxo) => utxo.amount > 0n)
      .map((utxo) => serializeStoredUtxo(utxo, "treasury", batch.token)),
  ];

  const claimVaults: ClaimVault[] = [];
  const updatedRecipients = [];
  const payoutReferences: string[] = [];

  for (const recipient of batch.recipients) {
    const targetAmount = toAtomicAmount(batch.token, recipient.amount);
    const available = await Promise.all(
      liveTreasuryUtxos.filter((record) => record.owner === "treasury").map(reviveUtxo),
    );
    const selected = selectUtxos(available, targetAmount);

    if (!selected) {
      throw new Error(`Insufficient shielded balance for ${recipient.name}.`);
    }

    const recipientKeypair = await generateUtxoKeypair();
    const transferResult = await transfer(
      selected,
      recipientKeypair.publicKey,
      targetAmount,
      baseTransactOptions(viewingKeyNkHex, latestResult),
    );
    latestResult = transferResult;

    const spentPublicKeys = new Set(selected.map((utxo) => utxo.keypair.publicKey.toString()));
    const remainingTreasury = liveTreasuryUtxos.filter((record) => !spentPublicKeys.has(record.publicKey));
    const nextTreasuryOutputs = transferResult.outputUtxos
      .filter((utxo) => utxo.amount > 0n && utxo.keypair.publicKey !== recipientKeypair.publicKey)
      .map((utxo) => serializeStoredUtxo(utxo, "treasury", batch.token));
    liveTreasuryUtxos.splice(0, liveTreasuryUtxos.length, ...remainingTreasury, ...nextTreasuryOutputs);

    const recipientOutput = transferResult.outputUtxos.find((utxo) => utxo.keypair.publicKey === recipientKeypair.publicKey);
    if (!recipientOutput) {
      throw new Error(`Missing recipient output for ${recipient.name}.`);
    }

    const storedClaimUtxo = serializeStoredUtxo(recipientOutput, "claim", batch.token, recipient.claimId);

    claimVaults.push(
      buildClaimVault(
        batch.id,
        recipient.id,
        recipient.claimId,
        recipient.wallet,
        batch.token,
        [storedClaimUtxo.id],
        transferResult.signature,
      ),
    );

    payoutReferences.push(transferResult.signature);
    updatedRecipients.push({
      ...recipient,
      status: "paid" as const,
      privateReference: transferResult.signature,
    });

    liveTreasuryUtxos.push(storedClaimUtxo);
  }

  return {
    shieldResult: {
      reference: depositResult.signature,
      message: `Shielded ${batch.totalAmount} ${batch.token} into Cloak.`,
    },
    payoutResult: {
      reference: payoutReferences[payoutReferences.length - 1] ?? depositResult.signature,
      message: `Executed ${batch.recipientCount} private Cloak transfers.`,
    },
    updatedRecipients,
    payoutReferences,
    treasuryUtxos: liveTreasuryUtxos.filter((record) => record.owner === "treasury"),
    claimVaults,
    claimUtxos: liveTreasuryUtxos.filter((record) => record.owner === "claim"),
  };
}

export async function claimDemoPayment(recipientWallet: string): Promise<OperationResult> {
  await pause(250);
  return {
    reference: `claim_${recipientWallet.slice(0, 8)}`,
    message: `Marked private receipt for ${recipientWallet}.`,
  };
}

export async function claimLivePayment(vault: ClaimVault, storedUtxos: StoredUtxo[], viewingKeyNkHex: string) {
  const runtime = getRuntimeInfo();
  if (runtime.mode !== "live") {
    throw new Error("Live claim execution is not active.");
  }

  const utxos = await Promise.all(storedUtxos.map(reviveUtxo));
  const recipient = new PublicKey(vault.recipientWallet);
  const result = await fullWithdraw(utxos, recipient, baseTransactOptions(viewingKeyNkHex));

  return {
    reference: result.signature,
    message: `Withdrew claim ${vault.claimId} to ${vault.recipientWallet}.`,
  };
}

export async function buildLiveAuditReport(batch: PayrollBatch, viewingKeyNkHex: string): Promise<AuditReport> {
  const runtime = getRuntimeInfo();
  const connection = getConnection();
  const raw = await scanTransactions({
    connection,
    programId: CLOAK_PROGRAM_ID,
    viewingKeyNk: decodeNkHex(viewingKeyNkHex),
    afterTimestamp: new Date(batch.createdAt).getTime() - 1000 * 60 * 30,
    walletPublicKey: runtime.treasuryWallet,
    batchSize: 25,
  });
  const report = toComplianceReport(raw);
  const signatures = new Set([batch.cloakReference, ...(batch.payoutReferences ?? [])].filter(Boolean));
  const rows = report.transactions.filter((transaction) => !signatures.size || signatures.has(transaction.signature));

  return {
    source: "live",
    generatedAt: new Date().toISOString(),
    batchId: batch.id,
    batchTitle: batch.title,
    rows: rows.map((row) => ({
      signature: row.signature,
      txType: row.txType,
      amount: row.amount,
      fee: row.fee,
      netAmount: row.netAmount,
      runningBalance: row.runningBalance,
      timestamp: row.timestamp,
      recipient: row.recipient,
      mint: row.mint,
      symbol: row.symbol,
      outputMint: row.outputMint,
      outputSymbol: row.outputSymbol,
    })),
    summary: {
      transactionCount: rows.length,
      totalAmount: rows.reduce((sum, row) => sum + row.amount, 0),
      totalFees: rows.reduce((sum, row) => sum + row.fee, 0),
      finalBalance: rows.at(-1)?.runningBalance ?? 0,
    },
  };
}

export function exportAuditCsv(report: AuditReport) {
  return formatComplianceCsv({
    transactions: report.rows.map((row) => ({
      txType: row.txType,
      amount: row.amount,
      fee: row.fee,
      netAmount: row.netAmount,
      runningBalance: row.runningBalance,
      timestamp: row.timestamp,
      recipient: row.recipient,
      commitment: "",
      signature: row.signature,
      mint: row.mint,
      decimals: row.symbol === "SOL" ? 9 : 6,
      symbol: row.symbol,
      outputMint: row.outputMint,
      outputSymbol: row.outputSymbol,
    })),
    summary: {
      totalDeposits: report.summary.totalAmount,
      totalWithdrawals: 0,
      totalFees: report.summary.totalFees,
      netChange: report.summary.finalBalance,
      transactionCount: report.summary.transactionCount,
      finalBalance: report.summary.finalBalance,
    },
    lastSignature: report.rows.at(-1)?.signature,
    rpcCallsMade: 0,
  });
}
