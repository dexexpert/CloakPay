export type PaymentStatus =
  | "draft"
  | "ready"
  | "shielding"
  | "shielded"
  | "paying"
  | "completed"
  | "failed";

export type RecipientStatus = "pending" | "paid" | "claimed";
export type RuntimeMode = "demo" | "live";
export type SupportedToken = "USDC" | "USDT" | "SOL";

export interface TokenSupportStatus {
  token: SupportedToken;
  livePayroll: boolean;
  liveClaim: boolean;
  mintAddress?: string;
  note: string;
}

export interface PayrollRecipientInput {
  name: string;
  wallet: string;
  amount: number;
}

export interface PayrollRecipient extends PayrollRecipientInput {
  id: string;
  claimId: string;
  status: RecipientStatus;
  privateReference?: string;
  claimedAt?: string;
}

export interface PayrollBatch {
  id: string;
  title: string;
  token: "USDC" | "USDT" | "SOL";
  createdAt: string;
  createdByWallet: string;
  totalAmount: number;
  recipientCount: number;
  status: PaymentStatus;
  recipients: PayrollRecipient[];
  cloakReference?: string;
  auditKey?: string;
  note?: string;
  executionMode?: RuntimeMode;
  payoutReferences?: string[];
  failureReason?: string;
}

export interface AuditSession {
  id: string;
  batchId: string;
  key: string;
  createdAt: string;
  scope: "batch" | "organization";
  expiresAt: string;
}

export interface AuditReportRow {
  signature?: string;
  txType: string;
  amount: number;
  fee: number;
  netAmount: number;
  runningBalance: number;
  timestamp: number;
  recipient: string;
  mint?: string;
  symbol?: string;
  outputMint?: string;
  outputSymbol?: string;
}

export interface AuditReport {
  source: "demo" | "live";
  generatedAt: string;
  batchId: string;
  batchTitle: string;
  rows: AuditReportRow[];
  summary: {
    transactionCount: number;
    totalAmount: number;
    totalFees: number;
    finalBalance: number;
  };
}

export interface OperationResult {
  reference: string;
  message: string;
}

export interface DashboardStats {
  totalBatches: number;
  privateVolume: number;
  recipientCount: number;
  pendingClaims: number;
}

export interface RuntimeInfo {
  mode: RuntimeMode;
  organizationName: string;
  treasuryWallet: string;
  relayUrl: string;
  rpcUrl: string;
  isLiveConfigured: boolean;
  note: string;
  tokenSupport: TokenSupportStatus[];
}

export interface DashboardPayload {
  batches: PayrollBatch[];
  stats: DashboardStats;
  runtime: RuntimeInfo;
}
