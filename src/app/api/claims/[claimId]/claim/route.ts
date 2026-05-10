import { NextResponse } from "next/server";

import { claimPayment } from "@/lib/server/payroll-service";

export async function POST(_: Request, context: { params: Promise<{ claimId: string }> }) {
  try {
    const { claimId } = await context.params;
    const result = await claimPayment(claimId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to claim payment." },
      { status: 400 },
    );
  }
}
