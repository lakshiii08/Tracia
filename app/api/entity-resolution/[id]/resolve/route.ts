import { NextRequest, NextResponse } from "next/server";
import { getNeo4jDriver } from "@/lib/neo4j";
import { appendPersistentAudit } from "@/lib/storage/persistence";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const action = (body.action as "confirm" | "reject") || "confirm";
    const nameA = body.nameA;
    const nameB = body.nameB;

    // 1. Audit trail record
    await appendPersistentAudit({
      id: `audit-er-${Date.now()}`,
      time: new Date().toISOString(),
      message: action === "confirm"
        ? `Entity resolution CONFIRMED: ${nameA || id} ↔ ${nameB || id}`
        : `Entity resolution REJECTED: ${nameA || id} ↔ ${nameB || id}`,
      actor: "Investigator Admin",
    });

    // 2. Link in Neo4j if confirmed and names available
    if (action === "confirm" && nameA && nameB) {
      const driver = getNeo4jDriver();
      if (driver) {
        const session = driver.session();
        try {
          await session.run(`
            MATCH (a), (b)
            WHERE coalesce(a.name, a.label, a.id) = $nameA 
              AND coalesce(b.name, b.label, b.id) = $nameB
            MERGE (a)-[r:SAME_ENTITY_CONFIRMED { resolved_at: datetime() }]->(b)
          `, { nameA, nameB });
        } catch (dbErr) {
          console.warn("[Resolve Entity Neo4j] Notice:", dbErr);
        } finally {
          await session.close();
        }
      }
    }

    return NextResponse.json({
      id,
      action,
      message: `Entity match ${id} successfully ${action}ed and persisted.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to resolve entity";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
