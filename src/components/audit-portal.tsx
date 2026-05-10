"use client";

import { useEffect, useState } from "react";

import { createAuditSession, resolveAuditKey } from "@/lib/api";
import { AuditReport, AuditSession, PayrollBatch } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface AuditPortalProps {
  batches: PayrollBatch[];
  sessions: AuditSession[];
  onRefresh: () => Promise<void> | void;
}

export function AuditPortal({ batches, onRefresh, sessions }: AuditPortalProps) {
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id ?? "");
  const [enteredKey, setEnteredKey] = useState("");
  const [message, setMessage] = useState("Generate a scoped viewing key and unlock a Cloak-derived audit report.");
  const [error, setError] = useState("");
  const [visibleSession, setVisibleSession] = useState<AuditSession | null>(null);
  const [visibleBatch, setVisibleBatch] = useState<PayrollBatch | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);

  useEffect(() => {
    if (!selectedBatchId && batches[0]?.id) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  useEffect(() => {
    const matched = sessions.find((session) => session.key === enteredKey);
    if (!matched) {
      return;
    }

    const batch = batches.find((item) => item.id === matched.batchId);
    if (batch) {
      setVisibleSession(matched);
      setVisibleBatch(batch);
    }
  }, [batches, enteredKey, sessions]);

  const selectedBatch = batches.find((batch) => batch.id === selectedBatchId) ?? batches[0];

  async function generateKey() {
    if (!selectedBatch) {
      return;
    }

    try {
      setError("");
      const { session, batch } = await createAuditSession(selectedBatch.id, "batch");
      setEnteredKey(session.key);
      setVisibleSession(session);
      setVisibleBatch(batch);
      setReport(null);
      setMessage(`Generated a batch viewing key for ${batch.title}. Session expires ${formatDate(session.expiresAt)}.`);
      await onRefresh();
    } catch (sessionError) {
      setError(sessionError instanceof Error ? sessionError.message : "Unable to create an audit session.");
    }
  }

  async function revealAuditReport() {
    try {
      setError("");
      const result = await resolveAuditKey(enteredKey);
      setVisibleSession(result.session);
      setVisibleBatch(result.batch);
      setReport(result.report);
      setMessage(`Audit report unlocked for ${result.batch.title}.`);
    } catch (resolveError) {
      setVisibleSession(null);
      setVisibleBatch(null);
      setReport(null);
      setError(resolveError instanceof Error ? resolveError.message : "Viewing key could not be resolved.");
    }
  }

  function exportCsv() {
    if (!report || typeof window === "undefined") {
      return;
    }

    const csvLines = [
      "signature,txType,recipient,amount,fee,netAmount,symbol,timestamp",
      ...report.rows.map((row) =>
        [
          row.signature ?? "",
          row.txType,
          row.recipient,
          row.amount,
          row.fee,
          row.netAmount,
          row.symbol ?? "",
          new Date(row.timestamp).toISOString(),
        ].join(","),
      ),
    ];

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.batchTitle.replace(/\s+/g, "-").toLowerCase()}-audit.csv`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="panel audit-grid audit-shell">
      <div className="audit-layout">
        <div className="audit-sidebar">
          <div>
            <p className="eyebrow">Selective disclosure</p>
            <h1>Audit portal</h1>
            <p className="muted">{message}</p>
          </div>

          <div className="form-grid audit-form-grid">
            <label>
              Batch
              <select
                onChange={(event) => setSelectedBatchId(event.target.value)}
                suppressHydrationWarning
                value={selectedBatchId}
              >
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Viewing key
              <input
                onChange={(event) => setEnteredKey(event.target.value.trim())}
                placeholder="vk_..."
                suppressHydrationWarning
                value={enteredKey}
              />
            </label>
          </div>

          <div className="builder-actions">
            <button className="button secondary" onClick={generateKey} suppressHydrationWarning type="button">
              Generate key
            </button>
            <button className="button ghost" onClick={revealAuditReport} suppressHydrationWarning type="button">
              View report
            </button>
            <button className="button ghost" onClick={exportCsv} suppressHydrationWarning type="button">
              Export CSV
            </button>
          </div>

          <div className="audit-sidebar-note">
            <span>Review model</span>
            <strong>Time-scoped access for finance and external auditors.</strong>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
        </div>

        <div className="audit-main">
          {visibleBatch ? (
            <div className="audit-report">
              <div className="audit-head">
                <div>
                  <h3>{visibleBatch.title}</h3>
                  <p className="muted">
                    {visibleBatch.recipientCount} recipients / {formatCurrency(visibleBatch.totalAmount, visibleBatch.token)}{" "}
                    {visibleBatch.token}
                  </p>
                </div>
                <div className="muted">Key expires {formatDate(visibleSession?.expiresAt ?? visibleBatch.createdAt)}</div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Recipient</th>
                      <th>Amount</th>
                      <th>Fee</th>
                      <th>Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report?.rows ?? []).map((row, index) => (
                      <tr key={`${row.signature ?? "row"}-${index}`}>
                        <td data-label="Type">{row.txType}</td>
                        <td data-label="Recipient">{row.recipient}</td>
                        <td data-label="Amount">
                          {formatCurrency(row.netAmount, visibleBatch.token)} {visibleBatch.token}
                        </td>
                        <td data-label="Fee">
                          {formatCurrency(row.fee, visibleBatch.token)} {visibleBatch.token}
                        </td>
                        <td data-label="Signature">{row.signature ?? "pending"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="empty-state audit-empty">
              Enter a generated viewing key to reveal a Cloak-derived audit report and exportable payroll evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
