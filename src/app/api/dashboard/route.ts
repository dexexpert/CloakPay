import { NextResponse } from "next/server";

import { getDashboardPayload } from "@/lib/server/payroll-service";

export async function GET() {
  const payload = await getDashboardPayload();
  return NextResponse.json(payload);
}
