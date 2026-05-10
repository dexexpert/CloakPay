import { NextRequest, NextResponse } from "next/server";

import { createAndExecuteBatch } from "@/lib/server/payroll-service";
import { CreateBatchRequest } from "@/lib/server/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateBatchRequest;
    const batch = await createAndExecuteBatch(body);

    if (batch.status === "failed") {
      return NextResponse.json({ error: batch.failureReason ?? "Batch execution failed.", batch }, { status: 400 });
    }

    return NextResponse.json({ batch });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create payroll batch." },
      { status: 400 },
    );
  }
}
