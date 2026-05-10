import { NextRequest, NextResponse } from "next/server";

import { resolveAuditReport } from "@/lib/server/payroll-service";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { key?: string };
  const key = body.key?.trim();

  if (!key) {
    return NextResponse.json({ error: "Viewing key is required." }, { status: 400 });
  }

  const result = await resolveAuditReport(key);
  if (!result) {
    return NextResponse.json({ error: "Viewing key not recognized." }, { status: 404 });
  }

  return NextResponse.json(result);
}
