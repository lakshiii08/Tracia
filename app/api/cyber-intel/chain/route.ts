import { NextRequest, NextResponse } from "next/server";
import type { CyberChain } from "@/types/cyberIntel";
import { getNeo4jDriver } from "@/lib/neo4j";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("caseId");
  void caseId;

  try {
    const driver = getNeo4jDriver();
    let suspectName = "Person A";
    let emailOrPhone = "+91 9123456780";

    if (driver) {
      const session = driver.session();
      try {
        const res = await session.run(`
          MATCH (p)-[r]->(t)
          WHERE (toLower(coalesce(p.type, p.entity_type, '')) IN ['person'] OR any(l in labels(p) WHERE toLower(l) = 'person'))
            AND (toLower(coalesce(t.type, t.entity_type, '')) IN ['phone', 'email', 'account'] OR any(l in labels(t) WHERE toLower(l) IN ['phone', 'email', 'account']))
          RETURN coalesce(p.name, p.label, p.id) as person, 
                 coalesce(t.name, t.label, t.id) as target
          LIMIT 1
        `);
        if (res.records.length > 0) {
          suspectName = String(res.records[0].get("person") || "Person A");
          emailOrPhone = String(res.records[0].get("target") || "+91 9123456780");
        }
      } finally {
        await session.close();
      }
    }

    const liveChain: CyberChain = {
      nodes: [
        { id: "node-person", type: "PERSON", title: "PRIMARY SUSPECT", value: suspectName, tone: "blue" },
        { id: "node-endpoint", type: "ENDPOINT", title: "INTERCEPTED LINE", value: emailOrPhone, tone: "amber" },
        { id: "node-proxy", type: "PROXY", title: "VOIP GATEWAY", value: "198.51.100.42 (Bandra Kurla Relay)", tone: "rose" },
        { id: "node-sink", type: "ACCOUNT", title: "SETTLEMENT SINK", value: "Account - 4567 (XYZ Logistics)", tone: "emerald" },
      ],
      steps: [
        { fromNodeId: "node-person", toNodeId: "node-endpoint", label: "OPERATES_LINE" },
        { fromNodeId: "node-endpoint", toNodeId: "node-proxy", label: "ROUTED_VIA" },
        { fromNodeId: "node-proxy", toNodeId: "node-sink", label: "SIPHONS_TO" },
      ],
    };

    return NextResponse.json(liveChain);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch cyber chain";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
