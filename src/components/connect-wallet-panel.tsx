"use client";

import type { JSX } from "react";

import { RuntimeInfo, SupportedToken } from "@/lib/types";

interface ConnectWalletPanelProps {
  runtime: RuntimeInfo;
}

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

function SolMark() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="cp-token-sol" x1="2" y1="6" x2="30" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="#0e0b1f" />
      <g fill="url(#cp-token-sol)">
        <path d="M10 9.6 L23.1 9.6 L25 11.4 L11.9 11.4 Z" />
        <path d="M8.9 14.9 L22 14.9 L23.9 16.7 L10.8 16.7 Z" />
        <path d="M10 20.2 L23.1 20.2 L25 22 L11.9 22 Z" />
      </g>
    </svg>
  );
}

function UsdcMark() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      <circle cx="16" cy="16" r="13" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="0.8" />
      <path
        d="M14.3 23.6 c-3.4-1-5.6-4-5.6-7.6 c0-3.6 2.2-6.6 5.6-7.6 c0.4-0.1 0.5-0.3 0.5-0.7 V7 c0-0.3-0.1-0.4-0.3-0.4 c-0.1 0-0.2 0-0.3 0.1 c-4.4 1.4-7.6 5.4-7.6 9.9 s3.2 8.5 7.6 9.9 c0.1 0 0.2 0.1 0.3 0.1 c0.2 0 0.3-0.1 0.3-0.4 v-0.6 c0-0.4-0.1-0.6-0.5-0.7 z"
        fill="#ffffff"
      />
      <path
        d="M17.7 8.4 c-0.4 0.1-0.5 0.3-0.5 0.7 V9.7 c0 0.4 0.1 0.5 0.5 0.7 c3.4 1 5.6 4 5.6 7.6 c0 3.6-2.2 6.6-5.6 7.6 c-0.4 0.1-0.5 0.3-0.5 0.7 V27 c0 0.3 0.1 0.4 0.3 0.4 c0.1 0 0.2 0 0.3-0.1 c4.4-1.4 7.6-5.4 7.6-9.9 s-3.2-8.5-7.6-9.9 c-0.1 0-0.2-0.1-0.3-0.1 c-0.2 0-0.3 0.1-0.3 0.4 z"
        fill="#ffffff"
      />
      <text
        x="16"
        y="17.5"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="13"
        fontWeight="800"
        fill="#ffffff"
        fontFamily="'Manrope', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
      >
        $
      </text>
    </svg>
  );
}

function UsdtMark() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#26A17B" />
      <path
        d="M17.6 14.4 V12.2 H22.5 V8.9 H9.5 V12.2 H14.4 V14.4 C10.4 14.6 7.4 15.4 7.4 16.3 C7.4 17.3 10.4 18.1 14.4 18.3 V24.7 H17.6 V18.3 C21.6 18.1 24.6 17.3 24.6 16.3 C24.6 15.4 21.6 14.6 17.6 14.4 Z M17.6 17.8 C17.5 17.8 16.8 17.8 16 17.8 C15.4 17.8 14.8 17.8 14.4 17.8 C11.4 17.6 9.2 17 9.2 16.3 C9.2 15.6 11.4 15 14.4 14.9 V17 C14.7 17 15.4 17.1 16 17.1 C16.8 17.1 17.4 17 17.6 17 V14.9 C20.6 15 22.8 15.6 22.8 16.3 C22.8 17 20.6 17.6 17.6 17.8 Z"
        fill="#ffffff"
      />
    </svg>
  );
}

const TOKEN_MARK: Record<SupportedToken, () => JSX.Element> = {
  SOL: SolMark,
  USDC: UsdcMark,
  USDT: UsdtMark,
};

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
              const Mark = TOKEN_MARK[entry.token];
              const fullLive = entry.livePayroll && entry.liveClaim;
              return (
                <div
                  className={`token-chip token-chip-${entry.token.toLowerCase()}`}
                  key={entry.token}
                  role="listitem"
                  title={entry.note}
                >
                  <span className="token-chip-glyph">
                    <Mark />
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
