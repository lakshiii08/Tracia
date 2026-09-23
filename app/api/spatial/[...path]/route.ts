import { NextRequest, NextResponse } from "next/server";
import { buildNeo4jCaseList, buildNeo4jMapData } from "@/lib/neo4jSpatial";

const SPATIAL_API_BASE =
  process.env.NEXT_PUBLIC_SPATIAL_API_URL ||
  process.env.SPATIAL_API_URL ||
  "https://criminal-network-api-latest.onrender.com/api/v1";

function isJson(contentType: string | null) {
  return contentType?.toLowerCase().includes("application/json") ?? false;
}

function hasSpatialData(path: string[], payload: unknown) {
  if (path.length === 2 && path[0] === "map" && path[1] === "cases") {
    return Array.isArray((payload as { cases?: unknown[] }).cases) && (payload as { cases: unknown[] }).cases.length > 0;
  }

  if (path.length === 3 && path[0] === "map" && path[1] === "cases") {
    return Array.isArray((payload as { features?: unknown[] }).features) && (payload as { features: unknown[] }).features.length > 0;
  }

  return true;
}

async function neo4jSpatialFallback(path: string[]) {
  if (path.length === 2 && path[0] === "map" && path[1] === "cases") {
    return NextResponse.json(await buildNeo4jCaseList());
  }

  if (path.length === 3 && path[0] === "map" && path[1] === "cases") {
    return NextResponse.json(await buildNeo4jMapData(decodeURIComponent(path[2])));
  }

  return null;
}

async function proxySpatialRequest(request: NextRequest, context: RouteContext<"/api/spatial/[...path]">) {
  const { path } = await context.params;
  const upstreamPath = path.map(encodeURIComponent).join("/");
  const sourceUrl = new URL(request.url);
  const upstreamUrl = `${SPATIAL_API_BASE.replace(/\/$/, "")}/${upstreamPath}${sourceUrl.search}`;

  try {
    const response = await fetch(upstreamUrl, { cache: "no-store" });
    const contentType = response.headers.get("content-type") || "application/json";
    const body = await response.text();
    if (response.ok && isJson(contentType)) {
      try {
        const payload = JSON.parse(body);
        if (!hasSpatialData(path, payload)) {
          const fallback = await neo4jSpatialFallback(path);
          if (fallback) return fallback;
        }
      } catch {}
    }

    return new NextResponse(body, {
      status: response.status,
      headers: { "content-type": contentType },
    });
  } catch (error: unknown) {
    const fallback = await neo4jSpatialFallback(path);
    if (fallback) return fallback;

    const message = error instanceof Error ? error.message : "Spatial intelligence service unavailable";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: RouteContext<"/api/spatial/[...path]">) {
  return proxySpatialRequest(request, context);
}
