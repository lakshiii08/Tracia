import { NextRequest, NextResponse } from "next/server";
import type { AuditEntry } from "@/lib/store";

let serverAuditStore: AuditEntry[] = [];

export async function GET() {
  return NextResponse.json(serverAuditStore);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newEntry: AuditEntry = {
      id: `aud-${Date.now()}`,
      time: new Date().toISOString().replace("T", " ").substring(0, 19),
      message: body.message || "Audit trail event recorded",
      actor: body.actor || "SYSTEM",
    };
    serverAuditStore = [newEntry, ...serverAuditStore];
    return NextResponse.json(newEntry, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record audit entry";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
