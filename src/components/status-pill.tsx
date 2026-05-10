"use client";

import { PaymentStatus, RecipientStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type StatusValue = PaymentStatus | RecipientStatus;

const palette: Record<StatusValue, string> = {
  draft: "status-neutral",
  ready: "status-ready",
  shielding: "status-progress",
  shielded: "status-ready",
  paying: "status-progress",
  completed: "status-success",
  failed: "status-danger",
  pending: "status-neutral",
  paid: "status-ready",
  claimed: "status-success",
};

export function StatusPill({ status }: { status: StatusValue }) {
  return <span className={cn("status-pill", palette[status])}>{status}</span>;
}
