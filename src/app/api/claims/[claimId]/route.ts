import { NextResponse } from "next/server";

import { getClaim } from "@/lib/server/payroll-service";

export async function GET(_: Request, context: { params: Promise<{ claimId: string }> }) {
  const { claimId } = await context.params;
  const claim = await getClaim(claimId);

  if (!claim) {
    return NextResponse.json({ error: "Claim link not found." }, { status: 404 });
  }

  return NextResponse.json(claim);
}
