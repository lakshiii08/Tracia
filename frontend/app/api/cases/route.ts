import { NextRequest, NextResponse } from "next/server";
import { getNeo4jDriver } from "@/lib/neo4j";
import type { ExtendedCaseItem } from "@/types/cases";
import { getPersistentCases, appendPersistentCase } from "@/lib/storage/persistence";

export async function GET() {
  try {
    const diskCases = await getPersistentCases();
    const driver = getNeo4jDriver();
    const realCases: ExtendedCaseItem[] = [...diskCases];

    if (driver) {
      const session = driver.session();
      try {
        const caseNodes = await session.run(`
          MATCH (c)
          WITH c,
               toLower(coalesce(c.id, c.entity_id, "")) AS raw_id,
               toLower(coalesce(c.name, c.label, "")) AS raw_name,
               toLower(coalesce(c.type, c.entity_type, head(labels(c)), "")) AS raw_type
          WHERE raw_type = "case"
            AND (
              raw_id STARTS WITH "case" OR
              raw_name STARTS WITH "case_" OR
              raw_name CONTAINS "case #"
            )
          OPTIONAL MATCH (c)-[*1..2]-(n)
          WITH c, raw_id, raw_name, count(DISTINCT n) as count
          WHERE count > 0
          RETURN
            CASE
              WHEN raw_name STARTS WITH "case_" THEN coalesce(c.name, c.label)
              ELSE coalesce(c.id, c.entity_id, elementId(c))
            END as case_id,
            coalesce(c.name, c.label, c.id, c.entity_id, "Investigation") as case_name,
            count
          ORDER BY case_name
        `);

        caseNodes.records.forEach((rec, idx) => {
          const id = String(rec.get("case_id"));
          const name = String(rec.get("case_name"));
          const count = Number(rec.get("count"));

          if (!realCases.some((c) => c.id.toUpperCase() === id.toUpperCase())) {
            realCases.push({
              id,
              name,
              desc: `Live Neo4j investigation case file with ${count} connected graph entities.`,
              entities: count,
              date: new Date().toISOString().split("T")[0],
              status: idx === 0 ? "Active" : "Under Review",
              tone: idx % 2 === 0 ? "person" : "organization",
              icon: "folder",
              href: `/case/${id}`,
              priority: count > 20 ? "Critical" : "High",
              category: "Neo4j Knowledge Graph Investigation",
              classification: "Confidential",
              assignedOfficerIds: ["IO-101", "usr-admin"],
              assignees: [
                { name: "Inspector A. Admin", role: "Supervising Admin" },
                { name: "Det. J. Smith", role: "Lead Investigator" },
              ],
            });
          }
        });

        const result = await session.run(`
          MATCH ()-[r]->()
          WHERE r.case_id IS NOT NULL
          RETURN DISTINCT r.case_id as case_id, count(r) as count
          ORDER BY count DESC
        `);

        result.records.forEach((rec, idx) => {
          const id = rec.get("case_id");
          const count = Number(rec.get("count"));

          if (!realCases.some((c) => c.id.toUpperCase() === id.toUpperCase())) {
            realCases.push({
              id,
              name: `Investigation ${id.replace("case_", "CR-")}`,
              desc: `Live criminal network case file with ${count} verified relationships in Neo4j cluster.`,
              entities: Math.round(count * 1.2),
              date: new Date().toISOString().split("T")[0],
              status: idx === 0 ? "Active" : "Under Review",
              tone: idx % 2 === 0 ? "person" : "organization",
              icon: idx % 2 === 0 ? "folder" : "domain",
              href: `/case/${id}`,
              priority: count > 20 ? "Critical" : "High",
              category: "Organized Cyber Financial Syndicate",
              classification: "Confidential",
              assignedOfficerIds: ["IO-101", "usr-admin"],
              assignees: [
                { name: "Inspector A. Admin", role: "Supervising Admin" },
                { name: "Det. J. Smith", role: "Lead Investigator" },
              ],
            });
          }
        });
      } finally {
        await session.close();
      }
    }

    return NextResponse.json(realCases);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch cases";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newId = body.id || `CASE_${Date.now().toString().slice(-4)}`;
    const newCase: ExtendedCaseItem = {
      id: newId,
      name: body.name || `Case ${newId}`,
      desc: body.desc || "Newly registered case investigation.",
      entities: body.entities || 0,
      date: body.date || new Date().toISOString().split("T")[0],
      status: body.status || "Active",
      tone: body.tone || "person",
      icon: body.icon || "folder",
      href: `/case/${newId}`,
      priority: body.priority || "High",
      category: body.category || "General",
      classification: "Confidential",
      assignedOfficerIds: body.assignedOfficerIds || ["IO-101"],
      assignees: body.assignees || [{ name: "Inspector A. Admin", role: "Lead Investigator" }],
    };

    await appendPersistentCase(newCase);
    return NextResponse.json(newCase, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create case";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
