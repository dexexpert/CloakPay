"use client";

import { useState } from "react";

import { claimPayment } from "@/lib/api";
import { PayrollBatch, PayrollRecipient } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ClaimCardProps {
  batch: PayrollBatch;
  recipient: PayrollRecipient;
}

export function ClaimCard({ batch, recipient }: ClaimCardProps) {
  const [status, setStatus] = useState(recipient.status);
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const claimActionLabel =
    batch.token === "SOL" ? "Confirm private receipt" : `Acknowledge private ${batch.token} payout`;

  async function confirmClaim() {
    try {
      setIsBusy(true);
      setError("");
      const result = await claimPayment(recipient.claimId);
      setStatus(result.recipient.status);
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "Unable to confirm the claim.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="panel claim-panel claim-panel-upgraded">
      <div className="claim-header">
        <p className="eyebrow">Private payout notice</p>
        <span className="status-pill status-success">{status}</span>
      </div>
      <h1>{recipient.name}</h1>
      <p className="claim-amount">
        {formatCurrency(recipient.amount, batch.token)} {batch.token}
      </p>
      <p className="muted">
        This payment was routed through CloakPay for the batch <strong>{batch.title}</strong>. Public explorers do not
        expose the payroll relationship.
      </p>
      <p className="muted">
        This claim page is specific to <strong>{recipient.name}</strong> and does not reveal the rest of the payroll
        batch to the recipient.
      </p>
      <div className="claim-meta">
        <div>
          <span className="muted">Destination wallet</span>
          <strong>{recipient.wallet}</strong>
        </div>
        <div>
          <span className="muted">Batch title</span>
          <strong>{batch.title}</strong>
        </div>
        <div>
          <span className="muted">Receipt status</span>
          <strong>{status}</strong>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <button
        aria-disabled={status === "claimed" || isBusy}
        className="button primary claim-button"
        disabled={status === "claimed" || isBusy}
        onClick={confirmClaim}
        suppressHydrationWarning
        type="button"
      >
        {status === "claimed" ? "Payment claimed" : isBusy ? "Submitting claim..." : claimActionLabel}
      </button>
    </section>
  );
}
