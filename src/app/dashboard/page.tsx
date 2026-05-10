"use client";

import { useEffect, useState } from "react";

import { BatchTable } from "@/components/batch-table";
import { ConnectWalletPanel } from "@/components/connect-wallet-panel";
import { MetricCard } from "@/components/metric-card";
import { PayrollBuilder } from "@/components/payroll-builder";
import { fetchDashboard } from "@/lib/api";
import { DashboardPayload, DashboardStats, PayrollBatch, RuntimeInfo } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const initialStats: DashboardStats = {
  totalBatches: 0,
  privateVolume: 0,
  recipientCount: 0,
  pendingClaims: 0,
};
const initialRuntime: RuntimeInfo = {
  mode: "demo",
  organizationName: "CloakPay Demo DAO",
  treasuryWallet: "loading...",
  relayUrl: "https://api.cloak.ag",
  rpcUrl: "https://api.mainnet-beta.solana.com",
  isLiveConfigured: false,
  note: "Loading backend runtime configuration...",
  tokenSupport: [],
};

export default function DashboardPage() {
  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [runtime, setRuntime] = useState<RuntimeInfo>(initialRuntime);
  const [error, setError] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  async function refresh(nextBatch?: PayrollBatch) {
    try {
      setError("");
      const payload = (await fetchDashboard()) as DashboardPayload;
      setBatches(nextBatch ? [nextBatch, ...payload.batches.filter((batch) => batch.id !== nextBatch.id)] : payload.batches);
      setStats(payload.stats);
      setRuntime(payload.runtime);
    } catch (dashboardError) {
      setError(dashboardError instanceof Error ? dashboardError.message : "Unable to load dashboard data.");
    }
  }

  return (
    <div className="page dashboard-page">
      <ConnectWalletPanel runtime={runtime} />

      <section className="metrics-grid">
        <MetricCard
          detail="Payroll runs preserved in the backend state store"
          label="Batches"
          value={String(stats.totalBatches)}
        />
        <MetricCard
          detail="Private volume processed through CloakPay"
          label="Private volume"
          value={`${formatCurrency(stats.privateVolume, "USDC")} USDC`}
        />
        <MetricCard
          detail="Recipients covered across all runs"
          label="Recipients"
          value={String(stats.recipientCount)}
        />
        <MetricCard
          detail="Recipients who have not confirmed receipt"
          label="Pending claims"
          value={String(stats.pendingClaims)}
        />
      </section>

      <section className="dashboard-storyband">
        <div className="dashboard-storycard">
          <p className="eyebrow">Execution posture</p>
          <h2>Build the batch, shield funds, then disburse privately in one operator flow.</h2>
        </div>
        <div className="dashboard-storycard compact">
          <span className="story-metric">{runtime.organizationName}</span>
          <p className="muted">{runtime.mode === "live" ? "Live treasury signer workspace" : "Server-backed demo workspace"}</p>
        </div>
      </section>

      {error ? <p className="error-text">{error}</p> : null}

      <PayrollBuilder onBatchCreated={refresh} wallet={runtime.treasuryWallet} />
      <BatchTable batches={batches} />
    </div>
  );
}
