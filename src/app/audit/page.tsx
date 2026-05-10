"use client";

import { useEffect, useState } from "react";

import { AuditPortal } from "@/components/audit-portal";
import { fetchAuditState } from "@/lib/api";
import { AuditSession, PayrollBatch } from "@/lib/types";

export default function AuditPage() {
  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      setError("");
      const state = await fetchAuditState();
      setBatches(state.batches);
      setSessions(state.sessions);
    } catch (auditError) {
      setError(auditError instanceof Error ? auditError.message : "Unable to load audit state.");
    }
  }

  return (
    <div className="page">
      {error ? <p className="error-text">{error}</p> : null}
      <AuditPortal batches={batches} onRefresh={refresh} sessions={sessions} />
    </div>
  );
}
