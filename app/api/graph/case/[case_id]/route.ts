import { NextRequest, NextResponse } from "next/server";
import { buildCaseGraphCypher, resolveCaseGraphParams } from "@/lib/caseGraph";
import { queryGraphFromNeo4j } from "@/lib/neo4j";
import { fetchRenderJson } from "@/lib/renderApi";

function hasGraph(payload: unknown) {
  const data = payload as { nodes?: unknown[]; edges?: unknown[]; relationships?: unknown[] };
  return Array.isArray(data.nodes) && data.nodes.length > 0 && (Array.isArray(data.edges) || Array.isArray(data.relationships));
}

export async function GET(request: NextRequest, context: RouteContext<"/api/graph/case/[case_id]">) {
  const { case_id } = await context.params;
  const sourceUrl = new URL(request.url);
  const renderPath = `/api/graph/case/${encodeURIComponent(case_id)}${sourceUrl.search}`;
  const renderResponse = await fetchRenderJson<unknown>(renderPath);

  if (renderResponse.ok && hasGraph(renderResponse.data)) {
    return NextResponse.json(renderResponse.data);
  }

  const params = await resolveCaseGraphParams(case_id);
  const graph = await queryGraphFromNeo4j(buildCaseGraphCypher(), params);
  return NextResponse.json(graph);
}
