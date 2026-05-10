"use client";

import { ChangeEvent, startTransition, useMemo, useState } from "react";

import { createBatch } from "@/lib/api";
import { PayrollBatch, PayrollRecipientInput } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { batchSchema, parsePayrollCsv, validateRecipients } from "@/lib/validation/payroll";

interface PayrollBuilderProps {
  wallet: string;
  onBatchCreated: (batch: PayrollBatch) => Promise<void> | void;
}

const blankRecipient: PayrollRecipientInput = {
  name: "",
  wallet: "",
  amount: 0,
};

export function PayrollBuilder({ wallet, onBatchCreated }: PayrollBuilderProps) {
  const [title, setTitle] = useState("May Contractor Payroll");
  const [token, setToken] = useState<PayrollBatch["token"]>("USDC");
  const [note, setNote] = useState("Confidential monthly contractor run.");
  const [recipients, setRecipients] = useState<PayrollRecipientInput[]>([blankRecipient]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Ready to assemble a private payroll batch.");
  const [isBusy, setIsBusy] = useState(false);

  const totals = useMemo(() => {
    return recipients.reduce(
      (acc, recipient) => {
        const amount = Number(recipient.amount) || 0;
        acc.total += amount;
        if (recipient.name && recipient.wallet && amount > 0) {
          acc.validCount += 1;
        }
        return acc;
      },
      { total: 0, validCount: 0 },
    );
  }, [recipients]);

  function updateRecipient(index: number, key: keyof PayrollRecipientInput, value: string) {
    setRecipients((current) =>
      current.map((recipient, recipientIndex) =>
        recipientIndex === index
          ? {
              ...recipient,
              [key]: key === "amount" ? Number(value) : value,
            }
          : recipient,
      ),
    );
  }

  function addRecipient() {
    setRecipients((current) => [...current, blankRecipient]);
  }

  function loadCsv(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    file
      .text()
      .then((csvText) => {
        let parsed: PayrollRecipientInput[];
        try {
          parsed = parsePayrollCsv(csvText);
        } catch (csvError: unknown) {
          setError(csvError instanceof Error ? csvError.message : "Unable to parse CSV.");
          setStatus("CSV upload failed. Fix the file and try again.");
          return;
        }

        if (parsed.length === 0) {
          setError("CSV did not contain any recipients. Expected columns: name, wallet, amount.");
          setStatus("CSV upload was empty.");
          return;
        }

        startTransition(() => {
          setRecipients(parsed);
          setStatus(`Loaded ${parsed.length} recipients from CSV.`);
        });
      })
      .catch((csvError: unknown) => {
        setError(csvError instanceof Error ? csvError.message : "Unable to read CSV.");
      })
      .finally(() => {
        // Allow re-uploading the same file by clearing the input value.
        input.value = "";
      });
  }

  async function createAndRunBatch() {
    try {
      setIsBusy(true);
      setError("");
      setStatus("Validating payroll inputs...");

      const cleanRecipients = recipients.filter(
        (recipient) => recipient.name || recipient.wallet || recipient.amount > 0,
      );

      validateRecipients(cleanRecipients);
      batchSchema.parse({
        title,
        token,
        recipients: cleanRecipients,
      });

      setStatus("Sending payroll batch to the backend...");
      const { batch } = await createBatch({
        title,
        token,
        note,
        recipients: cleanRecipients.map(({ name, wallet, amount }) => ({ name, wallet, amount })),
        createdByWallet: wallet,
      });

      await onBatchCreated(batch);
      setStatus(
        batch.status === "completed"
          ? "Private payroll completed. Claim links and audit tools are ready."
          : batch.failureReason ?? "The backend was unable to complete the batch.",
      );
    } catch (batchError: unknown) {
      setError(batchError instanceof Error ? batchError.message : "Unable to create payroll batch.");
      setStatus("The batch needs attention before it can run privately.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="panel builder-grid builder-shell">
      <div className="builder-layout">
        <div className="builder-main">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Create batch</p>
              <h2>Private payroll composer</h2>
            </div>
            <label className="upload-button">
              Upload CSV
              <input accept=".csv,text/csv" onChange={loadCsv} suppressHydrationWarning type="file" />
            </label>
          </div>

          <div className="form-grid">
            <label className="composer-field">
              <span className="composer-label">Batch title</span>
              <input onChange={(event) => setTitle(event.target.value)} suppressHydrationWarning value={title} />
            </label>
            <label className="composer-field">
              <span className="composer-label">Token</span>
              <select
                onChange={(event) => setToken(event.target.value as PayrollBatch["token"])}
                suppressHydrationWarning
                value={token}
              >
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
                <option value="SOL">SOL</option>
              </select>
            </label>
          </div>

          <label className="composer-field">
            <span className="composer-label">Internal note</span>
            <textarea
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              suppressHydrationWarning
              value={note}
            />
          </label>

          <div className="recipient-section">
            <div className="recipient-section-head">
              <div>
                <p className="eyebrow">Recipients</p>
                <h3>Batch roster</h3>
              </div>
              <button className="button ghost" onClick={addRecipient} suppressHydrationWarning type="button">
                Add recipient
              </button>
            </div>
            <div className="recipient-list">
              {recipients.map((recipient, index) => (
                <div className="recipient-row recipient-card" key={`${recipient.wallet}-${index}`}>
                  <input
                    onChange={(event) => updateRecipient(index, "name", event.target.value)}
                    placeholder="Recipient name"
                    suppressHydrationWarning
                    value={recipient.name}
                  />
                  <input
                    onChange={(event) => updateRecipient(index, "wallet", event.target.value)}
                    placeholder="Solana wallet"
                    suppressHydrationWarning
                    value={recipient.wallet}
                  />
                  <input
                    min="0"
                    onChange={(event) => updateRecipient(index, "amount", event.target.value)}
                    placeholder="Amount"
                    suppressHydrationWarning
                    type="number"
                    value={recipient.amount || ""}
                  />
                </div>
              ))}
            </div>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
        </div>

        <aside className="builder-sidebar">
          <div className="builder-summary">
            <p className="eyebrow">Execution summary</p>
            <h3>{title}</h3>
            <div className="summary-total">
              <span>Total private payroll</span>
              <strong>
                {formatCurrency(totals.total, token)} {token}
              </strong>
            </div>
            <div className="summary-split">
              <div>
                <span>Ready recipients</span>
                <strong>{totals.validCount}</strong>
              </div>
              <div>
                <span>Settlement rail</span>
                <strong>{token}</strong>
              </div>
            </div>
            <p className="muted">{status}</p>
            <button
              className="button primary builder-run"
              disabled={isBusy}
              onClick={createAndRunBatch}
              suppressHydrationWarning
              type="button"
            >
              {isBusy ? "Running private payroll..." : "Shield funds and run payroll"}
            </button>
          </div>

          <div className="builder-steps">
            <div className="step-item">
              <span>01</span>
              <p>Validate roster, token, and amount integrity before execution.</p>
            </div>
            <div className="step-item">
              <span>02</span>
              <p>Shield funds into Cloak so the treasury movement is not exposed publicly.</p>
            </div>
            <div className="step-item">
              <span>03</span>
              <p>Deliver claim links and unlock audit access only when authorized.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
