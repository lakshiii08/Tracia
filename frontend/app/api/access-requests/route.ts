import { NextRequest, NextResponse } from "next/server";
import type { AccessRequest } from "@/types/accessControl";

let accessStore: AccessRequest[] = [];

export async function GET() {
  return NextResponse.json(accessStore);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const count = accessStore.length + 1;
    const newReq: AccessRequest = {
      id: `req-${100 + count}`,
      requestId: `AR-2025-00${count}`,
      userId: data.userId || "",
      userName: data.userName || "",
      userRole: data.userRole || "INVESTIGATING_OFFICER",
      caseId: data.caseId || "",
      caseTitle: data.caseTitle || "",
      currentLevel: data.currentLevel || "L1",
      requestedLevel: data.requestedLevel || "L2",
      reason: data.reason || "",
      status: "PENDING",
      createdAt: new Date().toLocaleString(),
    };
    accessStore = [newReq, ...accessStore];
    return NextResponse.json(newReq, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create access request";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
