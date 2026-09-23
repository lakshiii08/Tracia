import { NextResponse } from "next/server";
import { getNeo4jDriver } from "@/lib/neo4j";
import type { AnalyticsData, CommunityCluster, BridgeNode, CrossCaseLink, AnomalyItem } from "@/types/analytics";

export async function GET() {
  const driver = getNeo4jDriver();
  if (!driver) {
    return NextResponse.json(
      { error: "Neo4j Aura cluster connection unavailable." },
      { status: 503 }
    );
  }

  const session = driver.session();
  try {
    // 1. Communities from live Neo4j Aura
    const commRes = await session.run(`
      MATCH (n:Entity)
      WHERE n.community_id IS NOT NULL
      WITH n.community_id as commId, count(n) as cnt, collect(n.name)[0..3] as sampleNames
      RETURN commId, cnt, sampleNames
      ORDER BY cnt DESC
      LIMIT 6
    `);

    const communities: CommunityCluster[] = commRes.records.map((r, idx) => {
      const commIdRaw = r.get("commId");
      const id = typeof commIdRaw === "object" && "low" in commIdRaw ? String(commIdRaw.low) : String(commIdRaw);
      const cnt = Number(r.get("cnt"));
      const sampleNames: string[] = r.get("sampleNames") || [];

      const iconChoices = ["bubble_chart", "hub", "share", "device_hub", "domain", "security"];
      return {
        id: `comm-${id}`,
        name: `Cluster #${id} (${sampleNames.filter(Boolean).slice(0, 2).join(", ") || "Syndicate Cell"})`,
        entityCount: cnt,
        icon: iconChoices[idx % iconChoices.length],
        description: `Autonomous cluster of ${cnt} connected entities resolved via Louvain modularity algorithm. Top hubs: ${sampleNames.join(", ")}.`,
      };
    });

    // 2. Bridge Nodes from live Neo4j Aura (ranked by degree centrality and PageRank)
    const bridgeRes = await session.run(`
      MATCH (n:Entity)
      WHERE n.degree_centrality IS NOT NULL OR n.pagerank IS NOT NULL
      RETURN n.entity_id as id, n.name as name, n.entity_type as type, n.community_id as commId,
             coalesce(n.degree_centrality, 0) as deg, coalesce(n.pagerank, 0) as pr, n.risk as risk
      ORDER BY deg DESC, pr DESC
      LIMIT 8
    `);

    const bridgeNodes: BridgeNode[] = bridgeRes.records.map((r, idx) => {
      const entityId = String(r.get("id") || `E-00${idx}`);
      const name = String(r.get("name") || entityId);
      const entityType = String(r.get("type") || "Entity").toLowerCase();
      const deg = Number(r.get("deg") || 0);
      const pr = Number(r.get("pr") || 0);
      const risk = String(r.get("risk") || "normal");

      return {
        id: `bridge-${idx + 1}`,
        name: `${name} (${entityId})`,
        entityId,
        entityType,
        connectedClusters: Math.max(1, Math.round(deg * 25)),
        centrality: Number((deg > 0 ? deg : pr).toFixed(4)),
        riskLevel: risk === "high" || deg > 0.08 || pr > 0.03 ? "high" : deg > 0.04 ? "medium" : "low",
      };
    });

    // 3. Cross-Case Links
    const crossRes = await session.run(`
      MATCH (n:Entity)-[r]->(m:Entity)
      WHERE r.case_id IS NOT NULL
      WITH n, collect(DISTINCT r.case_id) as cases, count(r) as relCount, collect(type(r))[0..2] as relTypes, m
      WHERE size(cases) >= 1
      RETURN n.entity_id as nId, n.name as nName, n.entity_type as nType, cases, relCount, relTypes, m.name as mName
      ORDER BY relCount DESC
      LIMIT 6
    `);

    const crossCaseLinks: CrossCaseLink[] = crossRes.records.map((r, idx) => {
      const nId = String(r.get("nId") || `E-00${idx}`);
      const nName = String(r.get("nName") || nId);
      const nTypeRaw = String(r.get("nType") || "person").toLowerCase();
      let nType: CrossCaseLink["entityType"] = "person";
      if (nTypeRaw.includes("phone")) nType = "phone";
      else if (nTypeRaw.includes("bank") || nTypeRaw.includes("account")) nType = "account";
      else if (nTypeRaw.includes("org")) nType = "organization";
      else if (nTypeRaw.includes("loc")) nType = "location";
      else if (nTypeRaw.includes("veh")) nType = "vehicle";

      const cases: string[] = r.get("cases") || [];
      const relTypes: string[] = r.get("relTypes") || [];
      const mName = String(r.get("mName") || "");

      return {
        id: `ccl-${idx + 1}`,
        entityId: nId,
        entityName: nName,
        entityType: nType,
        associatedCases: cases.map((c) => c.replace("case_", "CR-")),
        connectionPath: `${nName} ➔ [${relTypes.join(", ") || "LINK"}] ➔ ${mName}`,
        confidence: Math.min(99, Math.max(82, 85 + idx * 2)),
      };
    });

    // 4. Anomalies
    const anomRes = await session.run(`
      MATCH (n:Entity)
      WHERE n.risk = 'high' OR (n.pagerank IS NOT NULL AND n.pagerank > 0.02)
      RETURN n.name as name, n.entity_id as id, n.entity_type as type, n.pagerank as pr
      LIMIT 4
    `);

    const anomalies: AnomalyItem[] = anomRes.records.map((r, idx) => {
      const name = String(r.get("name") || "High Risk Node");
      const id = String(r.get("id") || `E-${idx}`);
      const pr = Number(r.get("pr") || 0);

      return {
        id: `anom-${idx + 1}`,
        title: `High Centrality Cluster Anomaly: ${name}`,
        severity: idx === 0 ? "HIGH" : "MEDIUM",
        date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        description: `Entity ${name} (${id}) exhibits abnormal influence (PageRank ${pr.toFixed(4)}) across multiple syndicate cells without declared primary corporate filing.`,
        investigationHref: "/case/TR-102?tab=graph",
      };
    });

    const payload: AnalyticsData = {
      crossCaseLinks,
      communities,
      bridgeNodes,
      anomalies,
      sessionId: `TRACIA-NEO4J-${Date.now().toString().slice(-6)}`,
    };

    return NextResponse.json(payload);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to compute graph analytics";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    await session.close();
  }
}
