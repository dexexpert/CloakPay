"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { ClaimCard } from "@/components/claim-card";
import { fetchClaim } from "@/lib/api";
import { PayrollBatch, PayrollRecipient } from "@/lib/types";

export default function ClaimPage() {
  const params = useParams<{ claimId: string }>();
  const [match, setMatch] = useState<{ batch: PayrollBatch; recipient: PayrollRecipient } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadClaim() {
      try {
        setError("");
        const payload = await fetchClaim(params.claimId);
        setMatch(payload);
      } catch (claimError) {
        setMatch(null);
        setError(claimError instanceof Error ? claimError.message : "Claim page could not be loaded.");
      }
    }

    loadClaim();
  }, [params.claimId]);

  return (
    <div className="page">
      {match ? (
        <ClaimCard batch={match.batch} recipient={match.recipient} />
      ) : (
        <section className="panel empty-state">{error || "This claim link is missing or has already been cleared."}</section>
      )}
    </div>
  );
}
