import { NextRequest, NextResponse } from "next/server";
import { getNeo4jDriver } from "@/lib/neo4j";
import type { ExtendedCaseItem } from "@/types/cases";
import { getPersistentCases, updatePersistentCase } from "@/lib/storage/persistence";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const normId = id.trim();

  // 1. Check persistent disk storage first
  const diskCases = await getPersistentCases();
  const diskCase = diskCases.find((c) => c.id.toUpperCase() === normId.toUpperCase());
  if (diskCase) {
    return NextResponse.json(diskCase);
  }

  // Query live Neo4j Aura cluster for case information
  try {
    const driver = getNeo4jDriver();
    if (driver) {
      const session = driver.session();
      try {
        const result = await session.run(
          `
          MATCH ()-[r]->()
          WHERE toLower(r.case_id) = toLower($caseId)
          RETURN count(r) as count
        `,
          { caseId: normId }
        );

        const count = result.records[0] ? Number(result.records[0].get("count")) : 0;
        if (count > 0) {
          const liveCase: ExtendedCaseItem = {
            id: normId,
            name: `Investigation ${normId.replace("case_", "CR-")}`,
            desc: `Live criminal network case file with ${count} verified relationships in Neo4j cluster.`,
            entities: Math.round(count * 1.2),
            date: new Date().toISOString().split("T")[0],
            status: "Active",
            tone: "person",
            icon: "folder",
            href: `/case/${normId}`,
            priority: count > 20 ? "Critical" : "High",
            category: "Organized Cyber Financial Syndicate",
            classification: "Confidential",
            assignedOfficerIds: ["IO-101", "usr-admin"],
            assignees: [
              { name: "Inspector A. Admin", role: "Supervising Admin" },
              { name: "Det. J. Smith", role: "Lead Investigator" },
            ],
          };
          return NextResponse.json(liveCase);
        }
      } finally {
        await session.close();
      }
    }
  } catch (err) {
    console.warn("Error looking up case in Neo4j:", err);
  }

  return NextResponse.json({ error: `Case ${normId} not found in live data.` }, { status: 404 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const persisted = await updatePersistentCase(id, body);
  if (persisted) {
    return NextResponse.json(persisted);
  }

  const updatedCase: ExtendedCaseItem = {
    id,
    name: body.name || `Case ${id}`,
    desc: body.desc || "Updated case notes.",
    status: body.status || "Active",
    entities: 24,
    date: new Date().toISOString().split("T")[0],
    tone: "person",
    icon: "folder",
    href: `/case/${id}`,
    priority: body.priority || "High",
    category: body.category || "General",
    classification: "Confidential",
    assignedOfficerIds: body.assignedOfficerIds || ["IO-101"],
    assignees: body.assignees || [
      { name: "Inspector A. Admin", role: "Supervising Officer" },
      { name: "Det. J. Smith", role: "Lead Investigator" },
    ],
  };

  return NextResponse.json(updatedCase);
}
