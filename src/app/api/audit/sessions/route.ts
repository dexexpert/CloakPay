import { NextRequest, NextResponse } from "next/server";

import { createAuditSession } from "@/lib/server/payroll-service";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { batchId: string; scope?: "batch" | "organization" };
    const result = await createAuditSession(body.batchId, body.scope ?? "batch");
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create audit session." },
      { status: 400 },
    );
  }
}
