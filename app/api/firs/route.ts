import { NextRequest, NextResponse } from "next/server";
import { getPersistentFirs, appendPersistentFir } from "@/lib/storage/persistence";
import type { FirRecord } from "@/lib/store";

export async function GET() {
  try {
    const firs = await getPersistentFirs();
    return NextResponse.json(firs);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load FIRs";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (!data.firNumber) {
      return NextResponse.json({ error: "FIR Number is required" }, { status: 400 });
    }

    const newFir: FirRecord = {
      id: data.id || `fir-${Date.now().toString().slice(-4)}`,
      caseId: data.caseId || "TR-102",
      firNumber: data.firNumber,
      policeStation: data.policeStation || "Cyber Crime Police Station",
      incidentDate: data.incidentDate || new Date().toISOString().split("T")[0],
      sections: data.sections || "Sec 66D IT Act & 420 IPC",
      complainant: data.complainant || "State Cyber Cell",
      accused: data.accused || "Unidentified Cyber Ring",
      description: data.description || "First Information Report registered.",
      fileName: data.fileName || `${data.firNumber.replace(/\//g, "_")}.pdf`,
      sha256Hash: data.sha256Hash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      status: data.status || "Registered",
      timestamp: data.timestamp || new Date().toISOString().replace("T", " ").slice(0, 19),
    };

    await appendPersistentFir(newFir);
    return NextResponse.json(newFir, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save FIR";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
