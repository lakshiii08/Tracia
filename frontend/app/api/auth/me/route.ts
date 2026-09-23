import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("tracia_access_token")?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      operatorId: payload.sub,
      role: payload.role,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
