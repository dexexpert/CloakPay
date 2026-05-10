import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { demoAuditSessions, demoBatches } from "@/lib/demo-data";
import { AppState } from "@/lib/server/types";
import { getRuntimeInfo } from "@/lib/server/runtime";

declare global {
  // eslint-disable-next-line no-var
  var __cloakpay_state_write_queue: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var __cloakpay_memory_state: AppState | undefined;
  // eslint-disable-next-line no-var
  var __cloakpay_use_memory_state: boolean | undefined;
}

function isReadOnlyFsError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = (error as NodeJS.ErrnoException).code;
  return code === "EROFS" || code === "EACCES" || code === "EPERM";
}

function getStateFilePath() {
  if (process.env.CLOAKPAY_STATE_FILE) {
    return process.env.CLOAKPAY_STATE_FILE;
  }

  // Vercel / AWS Lambda only allow writes under /tmp; everywhere else uses the project .data dir.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join("/tmp", "cloakpay-state.json");
  }

  return path.join(process.cwd(), ".data", "cloakpay-state.json");
}

function cloneState(state: AppState): AppState {
  return JSON.parse(JSON.stringify(state)) as AppState;
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

function switchToMemoryState() {
  global.__cloakpay_use_memory_state = true;
  if (!global.__cloakpay_memory_state) {
    global.__cloakpay_memory_state = buildInitialState();
  }
}

async function ensureStateFile() {
  if (global.__cloakpay_use_memory_state) {
    return;
  }

  const filePath = getStateFilePath();

  try {
    await mkdir(path.dirname(filePath), { recursive: true });

    try {
      await readFile(filePath, "utf8");
    } catch {
      await writeFile(filePath, JSON.stringify(buildInitialState(), null, 2), "utf8");
    }
  } catch (error) {
    if (!isReadOnlyFsError(error)) {
      throw error;
    }
    // Read-only filesystem (e.g. cold-start path on a serverless host with the wrong target dir) — fall back to in-memory state.
    switchToMemoryState();
  }
}

export async function readState() {
  await ensureStateFile();

  if (global.__cloakpay_use_memory_state) {
    if (!global.__cloakpay_memory_state) {
      global.__cloakpay_memory_state = buildInitialState();
    }
    return cloneState(global.__cloakpay_memory_state);
  }

  const raw = await readFile(getStateFilePath(), "utf8");
  return JSON.parse(raw) as AppState;
}

export async function writeState(nextState: AppState) {
  await ensureStateFile();

  if (global.__cloakpay_use_memory_state) {
    global.__cloakpay_memory_state = cloneState(nextState);
    return;
  }

  try {
    await writeFile(getStateFilePath(), JSON.stringify(nextState, null, 2), "utf8");
  } catch (error) {
    if (!isReadOnlyFsError(error)) {
      throw error;
    }
    switchToMemoryState();
    global.__cloakpay_memory_state = cloneState(nextState);
  }
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
