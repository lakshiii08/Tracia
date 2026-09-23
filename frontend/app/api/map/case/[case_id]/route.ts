import { NextRequest, NextResponse } from "next/server";
import { buildNeo4jMapData } from "@/lib/neo4jSpatial";
import { fetchRenderJson } from "@/lib/renderApi";

function hasFeatures(payload: unknown) {
  return Array.isArray((payload as { features?: unknown[] }).features) && (payload as { features: unknown[] }).features.length > 0;
}

export async function GET(request: NextRequest, context: RouteContext<"/api/map/case/[case_id]">) {
  const { case_id } = await context.params;

  // 1. Prioritize live Neo4j Aura AI Spatial Data for this investigation
  const neo4jMap = await buildNeo4jMapData(case_id);
  if (neo4jMap && neo4jMap.features.length > 0) {
    return NextResponse.json(neo4jMap);
  }

  // 2. Fallback to remote API if local/Aura has no mapped points
  const sourceUrl = new URL(request.url);
  const renderPath = `/api/map/case/${encodeURIComponent(case_id)}${sourceUrl.search}`;
  const renderResponse = await fetchRenderJson<unknown>(renderPath);

  if (renderResponse.ok && hasFeatures(renderResponse.data)) {
    return NextResponse.json(renderResponse.data);
  }

  return NextResponse.json(neo4jMap);
}
