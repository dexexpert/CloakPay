import Link from "next/link";

import { StatusPill } from "@/components/status-pill";
import { PayrollBatch } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export function BatchTable({ batches }: { batches: PayrollBatch[] }) {
  return (
    <div className="panel table-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Execution history</p>
          <h2>Private payroll batches</h2>
        </div>
        <p className="muted section-caption">
          Every completed run stays tied to recipient-level claim links and an audit review flow.
        </p>
      </div>
      <div className="table-wrap batch-table-wrap">
        <table className="batch-history-table">
          <thead>
            <tr>
              <th>Batch</th>
              <th>Date</th>
              <th>Token</th>
              <th>Total</th>
              <th>Recipients</th>
              <th>Status</th>
              <th>Claim links</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id}>
                <td data-label="Batch">
                  <strong>{batch.title}</strong>
                  <div className="muted">{batch.cloakReference ?? "Awaiting private run"}</div>
                </td>
                <td data-label="Date">{formatDate(batch.createdAt)}</td>
                <td data-label="Token">{batch.token}</td>
                <td data-label="Total">
                  {formatCurrency(batch.totalAmount, batch.token)} {batch.token}
                </td>
                <td data-label="Recipients">{batch.recipientCount}</td>
                <td data-label="Status">
                  <StatusPill status={batch.status} />
                </td>
                <td data-label="Claim links">
                  <div className="claim-link-list">
                    {batch.recipients.map((recipient) => (
                      <Link className="table-link claim-link-chip" href={`/claim/${recipient.claimId}`} key={recipient.id}>
                        {recipient.name}
                      </Link>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
