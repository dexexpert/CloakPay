"use client";

import { RuntimeInfo, SupportedToken } from "@/lib/types";

interface ConnectWalletPanelProps {
  runtime: RuntimeInfo;
}

const TOKEN_GLYPH: Record<SupportedToken, string> = {
  SOL: "◎",
  USDC: "$",
  USDT: "₮",
};

function getHostname(url: string): string {
  if (!url) {
    return "";
  }
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  }
}

export function ConnectWalletPanel({ runtime }: ConnectWalletPanelProps) {
  const isLive = runtime.mode === "live";
  const modeLabel = isLive ? "Live treasury signer" : "Demo backend mode";

  return (
    <div className="panel hero-panel dashboard-hero">
      <div className="dashboard-hero-copy">
        <p className="eyebrow">Treasury control</p>
        <h1>Run payroll privately, keep review rights explicit</h1>
        <p className="muted">
          CloakPay is built for finance leads who need shielded execution without giving up clean reporting.
        </p>
        <div className="hero-inline-stats">
          <div className="hero-inline-stat">
            <span>Execution mode</span>
            <strong>Batch disbursement</strong>
          </div>
          <div className="hero-inline-stat">
            <span>Audit model</span>
            <strong>Chain-scanned viewing key</strong>
          </div>
        </div>
      </div>

      <div className="wallet-box wallet-box-upgraded">
        <div className={`mode-badge mode-${runtime.mode}`} role="status">
          <span className="mode-badge-dot" aria-hidden="true" />
          <span className="mode-badge-label">{modeLabel}</span>
        </div>

        <p className="muted wallet-description">{runtime.note}</p>

        <div className="wallet-info-list">
          <div className="wallet-info-row">
            <span className="wallet-info-label">Organization</span>
            <strong className="wallet-info-value">{runtime.organizationName}</strong>
          </div>
          <div className="wallet-info-row">
            <span className="wallet-info-label">RPC</span>
            <strong className="wallet-info-value" title={runtime.rpcUrl}>
              {getHostname(runtime.rpcUrl)}
            </strong>
          </div>
          <div className="wallet-info-row">
            <span className="wallet-info-label">Relay</span>
            <strong className="wallet-info-value" title={runtime.relayUrl}>
              {getHostname(runtime.relayUrl)}
            </strong>
          </div>
        </div>

        {runtime.tokenSupport.length > 0 ? (
          <div className="token-chip-row" role="list">
            {runtime.tokenSupport.map((entry) => {
              const fullLive = entry.livePayroll && entry.liveClaim;
              return (
                <div
                  className={`token-chip token-chip-${entry.token.toLowerCase()}`}
                  key={entry.token}
                  role="listitem"
                  title={entry.note}
                >
                  <span className="token-chip-glyph" aria-hidden="true">
                    {TOKEN_GLYPH[entry.token]}
                  </span>
                  <span className="token-chip-symbol">{entry.token}</span>
                  <span
                    className={`token-chip-status ${fullLive ? "is-live" : "is-partial"}`}
                    aria-label={fullLive ? "Full live support" : "Partial support"}
                  />
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
