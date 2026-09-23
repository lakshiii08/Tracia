import { NextResponse } from "next/server";
import { seedNeo4jData } from "@/lib/neo4j";

export async function POST() {
  try {
    const result = await seedNeo4jData();
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to seed Neo4j data";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
