import { NextResponse } from "next/server";
import { getPersistentEvidenceLedger } from "@/lib/server/evidenceLedger";

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL || "";

export async function GET() {
  if (FASTAPI_URL) {
    try {
      const res = await fetch(`${FASTAPI_URL.replace(/\/$/, "")}/api/evidence`, {
        method: "GET",
        next: { revalidate: 0 },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.every((item) => "evidence_id" in item)) {
          return NextResponse.json(data);
        }
      }
    } catch {
      // External evidence service unavailable; use local ledger derived from persistence.
    }
  }

  const records = await getPersistentEvidenceLedger();
  return NextResponse.json(records);
}
