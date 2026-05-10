import { AuditSession, PayrollBatch, RuntimeMode, RuntimeInfo } from "@/lib/types";

export interface StoredUtxo {
  id: string;
  mint: PayrollBatch["token"];
  amount: string;
  data: string;
  publicKey: string;
  owner: "treasury" | "claim";
  claimId?: string;
  createdAt: string;
}

export interface ClaimVault {
  claimId: string;
  batchId: string;
  recipientId: string;
  recipientWallet: string;
  token: PayrollBatch["token"];
  status: "pending" | "claimed";
  utxoIds: string[];
  transferReference?: string;
  withdrawalReference?: string;
  createdAt: string;
  claimedAt?: string;
}

export interface StoredRuntimeState {
  mode: RuntimeMode;
  treasuryWallet: string;
  viewingKeyNkHex?: string;
}

export interface AppState {
  runtime: StoredRuntimeState;
  batches: PayrollBatch[];
  auditSessions: AuditSession[];
  utxos: StoredUtxo[];
  claims: ClaimVault[];
}

export interface CreateBatchRequest {
  title: string;
  token: PayrollBatch["token"];
  recipients: Array<{
    name: string;
    wallet: string;
    amount: number;
  }>;
  createdByWallet: string;
  note?: string;
}

export interface AuditResolution {
  session: AuditSession;
  batch: PayrollBatch;
}

export interface ServerContext {
  runtime: RuntimeInfo;
}
