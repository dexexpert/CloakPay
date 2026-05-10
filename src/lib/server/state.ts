import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { demoAuditSessions, demoBatches } from "@/lib/demo-data";
import { AppState } from "@/lib/server/types";
import { getRuntimeInfo } from "@/lib/server/runtime";

declare global {
  // eslint-disable-next-line no-var
  var __cloakpay_state_write_queue: Promise<void> | undefined;
}

function getStateFilePath() {
  return process.env.CLOAKPAY_STATE_FILE ?? path.join(process.cwd(), ".data", "cloakpay-state.json");
}

function buildInitialState(): AppState {
  const runtime = getRuntimeInfo();
  const seededBatches = runtime.mode === "demo" ? demoBatches : [];
  const seededClaims =
    runtime.mode === "demo"
      ? seededBatches.flatMap((batch) =>
          batch.recipients
            .filter((recipient) => recipient.status !== "claimed")
            .map((recipient) => ({
              claimId: recipient.claimId,
              batchId: batch.id,
              recipientId: recipient.id,
              recipientWallet: recipient.wallet,
              token: batch.token,
              status: "pending" as const,
              utxoIds: [],
              transferReference: recipient.privateReference ?? `cloak_demo_transfer_${recipient.claimId}`,
              createdAt: batch.createdAt,
            })),
        )
      : [];

  return {
    runtime: {
      mode: runtime.mode,
      treasuryWallet: runtime.treasuryWallet,
      viewingKeyNkHex: process.env.CLOAK_VIEWING_KEY_NK_HEX ?? randomBytes(32).toString("hex"),
    },
    batches: seededBatches,
    auditSessions: runtime.mode === "demo" ? demoAuditSessions : [],
    utxos: [],
    claims: seededClaims,
  };
}

async function ensureStateFile() {
  const filePath = getStateFilePath();
  await mkdir(path.dirname(filePath), { recursive: true });

  try {
    await readFile(filePath, "utf8");
  } catch {
    await writeFile(filePath, JSON.stringify(buildInitialState(), null, 2), "utf8");
  }
}

export async function readState() {
  await ensureStateFile();
  const raw = await readFile(getStateFilePath(), "utf8");
  return JSON.parse(raw) as AppState;
}

export async function writeState(nextState: AppState) {
  await ensureStateFile();
  await writeFile(getStateFilePath(), JSON.stringify(nextState, null, 2), "utf8");
}

export async function updateState<T>(updater: (state: AppState) => Promise<T> | T) {
  const queue = global.__cloakpay_state_write_queue ?? Promise.resolve();
  let result: T;

  global.__cloakpay_state_write_queue = queue.then(async () => {
    const current = await readState();
    result = await updater(current);
    await writeState(current);
  });

  await global.__cloakpay_state_write_queue;
  return result!;
}
