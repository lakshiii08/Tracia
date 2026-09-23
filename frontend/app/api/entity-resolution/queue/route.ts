import { NextResponse } from "next/server";
import { getNeo4jDriver } from "@/lib/neo4j";
import { getPersistentFirs } from "@/lib/storage/persistence";
import type { EntityMatch } from "@/lib/store";

export async function GET() {
  const matches: EntityMatch[] = [];
  const driver = getNeo4jDriver();

  if (driver) {
    const session = driver.session();
    try {
      const cypher = `
        MATCH (a), (b)
        WHERE id(a) < id(b) 
          AND (
            (a:person AND b:person) 
            OR (a.entity_type = 'person' AND b.entity_type = 'person')
            OR (a:phone AND b:phone)
            OR (head(labels(a)) = head(labels(b)) AND head(labels(a)) IS NOT NULL AND NOT head(labels(a)) IN ['case', 'Case', 'evidence', 'Evidence'])
          )
        OPTIONAL MATCH (a)-[r1]-(shared)-[r2]-(b)
        WHERE shared <> a AND shared <> b
        RETURN coalesce(a.name, a.label, a.id) as nameA,
               coalesce(a.entity_type, head(labels(a)), 'Target') as typeA,
               coalesce(b.name, b.label, b.id) as nameB,
               coalesce(b.entity_type, head(labels(b)), 'Target') as typeB,
               count(shared) as sharedCount,
               collect(coalesce(shared.name, shared.label, shared.id))[0..3] as sharedEntities
        ORDER BY sharedCount DESC
        LIMIT 6
      `;
      const res = await session.run(cypher);

      res.records.forEach((r, idx) => {
        const nameA = String(r.get("nameA") || "Entity A");
        const typeA = String(r.get("typeA") || "Target");
        const nameB = String(r.get("nameB") || "Entity B");
        const typeB = String(r.get("typeB") || "Target");
        const sharedCount = Number(r.get("sharedCount") || 0);
        const shared = (r.get("sharedEntities") as string[]) || [];

        const similarity = sharedCount > 0 ? Math.min(94, 70 + sharedCount * 12) : 68;

        matches.push({
          id: `match-neo4j-${idx + 1}`,
          similarity,
          sourceA: `Neo4j Cluster (${typeA})`,
          sourceB: `Live Relational Graph (${typeB})`,
          nameA,
          nameB,
          fieldsA: [
            { label: "Classification", value: typeA },
            { label: "Network Links", value: `${sharedCount} Shared Links`, matched: sharedCount > 0 },
            { label: "Associated Nodes", value: shared.length > 0 ? shared.join(", ") : "Structural network tie" },
          ],
          fieldsB: [
            { label: "Classification", value: typeB },
            { label: "Network Links", value: `${sharedCount} Shared Links`, matched: sharedCount > 0 },
            { label: "Associated Nodes", value: shared.length > 0 ? shared.join(", ") : "Structural network tie" },
          ],
        });
      });
    } catch (e) {
      console.warn("[Entity Resolution] Neo4j query notice:", e);
    } finally {
      await session.close();
    }
  }

  // Cross-reference registered FIRs if multiple FIRs exist in persistent storage
  try {
    const firs = await getPersistentFirs();
    if (firs.length >= 2) {
      for (let i = 0; i < firs.length - 1; i++) {
        for (let j = i + 1; j < firs.length; j++) {
          const fir1 = firs[i];
          const fir2 = firs[j];
          if (fir1.accused && fir2.accused) {
            matches.push({
              id: `match-fir-${fir1.id}-${fir2.id}`,
              similarity: 88,
              sourceA: `FIR ${fir1.firNumber}`,
              sourceB: `FIR ${fir2.firNumber}`,
              nameA: fir1.accused,
              nameB: fir2.accused,
              fieldsA: [
                { label: "Case ID", value: fir1.caseId || "N/A" },
                { label: "Jurisdiction", value: fir1.policeStation },
                { label: "Legal Sections", value: fir1.sections },
              ],
              fieldsB: [
                { label: "Case ID", value: fir2.caseId || "N/A" },
                { label: "Jurisdiction", value: fir2.policeStation },
                { label: "Legal Sections", value: fir2.sections },
              ],
            });
          }
        }
      }
    }
  } catch {}

  return NextResponse.json(matches);
}
