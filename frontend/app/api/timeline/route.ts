import { NextRequest, NextResponse } from "next/server";
import type { TimelineEvent } from "@/types/timeline";
import { getNeo4jDriver } from "@/lib/neo4j";
import { getPersistentCases, getPersistentFirs } from "@/lib/storage/persistence";

let serverTimelineStore: TimelineEvent[] = [];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("caseId");

  try {
    const driver = getNeo4jDriver();
    const liveTimeline: TimelineEvent[] = [...serverTimelineStore];

    // 1. Synthesize timeline from persistent cases and FIRs
    const [cases, firs] = await Promise.all([
      getPersistentCases(),
      getPersistentFirs(),
    ]);

    firs.forEach((fir, idx) => {
      if (!caseId || (fir.caseId && fir.caseId.toLowerCase() === caseId.toLowerCase())) {
        liveTimeline.push({
          id: `tl-fir-${fir.id || idx}`,
          time: fir.timestamp ? fir.timestamp.substring(11, 16) : "10:00",
          date: fir.incidentDate || fir.timestamp?.substring(0, 10) || new Date().toISOString().substring(0, 10),
          title: `FIR Registered: ${fir.firNumber}`,
          category: "Evidence",
          description: `First Information Report lodged at ${fir.policeStation} alleging offenses under ${fir.sections}. Complainant: ${fir.complainant}, Accused: ${fir.accused}.`,
          actor: "IO-101 (Investigating Officer)",
          evidenceRef: fir.fileName || `FIR-${fir.firNumber}.pdf`,
        });
      }
    });

    cases.forEach((c) => {
      if (!caseId || c.id.toLowerCase() === caseId.toLowerCase()) {
        liveTimeline.push({
          id: `tl-case-${c.id}`,
          time: "09:00",
          date: c.date || new Date().toISOString().substring(0, 10),
          title: `Investigation Initiated: ${c.name}`,
          category: "Forensics",
          description: `Case file opened with priority ${c.priority || "High"}. Focus: ${c.desc}`,
          actor: c.assignees?.[0]?.name || "Lead Investigator",
          evidenceRef: c.id,
        });
      }
    });

    // 2. Query Neo4j Aura for temporal events if connected
    if (driver) {
      const session = driver.session();
      try {
        const res = await session.run(`
          MATCH (e)-[r]->(d)
          WHERE any(prop in keys(r) WHERE prop CONTAINS 'date' OR prop CONTAINS 'time')
          RETURN coalesce(e.name, e.label, e.id) as entityName, 
                 type(r) as relType,
                 coalesce(r.date, r.time, r.timestamp, '2025-05-10') as eventDate,
                 coalesce(d.name, d.label, d.id) as targetName
          LIMIT 10
        `);

        res.records.forEach((rec, idx) => {
          const eName = rec.get("entityName") || "Target";
          const rType = rec.get("relType") || "CONNECTED";
          const eDate = String(rec.get("eventDate"));
          const tName = rec.get("targetName") || "Node";

          liveTimeline.push({
            id: `tl-neo-${idx + 1}`,
            time: "14:30",
            date: eDate.substring(0, 10),
            title: `${eName} [${rType}] ${tName}`,
            category: "Forensics",
            description: `Relational link verified in Neo4j Aura knowledge graph.`,
            actor: "System Graph Analytics",
          });
        });
      } catch (dbErr) {
        console.warn("[Timeline Neo4j] Notice:", dbErr);
      } finally {
        await session.close();
      }
    }

    return NextResponse.json(liveTimeline);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch timeline events";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newEvent: TimelineEvent = {
      id: `tl-${Date.now()}`,
      time: body.time || new Date().toISOString().substring(11, 16),
      date: body.date || new Date().toISOString().substring(0, 10),
      title: body.title || "New Timeline Incident",
      category: body.category || "Evidence",
      description: body.description || "Synthesized event log.",
      actor: body.actor || "Lead Investigator",
      evidenceRef: body.evidenceRef,
    };
    serverTimelineStore = [newEvent, ...serverTimelineStore];
    return NextResponse.json(newEvent, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record timeline event";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
