import { NextRequest, NextResponse } from "next/server";
import { queryGraphFromNeo4j } from "@/lib/neo4j";
import { buildCaseGraphCypher, resolveCaseGraphParams } from "@/lib/caseGraph";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cypher = searchParams.get("cypher") || undefined;
    const caseId = searchParams.get("caseId") || undefined;
    const query = !cypher && caseId ? buildCaseGraphCypher() : cypher;
    const params = !cypher && caseId ? await resolveCaseGraphParams(caseId) : undefined;
    const result = await queryGraphFromNeo4j(query, params);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch graph data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cypher = body.cypher as string | undefined;
    const caseId = body.caseId as string | undefined;
    const query = !cypher && caseId ? buildCaseGraphCypher() : cypher;
    const params = !cypher && caseId ? await resolveCaseGraphParams(caseId) : undefined;
    const result = await queryGraphFromNeo4j(query, params);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to execute Cypher query";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
