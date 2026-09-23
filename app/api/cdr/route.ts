import { NextRequest, NextResponse } from "next/server";
import type { CdrRecord } from "@/types/cdr";
import { getAuthorizedCdrRecords, addAuthorizedCdrRecord } from "@/server/authorizedCdrStore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("caseId");
  void caseId;
  return NextResponse.json(getAuthorizedCdrRecords());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newRecord: CdrRecord = {
      id: `cdr-${Date.now().toString().slice(-4)}`,
      caller: body.caller || "",
      callerName: body.callerName || "",
      receiver: body.receiver || "",
      receiverName: body.receiverName || "",
      durationSec: body.durationSec || 60,
      timestamp: body.timestamp || new Date().toISOString().replace("T", " ").slice(0, 19),
      towerLocation: body.towerLocation || "",
      crossCaseOverlap: Boolean(body.crossCaseOverlap),
    };
    addAuthorizedCdrRecord(newRecord);
    return NextResponse.json(newRecord, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to register CDR record";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
