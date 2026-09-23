import { NextRequest, NextResponse } from "next/server";
import {
  getPersistentEvidence,
  savePersistentEvidence,
} from "@/lib/storage/persistence";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const evidence = await getPersistentEvidence();
    const index = evidence.findIndex((file) => file.id.toLowerCase() === id.toLowerCase());
    if (index === -1) {
      return NextResponse.json({ error: `Evidence '${id}' not found` }, { status: 404 });
    }
    const updated = {
      ...evidence[index],
      status: body.status || evidence[index].status,
      progress: body.progress ?? evidence[index].progress,
    };
    evidence[index] = updated;
    await savePersistentEvidence(evidence);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update evidence status";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
