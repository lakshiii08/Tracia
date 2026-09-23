import { NextRequest, NextResponse } from "next/server";
import { queryGraphFromNeo4j } from "@/lib/neo4j";
import { buildCaseGraphCypher, resolveCaseGraphParams } from "@/lib/caseGraph";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cypher = searchParams.get("cypher") || undefined;
    const caseId = searchParams.get("caseId") || undefined;

    let queryToRun = cypher;
    let params: Record<string, unknown> | undefined;
    if (!queryToRun && caseId) {
      queryToRun = buildCaseGraphCypher();
      params = await resolveCaseGraphParams(caseId);
    }

    const result = await queryGraphFromNeo4j(queryToRun, params);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch graph data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
