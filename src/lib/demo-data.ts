import { AuditSession, PayrollBatch } from "@/lib/types";

export const demoBatches: PayrollBatch[] = [
  {
    id: "batch-apr-2026",
    title: "April Contractor Payroll",
    token: "USDC",
    createdAt: "2026-04-28T10:00:00.000Z",
    createdByWallet: "7X1c...DemoOps",
    totalAmount: 3650,
    recipientCount: 3,
    status: "completed",
    cloakReference: "clo_demo_apr_2026",
    auditKey: "vk_demo_apr_2026",
    recipients: [
      {
        id: "apr-alex",
        claimId: "claim-apr-alex",
        name: "Alex Rivera",
        wallet: "7T2EFf3Aq8Fq2mPrJmLgp2mPyU1uXwLEoZL4Bx4yKcQm",
        amount: 1200,
        status: "claimed",
      },
      {
        id: "apr-maria",
        claimId: "claim-apr-maria",
        name: "Maria Chen",
        wallet: "5v2qvC6vXJxR6fVxYjW3Sws8HcgTAdP6v4UtH5QjFP4q",
        amount: 950,
        status: "paid",
      },
      {
        id: "apr-jules",
        claimId: "claim-apr-jules",
        name: "Jules Kim",
        wallet: "BhX6GdF6wTo1AqXoYv3ZsH8Prv7QhHf3yS5MZWQwZT4t",
        amount: 1500,
        status: "paid",
      },
    ],
  },
];

export const demoAuditSessions: AuditSession[] = [
  {
    id: "audit-apr",
    batchId: "batch-apr-2026",
    key: "vk_demo_apr_2026",
    createdAt: "2026-04-28T11:00:00.000Z",
    scope: "batch",
    expiresAt: "2026-05-31T11:00:00.000Z",
  },
];
