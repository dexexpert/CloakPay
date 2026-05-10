import { AuditReport, AuditSession, DashboardPayload, PayrollBatch, PayrollRecipient } from "@/lib/types";

async function readJson<T>(response: Response) {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return payload;
}

export async function fetchDashboard() {
  const response = await fetch("/api/dashboard", { cache: "no-store" });
  return readJson<DashboardPayload>(response);
}

export async function createBatch(input: {
  title: string;
  token: PayrollBatch["token"];
  recipients: Array<{ name: string; wallet: string; amount: number }>;
  createdByWallet: string;
  note?: string;
}) {
  const response = await fetch("/api/batches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return readJson<{ batch: PayrollBatch }>(response);
}

export async function fetchClaim(claimId: string) {
  const response = await fetch(`/api/claims/${claimId}`, { cache: "no-store" });
  return readJson<{ batch: PayrollBatch; recipient: PayrollRecipient }>(response);
}

export async function claimPayment(claimId: string) {
  const response = await fetch(`/api/claims/${claimId}/claim`, {
    method: "POST",
  });

  return readJson<{ batch: PayrollBatch; recipient: PayrollRecipient }>(response);
}

export async function fetchAuditState() {
  const response = await fetch("/api/audit", { cache: "no-store" });
  return readJson<{ batches: PayrollBatch[]; sessions: AuditSession[] }>(response);
}

export async function createAuditSession(batchId: string, scope: AuditSession["scope"] = "batch") {
  const response = await fetch("/api/audit/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ batchId, scope }),
  });

  return readJson<{ session: AuditSession; batch: PayrollBatch }>(response);
}

export async function resolveAuditKey(key: string) {
  const response = await fetch("/api/audit/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });

  return readJson<{ session: AuditSession; batch: PayrollBatch; report: AuditReport }>(response);
}
