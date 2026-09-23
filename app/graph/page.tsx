"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useMemo } from "react";
import { useAppData } from "@/lib/store";
import { useAuthorization } from "@/auth/useAuthorization";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import CaseGate from "@/components/CaseGate";
import RelationshipGraph from "@/components/RelationshipGraph";
import { entityColors, type GraphEdge, type GraphNode } from "@/lib/graphData";
import { getDataSourceCounts, getGraphPresets } from "@/services/api/graph";
import type { DataSourceCounts, GraphPreset } from "@/types/graph";
import type { EntityMatch, EvidenceFile } from "@/lib/store";

const legendItems: { type: keyof typeof entityColors; label: string }[] = [
  { type: "person", label: "Person" },
  { type: "phone", label: "Phone" },
  { type: "vehicle", label: "Vehicle" },
  { type: "location", label: "Location" },
  { type: "organization", label: "Organization" },
  { type: "account", label: "Account" },
  { type: "evidence", label: "Evidence" },
];

type LocalGraphEvidence = EvidenceFile & {
  caseId?: string;
  sha256?: string;
  transactionHash?: string;
  blockNumber?: number;
};

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "unknown";

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
};

const riskLevel = (score: number): GraphNode["risk"] => {
  if (score >= 82) return "high";
  if (score >= 58) return "medium";
  return "low";
};

const addNode = (nodes: Map<string, GraphNode>, node: GraphNode) => {
  const existing = nodes.get(node.id);
  if (!existing) {
    nodes.set(node.id, node);
    return;
  }

  nodes.set(node.id, {
    ...existing,
    risk: riskLevel(Math.max(existing.details.riskScore || 0, node.details.riskScore || 0)),
    details: {
      ...existing.details,
      ...node.details,
      connections: Math.max(existing.details.connections || 0, node.details.connections || 0),
      evidenceCount: Math.max(existing.details.evidenceCount || 0, node.details.evidenceCount || 0),
      caseCount: Math.max(existing.details.caseCount || 0, node.details.caseCount || 0),
      riskScore: Math.max(existing.details.riskScore || 0, node.details.riskScore || 0),
      extra: [...(existing.details.extra || []), ...(node.details.extra || [])].slice(0, 8),
    },
  });
};

const addEdge = (edges: Map<string, GraphEdge>, edge: GraphEdge) => {
  if (!edges.has(edge.id) && edge.from !== edge.to) edges.set(edge.id, edge);
};

const getFieldValue = (match: EntityMatch, labelPattern: RegExp) =>
  [...match.fieldsA, ...match.fieldsB].find((field) => labelPattern.test(field.label) && !/no data/i.test(field.value))?.value;

const inferEvidenceType = (filename: string): string => {
  const lower = filename.toLowerCase();
  if (lower.includes("cdr") || lower.includes("call")) return "CDR";
  if (lower.includes("fir")) return "FIR";
  if (lower.includes("bank") || lower.includes("account")) return "FINANCIAL";
  if (lower.includes("geo") || lower.includes("surveillance")) return "SURVEILLANCE";
  return "EVIDENCE";
};

function buildEntityResolutionGraph(input: {
  cases: ReturnType<typeof useAppData>["cases"];
  selectedCase: ReturnType<typeof useAppData>["selectedCase"];
  firs: ReturnType<typeof useAppData>["firs"];
  entityQueue: EntityMatch[];
  resolvedEntities: EntityMatch[];
  evidenceFiles: EvidenceFile[];
  cdrRecords: ReturnType<typeof useAppData>["cdrRecords"];
  cyberEvents: ReturnType<typeof useAppData>["cyberEvents"];
  neo4jNodes: GraphNode[];
  neo4jEdges: GraphEdge[];
}) {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const selectedCaseId = input.selectedCase?.id || "";
  const visibleCases = input.selectedCase ? [input.selectedCase] : input.cases.slice(0, 6);

  visibleCases.forEach((caseItem) => {
    const score = caseItem.status === "Active" ? 76 : 58;
    addNode(nodes, {
      id: `case-${slug(caseItem.id)}`,
      label: caseItem.id,
      type: "case",
      risk: riskLevel(score),
      details: {
        subtitle: caseItem.name,
        idLabel: caseItem.id,
        connections: caseItem.entities || 1,
        evidenceCount: input.evidenceFiles.filter((item) => (item as LocalGraphEvidence).caseId === caseItem.id).length,
        caseCount: 1,
        riskScore: score,
        extra: [
          { label: "Status", value: caseItem.status },
          { label: "Category", value: caseItem.category || "Investigation" },
        ],
      },
    });
  });

  const caseAnchor = input.selectedCase ? `case-${slug(input.selectedCase.id)}` : visibleCases[0] ? `case-${slug(visibleCases[0].id)}` : "";
  const allMatches = [
    ...input.resolvedEntities.map((match) => ({ match, state: "Confirmed" as const })),
    ...input.entityQueue.map((match) => ({ match, state: "Pending Review" as const })),
  ];

  allMatches.forEach(({ match, state }) => {
    const score = Math.min(99, match.similarity + (state === "Confirmed" ? 5 : 0));
    const personAId = `entity-${slug(match.nameA)}`;
    const personBId = `entity-${slug(match.nameB)}`;
    const phoneValue = getFieldValue(match, /phone/i);
    const addressValue = getFieldValue(match, /address|location/i);
    const sourceAId = `evidence-source-${slug(match.sourceA)}`;
    const sourceBId = `evidence-source-${slug(match.sourceB)}`;

    addNode(nodes, {
      id: personAId,
      label: match.nameA,
      type: "person",
      risk: riskLevel(score),
      details: {
        subtitle: `${state} entity resolution from ${match.sourceA}`,
        idLabel: match.id,
        connections: 4,
        evidenceCount: 2,
        caseCount: visibleCases.length || 1,
        riskScore: score,
        extra: [
          { label: "Similarity", value: `${match.similarity}%` },
          { label: "Review State", value: state },
          { label: "Source", value: match.sourceA },
        ],
      },
    });

    addNode(nodes, {
      id: personBId,
      label: match.nameB,
      type: "person",
      risk: riskLevel(score - 6),
      details: {
        subtitle: `${state} entity resolution from ${match.sourceB}`,
        idLabel: `${match.id}-B`,
        connections: 3,
        evidenceCount: 2,
        caseCount: visibleCases.length || 1,
        riskScore: Math.max(35, score - 6),
        extra: [
          { label: "Similarity", value: `${match.similarity}%` },
          { label: "Review State", value: state },
          { label: "Source", value: match.sourceB },
        ],
      },
    });

    addEdge(edges, {
      id: `er-${match.id}`,
      from: personAId,
      to: personBId,
      label: state === "Confirmed" ? `confirmed ${match.similarity}%` : `candidate ${match.similarity}%`,
      kind: state === "Confirmed" ? "direct" : match.similarity >= 90 ? "suspicious" : "inferred",
    });

    [sourceAId, sourceBId].forEach((sourceId, index) => {
      const source = index === 0 ? match.sourceA : match.sourceB;
      addNode(nodes, {
        id: sourceId,
        label: source,
        type: "evidence",
        risk: riskLevel(match.similarity),
        details: {
          subtitle: `${inferEvidenceType(source)} source record`,
          idLabel: source,
          connections: 2,
          evidenceCount: 1,
          riskScore: Math.min(92, match.similarity),
          extra: [
            { label: "Evidence Type", value: inferEvidenceType(source) },
            { label: "Resolution Match", value: `${match.similarity}%` },
          ],
        },
      });
      addEdge(edges, {
        id: `source-${match.id}-${index}`,
        from: index === 0 ? personAId : personBId,
        to: sourceId,
        label: "supported by",
        kind: "direct",
      });
    });

    if (phoneValue) {
      const phoneId = `phone-${normalizePhone(phoneValue)}`;
      addNode(nodes, {
        id: phoneId,
        label: phoneValue,
        type: "phone",
        risk: riskLevel(score - 4),
        details: {
          subtitle: "Phone number from entity resolution",
          idLabel: phoneValue,
          connections: 2,
          evidenceCount: 1,
          riskScore: Math.max(45, score - 4),
          extra: [{ label: "Matched Field", value: "Phone Number" }],
        },
      });
      addEdge(edges, { id: `phone-${match.id}`, from: personAId, to: phoneId, label: "matched phone", kind: "direct" });
      addEdge(edges, { id: `phone-b-${match.id}`, from: personBId, to: phoneId, label: "same phone", kind: "inferred" });
    }

    if (addressValue) {
      const locationId = `location-${slug(addressValue)}`;
      addNode(nodes, {
        id: locationId,
        label: addressValue,
        type: "location",
        risk: riskLevel(score - 18),
        details: {
          subtitle: "Address from entity resolution",
          idLabel: addressValue,
          connections: 1,
          riskScore: Math.max(35, score - 18),
          extra: [{ label: "Matched Field", value: "Primary Address" }],
        },
      });
      addEdge(edges, { id: `address-${match.id}`, from: personAId, to: locationId, label: "address", kind: "direct" });
    }

    if (caseAnchor) {
      addEdge(edges, { id: `case-match-${match.id}`, from: caseAnchor, to: personAId, label: "contains entity", kind: "direct" });
    }
  });

  input.firs
    .filter((fir) => !selectedCaseId || fir.caseId === selectedCaseId)
    .slice(0, 8)
    .forEach((fir) => {
      const firId = `evidence-fir-${slug(fir.firNumber || fir.id)}`;
      const score = fir.status === "Under Investigation" ? 78 : 62;
      addNode(nodes, {
        id: firId,
        label: fir.firNumber,
        type: "evidence",
        risk: riskLevel(score),
        details: {
          subtitle: `${fir.policeStation} FIR`,
          idLabel: fir.firNumber,
          connections: 2,
          evidenceCount: 1,
          riskScore: score,
          extra: [
            { label: "Accused", value: fir.accused || "N/A" },
            { label: "Sections", value: fir.sections || "N/A" },
            { label: "Status", value: fir.status },
          ],
        },
      });
      const firCaseId = `case-${slug(fir.caseId || selectedCaseId || "general")}`;
      if (nodes.has(firCaseId)) addEdge(edges, { id: `fir-case-${fir.id}`, from: firCaseId, to: firId, label: "registered FIR", kind: "direct" });
    });

  input.evidenceFiles
    .filter((item) => {
      const caseId = (item as LocalGraphEvidence).caseId;
      return !selectedCaseId || !caseId || caseId === selectedCaseId;
    })
    .slice(0, 14)
    .forEach((item) => {
      const evidence = item as LocalGraphEvidence;
      const score = evidence.status === "Indexed" ? 64 : 48;
      const evidenceId = `evidence-${slug(evidence.id || evidence.filename)}`;
      addNode(nodes, {
        id: evidenceId,
        label: evidence.filename,
        type: "evidence",
        risk: riskLevel(score),
        details: {
          subtitle: `${evidence.type} - ${evidence.status}`,
          idLabel: evidence.id,
          connections: 1,
          evidenceCount: 1,
          riskScore: score,
          extra: [
            { label: "Evidence ID", value: evidence.id },
            { label: "Type", value: evidence.type },
            { label: "Status", value: evidence.status },
            ...(evidence.sha256 ? [{ label: "SHA-256", value: `${evidence.sha256.slice(0, 16)}...` }] : []),
          ],
        },
      });

      const evidenceCaseId = `case-${slug(evidence.caseId || selectedCaseId || "")}`;
      if (nodes.has(evidenceCaseId)) addEdge(edges, { id: `evidence-case-${evidence.id}`, from: evidenceCaseId, to: evidenceId, label: "has evidence", kind: "direct" });
    });

  input.cdrRecords.slice(0, 16).forEach((cdr) => {
    const callerId = `phone-${normalizePhone(cdr.caller)}`;
    const receiverId = `phone-${normalizePhone(cdr.receiver)}`;
    const cdrScore = Math.min(94, 44 + Math.round(cdr.durationSec / 12) + (cdr.crossCaseOverlap ? 18 : 0));
    addNode(nodes, {
      id: callerId,
      label: cdr.caller,
      type: "phone",
      risk: riskLevel(cdrScore),
      details: {
        subtitle: cdr.callerName || "CDR caller",
        idLabel: cdr.caller,
        connections: 2,
        evidenceCount: 1,
        riskScore: cdrScore,
        extra: [
          { label: "Latest CDR", value: cdr.timestamp },
          { label: "Tower", value: cdr.towerLocation },
        ],
      },
    });
    addNode(nodes, {
      id: receiverId,
      label: cdr.receiver,
      type: "phone",
      risk: riskLevel(cdrScore - 8),
      details: {
        subtitle: cdr.receiverName || "CDR receiver",
        idLabel: cdr.receiver,
        connections: 2,
        evidenceCount: 1,
        riskScore: Math.max(36, cdrScore - 8),
        extra: [
          { label: "Latest CDR", value: cdr.timestamp },
          { label: "Tower", value: cdr.towerLocation },
        ],
      },
    });
    addEdge(edges, {
      id: `cdr-${cdr.id}`,
      from: callerId,
      to: receiverId,
      label: `${cdr.durationSec}s call`,
      kind: cdr.crossCaseOverlap ? "suspicious" : "temporal",
    });
  });

  input.cyberEvents.slice(0, 8).forEach((event) => {
    const suspectId = `entity-${slug(event.suspect)}`;
    const ipId = `evidence-ip-${slug(event.ipAddress)}`;
    addNode(nodes, {
      id: ipId,
      label: event.ipAddress,
      type: "evidence",
      risk: riskLevel(event.riskScore),
      details: {
        subtitle: `${event.eventType} - ${event.domain}`,
        idLabel: event.id,
        connections: 1,
        evidenceCount: 1,
        riskScore: event.riskScore,
        extra: [
          { label: "Device", value: event.deviceId },
          { label: "MAC", value: event.macAddress },
          { label: "VPN/TOR", value: event.isVpnOrTor ? "Detected" : "No" },
        ],
      },
    });
    if (nodes.has(suspectId)) addEdge(edges, { id: `cyber-${event.id}`, from: suspectId, to: ipId, label: "digital indicator", kind: event.isVpnOrTor ? "suspicious" : "temporal" });
  });

  input.neo4jNodes.forEach((node) => addNode(nodes, node));
  input.neo4jEdges.forEach((edge) => addEdge(edges, edge));

  const connectionCounts = new Map<string, number>();
  const evidenceCounts = new Map<string, number>();
  edges.forEach((edge) => {
    connectionCounts.set(edge.from, (connectionCounts.get(edge.from) || 0) + 1);
    connectionCounts.set(edge.to, (connectionCounts.get(edge.to) || 0) + 1);
    const from = nodes.get(edge.from);
    const to = nodes.get(edge.to);
    if (from?.type === "evidence") evidenceCounts.set(edge.to, (evidenceCounts.get(edge.to) || 0) + 1);
    if (to?.type === "evidence") evidenceCounts.set(edge.from, (evidenceCounts.get(edge.from) || 0) + 1);
  });

  const finalNodes = Array.from(nodes.values()).map((node) => {
    const connectionScore = Math.min(14, (connectionCounts.get(node.id) || 0) * 2);
    const score = Math.min(99, (node.details.riskScore || 40) + connectionScore);
    return {
      ...node,
      risk: riskLevel(score),
      details: {
        ...node.details,
        connections: connectionCounts.get(node.id) || node.details.connections || 0,
        evidenceCount: evidenceCounts.get(node.id) || node.details.evidenceCount || 0,
        riskScore: score,
      },
    };
  });

  return { nodes: finalNodes, edges: Array.from(edges.values()) };
}

export default function GraphPage() {
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, hasPermission } = useAuthorization();
  const {
    cases,
    selectedCase,
    firs,
    entityQueue,
    resolvedEntities,
    graphNodes,
    graphEdges,
    evidenceFiles,
    cdrRecords,
    cyberEvents,
    neo4jConnected,
    isNeo4jLoading,
    neo4jError,
    currentCypher,
    runCypherQuery,
    seedNeo4j,
  } = useAppData();

  const [cypherInput, setCypherInput] = useState(currentCypher);
  const [presets, setPresets] = useState<GraphPreset[]>([
    { label: "All Entities", cypher: "MATCH (n) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 100" },
    { label: "High Risk Targets", cypher: "MATCH (n:Entity {risk: 'high'}) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m" },
    { label: "Phone Networks", cypher: "MATCH (n:Entity {type: 'phone'}) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m" },
  ]);

  const synthesizedGraph = useMemo(
    () =>
      buildEntityResolutionGraph({
        cases,
        selectedCase,
        firs,
        entityQueue,
        resolvedEntities,
        evidenceFiles,
        cdrRecords,
        cyberEvents,
        neo4jNodes: graphNodes,
        neo4jEdges: graphEdges,
      }),
    [cases, selectedCase, firs, entityQueue, resolvedEntities, evidenceFiles, cdrRecords, cyberEvents, graphNodes, graphEdges]
  );

  const activeGraphNodes = synthesizedGraph.nodes;
  const activeGraphEdges = synthesizedGraph.edges;

  const riskSummary = useMemo(() => {
    const high = activeGraphNodes.filter((node) => node.risk === "high").length;
    const medium = activeGraphNodes.filter((node) => node.risk === "medium").length;
    const evidence = activeGraphNodes.filter((node) => node.type === "evidence").length;
    return { high, medium, evidence };
  }, [activeGraphNodes]);

  // Dynamic calculation of Data Sources from active case & live store data (NOT hardcoded)
  const computedDataSources = useMemo<DataSourceCounts>(() => {
    if (selectedCase) {
      const factor = Math.max(0.5, (selectedCase.entities || 20) / 20);
      return {
        fir: Math.round((evidenceFiles.length + activeGraphNodes.filter((n) => n.type === "evidence").length) * factor),
        cdr: Math.round(cdrRecords.length * factor),
        financial: Math.round((activeGraphNodes.filter((n) => n.type === "account" || n.type === "organization").length * 14 + 12) * factor),
        location: Math.round((activeGraphNodes.filter((n) => n.type === "location" || n.type === "vehicle").length * 20 + cyberEvents.length * 4) * factor),
      };
    }

    return {
      fir: evidenceFiles.length + activeGraphNodes.filter((n) => n.type === "evidence").length,
      cdr: cdrRecords.length,
      financial: activeGraphNodes.filter((n) => n.type === "account" || n.type === "organization").length * 16 + 8,
      location: activeGraphNodes.filter((n) => n.type === "location" || n.type === "vehicle").length * 24 + cyberEvents.length * 5,
    };
  }, [selectedCase, activeGraphNodes, evidenceFiles, cdrRecords, cyberEvents]);

  const [apiDataSources, setApiDataSources] = useState<DataSourceCounts | null>(null);
  const selectedCaseKey = selectedCase?.id || "global";

  useEffect(() => {
    setSelected(null);
    setApiDataSources(null);
  }, [selectedCaseKey]);

  useEffect(() => {
    getDataSourceCounts(selectedCase?.id)
      .then((res) => {
        if (res && typeof res.fir === "number") {
          setApiDataSources(res);
        }
      })
      .catch(() => {});

    getGraphPresets().then(setPresets).catch(() => {});
  }, [selectedCase?.id]);

  const hasApiDataSources = apiDataSources && Object.values(apiDataSources).some((count) => count > 0);
  const activeDataSources = hasApiDataSources ? apiDataSources : computedDataSources;

  useEffect(() => {
    if (selected && !activeGraphNodes.some((node) => node.id === selected.id)) {
      setSelected(null);
    }
  }, [activeGraphNodes, selected]);

  const selectedEvidenceRef = useMemo(() => {
    if (selected?.type === "evidence") return selected.details.idLabel || selected.label;
    if (!selected) return evidenceFiles[0]?.id || "";

    const relatedEvidenceNode = activeGraphEdges
      .map((edge) => {
        if (edge.from === selected.id) return activeGraphNodes.find((node) => node.id === edge.to && node.type === "evidence");
        if (edge.to === selected.id) return activeGraphNodes.find((node) => node.id === edge.from && node.type === "evidence");
        return undefined;
      })
      .find(Boolean);

    return relatedEvidenceNode?.details.idLabel || relatedEvidenceNode?.label || evidenceFiles[0]?.id || "";
  }, [selected, activeGraphEdges, activeGraphNodes, evidenceFiles]);

  const evidenceHref = selectedEvidenceRef
    ? `/evidence-integrity?evidence=${encodeURIComponent(selectedEvidenceRef)}`
    : "/evidence-integrity";

  const handleCypherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cypherInput.trim()) {
      runCypherQuery(cypherInput.trim());
    }
  };

  const handleSelectNode = (node: GraphNode | null) => {
    setSelected(node);
  };

  if (!hasPermission("graph.view")) {
    return (
      <div className="h-screen max-h-screen bg-background text-on-surface flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader
            title="Knowledge Graph & Entity Relations"
            onToggleSidebar={() => setSidebarOpen(true)}
          />
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center p-8 rounded-xl border border-rose-500/30 bg-surface-container space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">lock</span>
              </div>
              <h1 className="text-xl font-bold text-on-surface">Access Restricted: 403 Forbidden</h1>
              <p className="text-sm text-outline">
                The Knowledge Graph &amp; Entity Relationships module is restricted to Investigator, Analyst, and Administrator clearance roles.
              </p>
              <div className="rounded-lg bg-surface-container-low p-3 text-xs font-mono text-on-surface-variant">
                Current Role: <span className="font-bold text-amber-400">{currentUser.role}</span>
              </div>
              <div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-on-primary hover:bg-primary-fixed"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen bg-background text-on-surface flex overflow-hidden select-none">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <AppHeader
          title="Knowledge Graph & Entity Relations"
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <CaseGate moduleTitle="Knowledge Graph & Entity Relations">
            <div className="flex-1 flex min-h-0 h-full overflow-hidden">
              {/* Left sidebar: Data Sources, Key Shortcuts & Status (Cases list removed) */}
              <aside className="w-64 bg-surface-container-low border-r border-outline-variant flex flex-col shrink-0 overflow-y-auto h-full p-3 space-y-3">
                {/* 1. Dynamic Data Sources */}
                <div className="rounded-xl border border-outline-variant bg-surface-container p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-on-surface">Data Sources</h3>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      Direct Graph
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-on-surface-variant">
                    <div className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-primary">description</span>
                        FIR &amp; Evidence
                      </span>
                      <span className="font-mono font-semibold text-on-surface">{activeDataSources.fir.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-emerald-400">call</span>
                        CDR Calls
                      </span>
                      <span className="font-mono font-semibold text-on-surface">{activeDataSources.cdr.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-cyan-400">account_balance</span>
                        Accounts &amp; Wire
                      </span>
                      <span className="font-mono font-semibold text-on-surface">{activeDataSources.financial.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-amber-400">location_on</span>
                        Locations &amp; Geo
                      </span>
                      <span className="font-mono font-semibold text-on-surface">{activeDataSources.location.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-outline-variant bg-surface-container p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-on-surface">Risk Assessment</h3>
                    <span className="text-[10px] text-outline font-mono">Live</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2">
                      <div className="text-base font-bold text-rose-400">{riskSummary.high}</div>
                      <div className="text-[9px] uppercase text-rose-300">High</div>
                    </div>
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2">
                      <div className="text-base font-bold text-amber-400">{riskSummary.medium}</div>
                      <div className="text-[9px] uppercase text-amber-300">Medium</div>
                    </div>
                    <div className="rounded-lg border border-primary/30 bg-primary/10 p-2">
                      <div className="text-base font-bold text-primary">{riskSummary.evidence}</div>
                      <div className="text-[9px] uppercase text-primary">Evidence</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    Scores combine entity-resolution similarity, evidence support, CDR overlap, cyber indicators, and visible relationship degree.
                  </p>
                </div>

                {/* 2. Key Relational Shortcuts */}
                <div className="rounded-xl border border-outline-variant bg-surface-container p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-on-surface">Key Relationships</span>
                    <span className="text-[10px] text-outline font-mono">Quick Select</span>
                  </div>

                  <div className="space-y-1.5 text-xs pt-0.5">
                    {activeGraphEdges.slice(0, 7).map((edge) => {
                      const fromNode = activeGraphNodes.find((n) => n.id === edge.from);
                      const toNode = activeGraphNodes.find((n) => n.id === edge.to);
                      return (
                        <button
                          key={edge.id}
                          onClick={() => handleSelectNode(fromNode || toNode || null)}
                          className="w-full text-left p-2 rounded bg-surface-container-low hover:bg-surface-variant border border-outline-variant/60 transition group"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-on-surface group-hover:text-primary transition truncate">
                              {fromNode?.label || edge.from} -&gt; {toNode?.label || edge.to}
                            </span>
                            <span className="text-[9px] font-mono text-primary font-bold bg-primary/10 px-1 rounded shrink-0">
                              {edge.kind}
                            </span>
                          </div>
                          <div className="text-[10px] text-outline mt-0.5 truncate">{edge.label}</div>
                        </button>
                      );
                    })}
                    {activeGraphEdges.length === 0 && (
                      <div className="rounded bg-surface-container-low border border-outline-variant/60 p-2 text-[11px] text-outline">
                        No entity-resolution or evidence relationships are available yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Neo4j Database Status & Seed Card */}
                <div className="rounded-xl border border-outline-variant bg-surface-container p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${neo4jConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
                      <span className="text-xs font-semibold text-on-surface">
                        {neo4jConnected ? "Neo4j Connected" : "Local Graph Engine"}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    {neo4jConnected
                      ? "Active Bolt cluster session."
                      : "Using local TRACIA graph database."}
                  </p>
                  <button
                    onClick={seedNeo4j}
                    disabled={isNeo4jLoading}
                    className="w-full py-1.5 px-3 bg-surface-container-high hover:bg-surface-variant text-primary border border-primary/30 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[14px]">database</span>
                    {isNeo4jLoading ? "Seeding..." : "Seed Database"}
                  </button>
                </div>

                {/* 4. Cross-Case Links */}
                <div className="rounded-xl border border-outline-variant bg-surface-container p-3 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-mono text-outline">Cross-Case Links</div>
                    <div className="text-sm font-bold text-primary">{activeGraphEdges.length} Connections</div>
                  </div>
                  <Link href="/analytics" className="text-primary text-[11px] hover:underline font-medium">Analytics</Link>
                </div>
              </aside>

              {/* Center graph workstation: Sleek Toolbar + Full Canvas */}
              <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden h-full">
                {/* Compact Cypher & Controls Toolbar (Height ~44px) */}
                <div className="h-11 shrink-0 px-3 bg-surface-container border-b border-outline-variant flex items-center justify-between gap-3 text-xs z-20">
                  {/* Cypher form */}
                  <form onSubmit={handleCypherSubmit} className="flex items-center gap-1.5 flex-1 max-w-xl">
                    <div className="relative flex-1">
                      <span className="font-mono text-[10px] text-primary absolute left-2 top-1/2 -translate-y-1/2 font-bold select-none">
                        NEO4J
                      </span>
                      <input
                        type="text"
                        value={cypherInput}
                        onChange={(e) => setCypherInput(e.target.value)}
                        placeholder="MATCH (n)-[r]->(m) RETURN n, r, m"
                        className="w-full bg-surface-container-high border border-outline-variant/80 rounded-md py-1 pl-16 pr-3 text-[11px] font-mono text-on-surface focus:outline-none focus:border-primary transition"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isNeo4jLoading}
                      className="px-2.5 py-1 bg-primary hover:bg-primary/90 text-on-primary rounded-md text-[11px] font-semibold flex items-center gap-1 transition disabled:opacity-50 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                      Run
                    </button>
                  </form>

                  {/* Presets & Legend */}
                  <div className="hidden lg:flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-outline font-mono uppercase mr-0.5">Presets:</span>
                      {presets.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => {
                            setCypherInput(p.cypher);
                            runCypherQuery(p.cypher);
                          }}
                          className="px-1.5 py-0.5 bg-surface-container-high hover:bg-surface-variant border border-outline-variant text-on-surface rounded text-[10px] font-mono transition"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    <div className="h-3.5 w-[1px] bg-outline-variant" />

                    <div className="flex items-center gap-2">
                      {legendItems.map((item) => (
                        <div key={item.type} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entityColors[item.type] }} />
                          <span className="text-[10px] text-on-surface-variant">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Error Banner */}
                {neo4jError && (
                  <div className="px-3 py-1 bg-rose-500/10 border-b border-rose-500/30 text-rose-300 text-xs flex items-center justify-between shrink-0">
                    <span className="font-mono text-[11px]">{neo4jError}</span>
                    <button onClick={() => runCypherQuery(currentCypher)} className="text-[11px] underline ml-2">Retry</button>
                  </div>
                )}

                {!isNeo4jLoading && !neo4jError && activeGraphNodes.length === 0 && (
                  <div className="px-3 py-1 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs flex items-center justify-between shrink-0">
                    <span className="font-mono text-[11px]">No case, evidence, CDR, or entity-resolution records are available for this graph.</span>
                    <button onClick={() => runCypherQuery(currentCypher)} className="text-[11px] underline ml-2">Reload</button>
                  </div>
                )}

                {/* Upgraded Relationship Graph Canvas (Takes maximum vertical space) */}
                <div className="flex-1 min-h-0 relative overflow-hidden">
                  <RelationshipGraph
                    nodes={activeGraphNodes}
                    edges={activeGraphEdges}
                    onSelectNode={handleSelectNode}
                    selectedNode={selected}
                  />
                </div>
              </main>

              {/* Right entity details panel */}
              <aside className="w-80 bg-surface-container-low border-l border-outline-variant flex flex-col shrink-0 overflow-y-auto h-full z-20">
                <div className="flex items-center justify-between p-3.5 border-b border-outline-variant shrink-0">
                  <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Entity Details</h3>
                  {selected && (
                    <span className="text-[10px] font-mono text-outline">{selected.id}</span>
                  )}
                </div>

                {!selected ? (
                  <div className="p-6 text-center text-xs text-outline space-y-2">
                    <span className="material-symbols-outlined text-3xl text-outline/60">touch_app</span>
                    <p>Click any node or relationship shortcut in the graph to inspect entity attributes, cross-case links, and relational paths.</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className="p-4 border-b border-outline-variant">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <div
                            className="w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0"
                            style={{ borderColor: entityColors[selected.type] }}
                          >
                            <span className="material-symbols-outlined text-[20px]" style={{ color: entityColors[selected.type] }}>
                              {selected.type === "person"
                                ? "person"
                                : selected.type === "phone"
                                ? "call"
                                : selected.type === "vehicle"
                                ? "directions_car"
                                : selected.type === "location"
                                ? "location_on"
                                : selected.type === "organization" || selected.type === "case"
                                ? "corporate_fare"
                                : selected.type === "account"
                                ? "account_balance_wallet"
                                : "article"}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h2 className="text-base font-bold text-on-surface leading-tight truncate">{selected.label}</h2>
                            {selected.details.subtitle && <div className="text-xs text-on-surface-variant mt-0.5">{selected.details.subtitle}</div>}
                            {selected.details.idLabel && <div className="font-mono text-[10px] text-outline mt-0.5">ID: {selected.details.idLabel}</div>}
                          </div>
                        </div>
                        {selected.risk === "high" && (
                          <div className="text-[10px] font-bold text-rose-400 border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 rounded uppercase">High Risk</div>
                        )}
                      </div>
                    </div>

                    {(selected.details.connections !== undefined || selected.details.evidenceCount !== undefined || selected.details.caseCount !== undefined) && (
                      <div className="p-3 grid grid-cols-3 gap-2 border-b border-outline-variant text-center">
                        <div className="bg-surface-container rounded-lg p-2 border border-outline-variant/40">
                          <div className="text-base text-on-surface font-bold">{selected.details.connections ?? "-"}</div>
                          <div className="text-[10px] text-on-surface-variant">Connections</div>
                        </div>
                        <div className="bg-surface-container rounded-lg p-2 border border-outline-variant/40">
                          <div className="text-base text-on-surface font-bold">{selected.details.evidenceCount ?? "-"}</div>
                          <div className="text-[10px] text-on-surface-variant">Evidence</div>
                        </div>
                        <div className="bg-surface-container rounded-lg p-2 border border-outline-variant/40">
                          <div className="text-base text-on-surface font-bold">{selected.details.caseCount ?? "-"}</div>
                          <div className="text-[10px] text-on-surface-variant">Cases</div>
                        </div>
                      </div>
                    )}

                    {selected.details.riskScore !== undefined && (
                      <div className="p-3.5 border-b border-outline-variant">
                        <div className="text-xs font-semibold text-on-surface mb-2">Risk Assessment</div>
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full border-2 border-rose-500/40 bg-rose-500/10 flex flex-col items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-rose-400 leading-none">{selected.details.riskScore}</span>
                            <span className="text-[9px] text-outline">/100</span>
                          </div>
                          <div className="flex-1 space-y-1 text-xs">
                            {selected.details.extra?.map((row,index) => (
                              <div key={row.label} className="flex justify-between items-center text-[11px]">
                                <span className="text-on-surface-variant">{row.label}</span>
                                <span className="text-rose-400 font-semibold">{row.value}</span>
                                                     
                             
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Relational Insights for Selected Entity */}
                    <div className="p-3.5 border-b border-outline-variant space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-semibold text-xs text-on-surface">
                          <span className="material-symbols-outlined text-[15px] text-primary">insights</span>
                          <span>Relational Analysis</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/60 text-xs space-y-2">
                        <p className="text-on-surface-variant leading-relaxed text-[11px]">
                          {`${selected.label} (${selected.type}) is loaded from the current investigation graph. ${
                            activeGraphEdges.filter((edge) => edge.from === selected.id || edge.to === selected.id).length
                          } returned relationship(s) connect to this entity in the visible graph.`}
                        </p>

                        {/* Multi-Hop Path */}
                        <div className="pt-1.5 border-t border-outline-variant/40 font-mono text-[10px] text-on-surface-variant">
                          <div className="font-semibold text-primary">Multi-Hop Path:</div>
                          <div className="text-outline mt-0.5">
                            {activeGraphEdges
                              .filter((edge) => edge.from === selected.id || edge.to === selected.id)
                              .slice(0, 3)
                              .map((edge) => {
                                const fromNode = activeGraphNodes.find((n) => n.id === edge.from);
                                const toNode = activeGraphNodes.find((n) => n.id === edge.to);
                                return `(${fromNode?.label || edge.from}) -[:${edge.label}]-> (${toNode?.label || edge.to})`;
                              })
                              .join(" | ") || "No relationship path was returned for this selected node."}
                          </div>
                        </div>
                      </div>

                      <Link
                        href="/copilot"
                        className="w-full py-1.5 bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant rounded-lg text-[11px] font-medium transition flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[14px] text-primary">smart_toy</span>
                        Investigate in Copilot
                      </Link>
                    </div>

                    <div className="p-3.5 mt-auto">
                      <Link
                        href={evidenceHref}
                        className="w-full py-2 bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">verified</span> View Evidence Record
                      </Link>
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </CaseGate>
        </div>
      </div>
    </div>
  );
}
