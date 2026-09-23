import { NextRequest, NextResponse } from "next/server";
import type { DataSourceCounts } from "@/types/graph";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    searchParams.get("caseId");

    const counts: DataSourceCounts = {
      fir: 0,
      cdr: 0,
      financial: 0,
      location: 0,
    };

    return NextResponse.json(counts);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to calculate data source counts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
