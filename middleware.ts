import { NextRequest, NextResponse } from "next/server";
import { verifyJwtEdge } from "@/lib/jwt-verify";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout", "/favicon.ico"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const token = request.cookies.get("tracia_access_token")?.value;
  const valid = token ? await verifyJwtEdge(token) : null;

  if (isPublic) {
    if (pathname === "/login" && valid) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }

  if (!valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (token) response.cookies.delete("tracia_access_token");
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
