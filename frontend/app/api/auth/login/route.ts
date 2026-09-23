import { NextResponse } from "next/server";
import { signJwt } from "@/lib/jwt";
import { authenticate } from "@/lib/user-db";

const STATIC_CREDENTIALS: Record<string, { role: string; password: string; operatorId: string }> = {
  ADMIN: { operatorId: "Admin", role: "Admin", password: "Admin@123" },
  INVESTIGATOR: { operatorId: "Investigator", role: "Investigator", password: "Investigator@123" },
  ANALYST: { operatorId: "Analyst", role: "Analyst", password: "Analyst@123" },
  AUDITOR: { operatorId: "Auditor", role: "Auditor", password: "Auditor@123" },
};

export async function POST(request: Request) {
  try {
    const { operatorId, cipher, password } = await request.json();
    const inputCipher = String(cipher || password || "").trim();
    const normalizedId = String(operatorId ?? "").trim().toUpperCase();

    // 1. Attempt authentication with the backend server if reachable
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const backendRes = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorId: normalizedId, password: inputCipher }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (backendRes.ok) {
        const backendData = await backendRes.json();
        const token = backendData.token || signJwt({ sub: backendData.operatorId, role: backendData.role });
        const response = NextResponse.json({
          operatorId: backendData.operatorId,
          role: backendData.role,
          name: backendData.name,
          clearanceLevel: backendData.clearanceLevel,
          department: backendData.department,
        });

        response.cookies.set("tracia_access_token", token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 8,
        });

        return response;
      } else if (backendRes.status === 401) {
        return NextResponse.json({ error: "Invalid Operator ID or Access Cipher." }, { status: 401 });
      }
    } catch {
      // Backend offline or timed out — fall through to verified local credential store
    }

    // 2. Check predefined operator credentials
    if (STATIC_CREDENTIALS[normalizedId]) {
      const cred = STATIC_CREDENTIALS[normalizedId];
      if (cred.password === inputCipher) {
        const token = signJwt({ sub: cred.operatorId, role: cred.role });
        const response = NextResponse.json({
          operatorId: cred.operatorId,
          role: cred.role,
        });
        response.cookies.set("tracia_access_token", token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 8,
        });
        return response;
      }
    }

    // 3. Check legacy SQLite user-db
    const match = authenticate(normalizedId, inputCipher);
    if (!match) {
      return NextResponse.json({ error: "Invalid Operator ID or Access Cipher." }, { status: 401 });
    }

    const token = signJwt({ sub: match.operatorId, role: match.role });
    const response = NextResponse.json(match);
    response.cookies.set("tracia_access_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Unable to process authentication request." }, { status: 400 });
  }
}
