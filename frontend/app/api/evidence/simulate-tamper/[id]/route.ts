import { NextRequest, NextResponse } from "next/server";
import { simulatePersistentEvidenceTamper } from "@/lib/server/evidenceLedger";

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL || "";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (FASTAPI_URL) {
    try {
      const res = await fetch(`${FASTAPI_URL.replace(/\/$/, "")}/api/evidence/simulate-tamper/${encodeURIComponent(id)}`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // External service unavailable; use local persistent ledger.
    }
  }

  const record = await simulatePersistentEvidenceTamper(id);
  if (!record) {
    return NextResponse.json({ detail: `Evidence '${id}' not found` }, { status: 404 });
  }

  return NextResponse.json({
    message: `File tampering simulated on ${id}: 1 byte altered in storage.`,
    evidence_id: id,
    original_registered_hash: record.original_sha256 || record.sha256,
    new_tampered_hash: record.sha256,
    instruction: "Now run verification to observe POTENTIAL INTEGRITY MISMATCH alert.",
  });
}
