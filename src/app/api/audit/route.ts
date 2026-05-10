import { NextResponse } from "next/server";

import { listAuditState } from "@/lib/server/payroll-service";

export async function GET() {
  const state = await listAuditState();
  return NextResponse.json(state);
}
