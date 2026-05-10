"use client";

import { RuntimeInfo } from "@/lib/types";

interface ConnectWalletPanelProps {
  runtime: RuntimeInfo;
}

export function ConnectWalletPanel({ runtime }: ConnectWalletPanelProps) {
  return (
    <div className="panel hero-panel dashboard-hero">
      <div className="dashboard-hero-copy">
        <p className="eyebrow">Treasury control</p>
        <h1>Run payroll privately, keep review rights explicit</h1>
        <p className="muted">
          CloakPay is built for finance leads who need shielded execution without giving up clean reporting.
        </p>
        <div className="hero-inline-stats">
          <div>
            <span>Execution mode</span>
            <strong>Batch disbursement</strong>
          </div>
          <div>
            <span>Audit model</span>
            <strong>Chain-scanned viewing key</strong>
          </div>
        </div>
      </div>

      <div className="wallet-box wallet-box-upgraded">
        <div className="wallet-status-line">
          <span className={`dot ${runtime.mode === "live" ? "dot-live" : "dot-idle"}`} />
          <p className="wallet-label">{runtime.mode === "live" ? "Server treasury signer" : "Demo backend mode"}</p>
        </div>
        <strong className="wallet-address">{runtime.treasuryWallet}</strong>
        <p className="muted wallet-description">
          {runtime.note}
        </p>
        <div className="wallet-meta-grid">
          <div className="wallet-meta">
            <span>Mode</span>
            <strong>{runtime.mode === "live" ? "Live Cloak execution" : "Persistent demo execution"}</strong>
          </div>
          <div className="wallet-meta">
            <span>Organization</span>
            <strong>{runtime.organizationName}</strong>
          </div>
        </div>
        <div className="wallet-meta-grid">
          <div className="wallet-meta">
            <span>RPC</span>
            <strong>{runtime.rpcUrl}</strong>
          </div>
          <div className="wallet-meta">
            <span>Relay</span>
            <strong>{runtime.relayUrl}</strong>
          </div>
        </div>

        <div className="token-support-grid">
          {runtime.tokenSupport.map((entry) => (
            <div className="token-support-card" key={entry.token}>
              <div className="token-support-head">
                <strong>{entry.token}</strong>
                <span className={`status-pill ${entry.liveClaim ? "status-success" : "status-progress"}`}>
                  {entry.livePayroll && entry.liveClaim ? "full live" : "live payroll"}
                </span>
              </div>
              <p className="muted">{entry.note}</p>
              {entry.mintAddress ? <code className="token-support-mint">{entry.mintAddress}</code> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
