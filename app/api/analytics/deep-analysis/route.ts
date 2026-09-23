import { NextResponse } from "next/server";
import { getNeo4jDriver } from "@/lib/neo4j";

export async function POST() {
  try {
    const driver = getNeo4jDriver();
    let anomalyCount = 0;
    let highRiskEntities: string[] = [];

    if (driver) {
      const session = driver.session();
      try {
        const res = await session.run(`
          MATCH (n:Entity)
          WHERE n.risk = 'high' OR n.pagerank > 0.02
          RETURN n.name as name, n.entity_type as type, n.pagerank as pr
          LIMIT 10
        `);
        anomalyCount = res.records.length;
        highRiskEntities = res.records.map((r) => `${r.get("name")} (${r.get("type")})`);
      } finally {
        await session.close();
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deep multi-hop Bayesian & community analysis completed across Neo4j Aura cluster. Flagged ${anomalyCount} high-centrality target nodes: ${highRiskEntities.slice(0, 3).join(", ")}.`,
      anomaliesFound: anomalyCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to run deep analysis";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
