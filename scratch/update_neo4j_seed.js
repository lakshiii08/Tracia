const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'lib/neo4j.ts');
let c = fs.readFileSync(p, 'utf8');

const target = `export async function seedNeo4jData(): Promise<{ success: boolean; message: string; nodesCreated: number; edgesCreated: number }> {
  const connected = await checkNeo4jConnection();
  if (!connected) {
    return { success: false, message: "Cannot seed: Neo4j database is not connected.", nodesCreated: 0, edgesCreated: 0 };
  }

  const driver = getNeo4jDriver();
  if (!driver) return { success: false, message: "Neo4j driver uninitialized.", nodesCreated: 0, edgesCreated: 0 };

  const session = driver.session();
  try {
    // 1. Ensure constraint for unique entity id
    try {
      await session.run("CREATE CONSTRAINT entity_id_unique IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE");
    } catch {}

    // 2. Merge all 12 canonical nodes into Neo4j Aura
    for (const node of fallbackNodes) {
      const typeLabel = node.type.charAt(0).toUpperCase() + node.type.slice(1);
      await session.run(
        \`
        MERGE (n:Entity { id: $id })
        SET n.entity_id = $id,
            n.label = $label,
            n.name = $label,
            n.type = $type,
            n.entity_type = $type,
            n.risk = $risk,
            n.riskScore = $riskScore,
            n.connections = $connections,
            n.subtitle = $subtitle,
            n.idLabel = $idLabel,
            n.caseCount = $caseCount,
            n.evidenceCount = $evidenceCount
        SET n:\${typeLabel}
        \`,
        {
          id: node.id,
          label: node.label,
          type: node.type,
          risk: node.risk || "low",
          riskScore: node.details?.riskScore ?? (node.risk === "high" ? 85 : 45),
          connections: node.details?.connections ?? 5,
          subtitle: node.details?.subtitle ?? "",
          idLabel: node.details?.idLabel ?? node.id,
          caseCount: node.details?.caseCount ?? 1,
          evidenceCount: node.details?.evidenceCount ?? 1,
        }
      );
    }

    // 3. Merge all 14 canonical edges into Neo4j Aura
    for (const edge of fallbackEdges) {
      await session.run(
        \`
        MATCH (a:Entity) WHERE a.id = $from OR a.entity_id = $from
        MATCH (b:Entity) WHERE b.id = $to OR b.entity_id = $to
        MERGE (a)-[r:RELATIONSHIP { id: $id }]->(b)
        SET r.label = $label,
            r.kind = $kind,
            r.type = $label
        \`,
        {
          id: edge.id,
          from: edge.from,
          to: edge.to,
          label: edge.label,
          kind: edge.kind || "direct",
        }
      );
    }

    return {
      success: true,
      message: \`Successfully created and verified 12 nodes and 14 relationships in live Neo4j Aura cloud database.\`,
      nodesCreated: fallbackNodes.length,
      edgesCreated: fallbackEdges.length,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: \`Neo4j Cypher error: \${errorMsg}\`, nodesCreated: 0, edgesCreated: 0 };
  } finally {
    await session.close();
  }
}`;

const replacement = `export async function seedNeo4jData(): Promise<{ success: boolean; message: string; nodesCreated: number; edgesCreated: number }> {
  const connected = await checkNeo4jConnection();
  if (!connected) {
    return { success: false, message: "Cannot seed: Neo4j database is not connected.", nodesCreated: 0, edgesCreated: 0 };
  }
  const { generateAiKnowledgeGraph, deployAiGraphToNeo4j } = await import("@/lib/aiGraphGenerator");
  const aiGraph = await generateAiKnowledgeGraph();
  return deployAiGraphToNeo4j(aiGraph);
}`;

const normalize = s => s.replace(/\r\n/g, '\n');
if (normalize(c).includes(normalize(target))) {
  const isCRLF = c.includes('\r\n');
  const actualTarget = isCRLF ? target.replace(/\n/g, '\r\n') : target;
  const actualReplacement = isCRLF ? replacement.replace(/\n/g, '\r\n') : replacement;
  c = c.replace(actualTarget, actualReplacement);
  fs.writeFileSync(p, c, 'utf8');
  console.log('Successfully updated seedNeo4jData in lib/neo4j.ts');
} else {
  console.error('Target block not found in lib/neo4j.ts');
}
