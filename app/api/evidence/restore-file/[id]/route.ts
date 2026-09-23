import { NextRequest, NextResponse } from "next/server";
import { restorePersistentEvidence } from "@/lib/server/evidenceLedger";

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL || "";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (FASTAPI_URL) {
    try {
      const res = await fetch(`${FASTAPI_URL.replace(/\/$/, "")}/api/evidence/restore-file/${encodeURIComponent(id)}`, {
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

  const record = await restorePersistentEvidence(id);
  if (!record) {
    return NextResponse.json({ detail: `Evidence '${id}' not found` }, { status: 404 });
  }

  return NextResponse.json({
    message: `Original evidence file restored successfully for ${id}.`,
    evidence_id: id,
    restored_hash: record.sha256,
  });
}
