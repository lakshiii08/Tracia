import { NextRequest, NextResponse } from "next/server";
import { fetchRenderJson } from "@/lib/renderApi";

export async function GET(request: NextRequest, context: RouteContext<"/api/map/[...path]">) {
  const { path } = await context.params;
  const sourceUrl = new URL(request.url);
  const renderPath = `/api/map/${path.map(encodeURIComponent).join("/")}${sourceUrl.search}`;
  const renderResponse = await fetchRenderJson<unknown>(renderPath);

  if (renderResponse.ok) return NextResponse.json(renderResponse.data);

  return NextResponse.json(
    { error: renderResponse.error, source: "render", path: renderPath },
    { status: renderResponse.status || 502 }
  );
}
