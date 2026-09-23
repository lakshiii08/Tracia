import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { queryGraphFromNeo4j } from "@/lib/neo4j";
import { buildCaseGraphCypher, resolveCaseGraphParams } from "@/lib/caseGraph";
import { getPersistentCases, getPersistentEvidence, getPersistentFirs } from "@/lib/storage/persistence";
import { fetchRenderJson } from "@/lib/renderApi";
import { getAuthorizedCdrRecords } from "@/server/authorizedCdrStore";
import type { ExtendedCaseItem } from "@/types/cases";
import type { CdrRecord } from "@/types/cdr";
import type { EvidenceFile, FirRecord } from "@/lib/store";

type Neo4jGraphResult = Awaited<ReturnType<typeof queryGraphFromNeo4j>>;
type EvidenceCorpusDocument = {
  source: string;
  kind: string;
  content: string;
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9+.-]+/g, " ").trim();
const MAX_CORPUS_DOC_CHARS = 12000;
const MAX_TOTAL_CORPUS_CHARS = 70000;

export const runtime = "nodejs";

function scoreText(query: string, value: string): number {
  const tokens = normalize(query).split(/\s+/).filter((token) => token.length > 2);
  const haystack = normalize(value);
  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

function formatList(items: string[], empty = "None found"): string {
  return items.length ? items.join("\n") : empty;
}

function trimForContext(value: string, limit = MAX_CORPUS_DOC_CHARS): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}\n\n[Content truncated after ${limit} characters]`;
}

function phoneKey(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function extractPhoneKeys(value: string): string[] {
  const matches = value.match(/\+?\d[\d\s().-]{7,}\d/g) || [];
  return Array.from(new Set(matches.map(phoneKey).filter(Boolean)));
}

function timestampValue(value: string): number {
  const parsed = Date.parse(value.replace(" ", "T"));
  return Number.isFinite(parsed) ? parsed : 0;
}

function cdrMatchesPhone(record: CdrRecord, targetPhones: Set<string>): boolean {
  if (targetPhones.size === 0) return false;
  return targetPhones.has(phoneKey(record.caller)) || targetPhones.has(phoneKey(record.receiver));
}

function cdrMatchesText(record: CdrRecord, query: string): boolean {
  const haystack = normalize(
    `${record.caller} ${record.callerName} ${record.receiver} ${record.receiverName} ${record.towerLocation}`
  );
  return normalize(query)
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .some((word) => haystack.includes(word));
}

function describeCounterparty(record: CdrRecord, targetPhones: Set<string>): string {
  const callerMatches = targetPhones.has(phoneKey(record.caller));
  const receiverMatches = targetPhones.has(phoneKey(record.receiver));

  if (callerMatches && !receiverMatches) return `${record.receiverName || "Unknown"} (${record.receiver})`;
  if (receiverMatches && !callerMatches) return `${record.callerName || "Unknown"} (${record.caller})`;
  return `${record.receiverName || "Unknown"} (${record.receiver})`;
}

function collectCorpusIndicators(corpus: EvidenceCorpusDocument[]) {
  const text = corpus.map((doc) => `${doc.source}\n${doc.content}`).join("\n");
  const ipAddresses = Array.from(
    new Set(
      (text.match(/\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g) || [])
        .slice(0, 12)
    )
  );
  const deviceIds = Array.from(new Set((text.match(/\bDEV[_-][A-Z0-9_-]+\b/gi) || []).slice(0, 12)));
  const imeis = Array.from(
    new Set(
      [...text.matchAll(/\bimei\D{0,12}(\d{14,17})\b/gi)]
        .map((match) => match[1])
        .slice(0, 8)
    )
  );

  return { ipAddresses, deviceIds, imeis };
}

function isTelecomOrDeviceQuery(query: string): boolean {
  return /\b(last|latest|recent|called|call|cdr|phone|contact|receiver|ip|imei|imsi|device|mac|handset|telemetry|real|govt|government|carrier|telecom|operator|automatic|automatically)\b/i.test(query);
}

function buildSensitiveTelecomAnswer(
  query: string,
  cdrRecords: CdrRecord[],
  corpus: EvidenceCorpusDocument[]
) {
  const q = normalize(query);
  const asksForCalls = /\b(last|latest|recent|called|call|cdr|phone|contact|receiver)\b/i.test(query);
  const asksForDevice = /\b(ip|imei|imsi|device|mac|handset|telemetry)\b/i.test(query);
  const asksForExternalAccess = /\b(real|govt|government|carrier|telecom|operator|automatic|automatically|imei)\b/i.test(query);

  if (!isTelecomOrDeviceQuery(query) || (!asksForCalls && !asksForDevice && !asksForExternalAccess)) return null;

  const targetPhones = new Set(extractPhoneKeys(query));
  const matchingCdr = cdrRecords
    .filter((record) => {
      if (targetPhones.size > 0) return cdrMatchesPhone(record, targetPhones);
      return cdrMatchesText(record, query);
    })
    .sort((a, b) => timestampValue(b.timestamp) - timestampValue(a.timestamp));

  const fallbackCdr = [...cdrRecords].sort((a, b) => timestampValue(b.timestamp) - timestampValue(a.timestamp));
  const lastCall = matchingCdr[0] || (asksForCalls && targetPhones.size === 0 ? fallbackCdr[0] : undefined);
  const indicators = collectCorpusIndicators(corpus);
  const response: string[] = [
    "### Authorized telecom/device intelligence",
    "I can answer from TRACIA's authorized workspace records. I did not query carrier, government, or device-manufacturer systems, and I will not invent real call logs, IP addresses, or IMEIs that are not in the evidence.",
  ];

  if (asksForCalls) {
    if (lastCall) {
      const counterparty = targetPhones.size > 0
        ? describeCounterparty(lastCall, targetPhones)
        : `${lastCall.receiverName || "Unknown"} (${lastCall.receiver})`;
      response.push(
        `**Last authorized CDR match:** ${lastCall.timestamp}\n` +
        `- Caller: ${lastCall.callerName || "Unknown"} (${lastCall.caller})\n` +
        `- Receiver: ${lastCall.receiverName || "Unknown"} (${lastCall.receiver})\n` +
        `- Counterparty focus: ${counterparty}\n` +
        `- Duration: ${lastCall.durationSec}s\n` +
        `- Tower/location note: ${lastCall.towerLocation || "Not recorded"}\n` +
        `- Record ID: ${lastCall.id}`
      );
    } else {
      response.push(
        "**CDR result:** No matching authorized call-detail record is available in this workspace. Upload a lawful CDR export or connect an approved telecom integration for this case."
      );
    }
  }

  if (asksForDevice) {
    const deviceLines: string[] = [];
    if (indicators.ipAddresses.length) deviceLines.push(`- IP indicators found in evidence text: ${indicators.ipAddresses.join(", ")}`);
    if (indicators.deviceIds.length) deviceLines.push(`- Device IDs found in evidence text: ${indicators.deviceIds.join(", ")}`);
    if (indicators.imeis.length) {
      deviceLines.push(`- IMEI values found in evidence text: ${indicators.imeis.join(", ")}`);
    } else if (q.includes("imei")) {
      deviceLines.push("- IMEI: not present in the authorized workspace records I can read.");
    }

    response.push(
      deviceLines.length
        ? `**Device/IP evidence:**\n${deviceLines.join("\n")}`
        : "**Device/IP evidence:** No matching IP, device ID, MAC, or IMEI indicator is present in the authorized workspace records I can read."
    );
  }

  if (asksForExternalAccess) {
    response.push(
      "**Integration note:** To use real government or carrier APIs, TRACIA needs an explicitly authorized connector, credentials, audit logging, and case/legal basis. After those records are ingested, I can analyze them automatically."
    );
  }

  return { text: response.join("\n\n") };
}

async function readTextFileIfExists(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

async function readDirectoryDocuments(
  directoryPath: string,
  kind: string,
  extensions: string[]
): Promise<EvidenceCorpusDocument[]> {
  try {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });
    const docs = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && extensions.includes(path.extname(entry.name).toLowerCase()))
        .map(async (entry) => {
          const filePath = path.join(directoryPath, entry.name);
          const content = await readTextFileIfExists(filePath);
          if (!content) return null;
          return {
            source: path.relative(process.cwd(), filePath),
            kind,
            content: trimForContext(content),
          };
        })
    );
    return docs.filter((doc): doc is EvidenceCorpusDocument => Boolean(doc));
  } catch {
    return [];
  }
}

function selectCorpusForPrompt(
  query: string,
  caseId: string | undefined,
  docs: EvidenceCorpusDocument[]
): EvidenceCorpusDocument[] {
  let totalChars = 0;
  return docs
    .map((doc, index) => {
      const score = scoreText(`${query} ${caseId || ""}`, `${doc.source} ${doc.kind} ${doc.content}`);
      return { doc, score, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ doc }) => doc)
    .filter((doc) => {
      const nextTotal = totalChars + doc.content.length;
      if (nextTotal > MAX_TOTAL_CORPUS_CHARS) return false;
      totalChars = nextTotal;
      return true;
    });
}

async function loadEvidenceCorpus(
  query: string,
  caseId: string | undefined
): Promise<EvidenceCorpusDocument[]> {
  const root = process.cwd();
  const docs: EvidenceCorpusDocument[] = [];

  const persistentFiles = [
    ["cases.json", "data/cases.json", "persistent cases"],
    ["firs.json", "data/firs.json", "persistent FIRs"],
    ["evidence.json", "data/evidence.json", "persistent evidence metadata"],
    ["audit_logs.json", "data/audit_logs.json", "audit log"],
  ] as const;

  for (const [filename, source, kind] of persistentFiles) {
    const filePath = path.join(root, "data", filename);
    const content = await readTextFileIfExists(filePath);
    if (content) {
      docs.push({
        source,
        kind,
        content: trimForContext(content),
      });
    }
  }

  docs.push(
    ...(await readDirectoryDocuments(
      path.join(root, "Tracia-AI", "data", "cases", "incoming"),
      "case document text",
      [".txt", ".json", ".csv", ".md"]
    )),
    ...(await readDirectoryDocuments(
      path.join(root, "Tracia-AI", "data", "processed"),
      "processed investigation dataset",
      [".csv", ".json", ".txt"]
    )),
    ...(await readDirectoryDocuments(
      path.join(root, "Tracia-AI", "data", "raw"),
      "raw investigation dataset",
      [".csv", ".json", ".txt"]
    ))
  );

  return selectCorpusForPrompt(query, caseId, docs);
}

function buildLocalCopilotAnswer(
  query: string,
  caseId: string | undefined,
  cases: ExtendedCaseItem[],
  firs: FirRecord[],
  evidence: EvidenceFile[],
  cdrRecords: CdrRecord[]
) {
  const q = normalize(query);
  const scopedCases = caseId
    ? cases.filter((item) => item.id.toUpperCase() === caseId.toUpperCase())
    : cases;
  const caseIds = new Set(scopedCases.map((item) => item.id.toUpperCase()));
  const scopedFirs = firs.filter((item) => !caseId || caseIds.has((item.caseId || "").toUpperCase()));
  const scopedEvidence = evidence.filter((item) => {
    const itemCaseId = "caseId" in item ? String((item as EvidenceFile & { caseId?: string }).caseId || "") : "";
    return !caseId || itemCaseId.toUpperCase() === caseId.toUpperCase();
  });

  const searchableCases = scopedCases.length ? scopedCases : cases;
  const searchableFirs = scopedFirs.length ? scopedFirs : firs;
  const searchableEvidence = scopedEvidence.length ? scopedEvidence : evidence;

  const matchingCases = searchableCases
    .map((item) => ({
      item,
      score: scoreText(query, `${item.id} ${item.name} ${item.desc} ${item.category} ${item.priority}`),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const matchingFirs = searchableFirs
    .map((item) => ({
      item,
      score: scoreText(query, `${item.firNumber} ${item.policeStation} ${item.sections} ${item.complainant} ${item.accused} ${item.description}`),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const matchingEvidence = searchableEvidence
    .map((item) => ({
      item,
      score: scoreText(query, `${item.id} ${item.filename} ${item.type} ${item.status}`),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const asksForSummary = q.includes("summary") || q.includes("summarize") || q.includes("overview") || q.includes("all");
  const asksForEvidence = q.includes("evidence") || q.includes("fir") || q.includes("file") || q.includes("document");
  const asksForRisk = q.includes("risk") || q.includes("target") || q.includes("suspect") || q.includes("accused");
  const asksForLocation = q.includes("location") || q.includes("map") || q.includes("mumbai") || q.includes("delhi");
  const asksForCalls = q.includes("call") || q.includes("cdr") || q.includes("phone") || q.includes("contact");

  const caseLines = (matchingCases.length ? matchingCases.map(({ item }) => item) : searchableCases.slice(0, 5))
    .map((item) => `- ${item.id}: ${item.name} (${item.status}, ${item.priority})`);
  const firLines = (matchingFirs.length ? matchingFirs.map(({ item }) => item) : searchableFirs.slice(0, 5))
    .map((item) => `- ${item.firNumber}: ${item.policeStation}; accused: ${item.accused}; sections: ${item.sections}`);
  const evidenceLines = (matchingEvidence.length ? matchingEvidence.map(({ item }) => item) : searchableEvidence.slice(0, 6))
    .map((item) => `- ${item.id}: ${item.filename} (${item.type}, ${item.status})`);
  const targetPhones = new Set(extractPhoneKeys(query));
  const cdrLines = cdrRecords
    .filter((record) => targetPhones.size === 0 || cdrMatchesPhone(record, targetPhones))
    .sort((a, b) => timestampValue(b.timestamp) - timestampValue(a.timestamp))
    .slice(0, asksForCalls ? 6 : 3)
    .map((record) => `- ${record.timestamp}: ${record.callerName} (${record.caller}) -> ${record.receiverName} (${record.receiver}), ${record.durationSec}s, ${record.towerLocation}`);

  let focus = "local investigation records";
  if (asksForEvidence) focus = "FIR and evidence records";
  else if (asksForCalls) focus = "authorized CDR and phone records";
  else if (asksForRisk) focus = "suspect and risk context";
  else if (asksForLocation) focus = "location intelligence";
  else if (asksForSummary) focus = "case summary";

  const locationNote = asksForLocation
    ? "\n\n**Location context:** The available records explicitly reference Mumbai, Delhi, Bandra Kurla Complex, the Mumbai-Delhi corridor, and vehicle MH01AB1234 where present in FIR/case text."
    : "";

  const riskNote = asksForRisk
    ? "\n\n**Risk focus:** Prioritize accused names, linked phone numbers, shell companies, wire accounts, and cross-case references surfaced by the FIR registry."
    : "";

  return {
    text:
      `### TRACIA Copilot Answer (${focus})\n\n` +
      `Scope: ${caseId || "Global workspace"}\n\n` +
      `**Cases:**\n${formatList(caseLines)}\n\n` +
      `**Registered FIRs:**\n${formatList(firLines)}\n\n` +
      `**Indexed Evidence:**\n${formatList(evidenceLines)}\n\n` +
      `**Authorized CDR Records:**\n${formatList(cdrLines, "No matching authorized CDR rows found")}` +
      locationNote +
      riskNote,
  };
}

function compactInvestigationContext(
  query: string,
  caseId: string | undefined,
  cases: ExtendedCaseItem[],
  firs: FirRecord[],
  evidence: EvidenceFile[],
  cdrRecords: CdrRecord[],
  graph: Neo4jGraphResult,
  corpus: EvidenceCorpusDocument[]
) {
  const scopedCases = caseId
    ? cases.filter((item) => item.id.toUpperCase() === caseId.toUpperCase())
    : cases;
  const caseIds = new Set(scopedCases.map((item) => item.id.toUpperCase()));
  const scopedFirs = firs.filter((item) => !caseId || caseIds.has((item.caseId || "").toUpperCase()));
  const scopedEvidence = evidence.filter((item) => {
    const itemCaseId = "caseId" in item ? String((item as EvidenceFile & { caseId?: string }).caseId || "") : "";
    return !caseId || itemCaseId.toUpperCase() === caseId.toUpperCase();
  });

  const rankByQuery = <T,>(items: T[], render: (item: T) => string, limit: number) =>
    items
      .map((item) => ({ item, score: scoreText(query, render(item)) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ item }) => item);

  const relevantCases = rankByQuery(
    scopedCases.length ? scopedCases : cases,
    (item) => `${item.id} ${item.name} ${item.desc} ${item.category} ${item.priority} ${item.status}`,
    8
  );
  const relevantFirs = rankByQuery(
    scopedFirs.length ? scopedFirs : firs,
    (item) => `${item.firNumber} ${item.policeStation} ${item.sections} ${item.complainant} ${item.accused} ${item.description}`,
    8
  );
  const relevantEvidence = rankByQuery(
    scopedEvidence.length ? scopedEvidence : evidence,
    (item) => `${item.id} ${item.filename} ${item.type} ${item.status}`,
    10
  );
  const targetPhones = new Set(extractPhoneKeys(query));
  const relevantCdr = (targetPhones.size > 0
    ? cdrRecords.filter((record) => cdrMatchesPhone(record, targetPhones))
    : rankByQuery(
        cdrRecords,
        (item) => `${item.id} ${item.caller} ${item.callerName} ${item.receiver} ${item.receiverName} ${item.towerLocation} ${item.timestamp}`,
        12
      ))
    .sort((a, b) => timestampValue(b.timestamp) - timestampValue(a.timestamp))
    .slice(0, 12);

  return {
    scope: caseId || "global",
    records: {
      cases: relevantCases.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.desc,
        status: item.status,
        priority: item.priority,
        category: item.category,
      })),
      firs: relevantFirs.map((item) => ({
        firNumber: item.firNumber,
        caseId: item.caseId,
        policeStation: item.policeStation,
        sections: item.sections,
        complainant: item.complainant,
        accused: item.accused,
        description: item.description,
        status: item.status,
      })),
      evidence: relevantEvidence.map((item) => ({
        id: item.id,
        filename: item.filename,
        type: item.type,
        status: item.status,
      })),
      cdr: relevantCdr.map((item) => ({
        id: item.id,
        caller: item.caller,
        callerName: item.callerName,
        receiver: item.receiver,
        receiverName: item.receiverName,
        durationSec: item.durationSec,
        timestamp: item.timestamp,
        towerLocation: item.towerLocation,
        crossCaseOverlap: item.crossCaseOverlap,
      })),
    },
    evidenceCorpus: corpus.map((doc) => ({
      source: doc.source,
      kind: doc.kind,
      content: doc.content,
    })),
    graph: {
      connected: graph.connected,
      error: graph.error || null,
      nodes: graph.nodes.slice(0, 35).map((node) => ({
        id: node.id,
        label: node.label,
        type: node.type,
        risk: node.risk,
        subtitle: node.details.subtitle,
      })),
      relationships: graph.edges.slice(0, 35).map((edge) => ({
        from: edge.from,
        to: edge.to,
        label: edge.label,
        kind: edge.kind,
      })),
    },
  };
}

function extractOpenAiText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const response = data as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{ text?: unknown; type?: unknown }>;
    }>;
  };

  if (typeof response.output_text === "string") return response.output_text.trim();

  return (response.output || [])
    .flatMap((item) => item.content || [])
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function queryOpenAiCopilot(
  query: string,
  caseId: string | undefined,
  cases: ExtendedCaseItem[],
  firs: FirRecord[],
  evidence: EvidenceFile[],
  cdrRecords: CdrRecord[],
  graph: Neo4jGraphResult,
  corpus: EvidenceCorpusDocument[]
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  const context = compactInvestigationContext(query, caseId, cases, firs, evidence, cdrRecords, graph, corpus);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5",
        instructions:
          "You are TRACIA Intelligence Copilot, a lawful investigative assistant. Answer the user's exact question using every supplied TRACIA source: full evidence corpus, case documents, FIRs, evidence metadata, authorized CDR rows, audit logs, raw/processed datasets, and graph context. Treat evidenceCorpus, CDR, FIR, and case documents as primary facts; use the graph only as supporting relationship context. Do not ignore non-graph evidence. Do not invent case facts, call records, IP addresses, device identifiers, IMEIs, or government/carrier data. If the supplied material does not contain an answer, say what authorized record or integration is missing. Return only the relevant answer in concise markdown, with no sources section and no graph traversal section.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  `Question: ${query}\n\n` +
                  `Active scope: ${caseId || "global workspace"}\n\n` +
                  `TRACIA context JSON:\n${JSON.stringify(context)}`,
              },
            ],
          },
        ],
        reasoning: {
          effort: "low",
        },
        text: {
          verbosity: "low",
        },
        max_output_tokens: 2200,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const message = typeof data?.error?.message === "string" ? data.error.message : response.statusText;
      throw new Error(message);
    }

    const text = extractOpenAiText(data);
    if (!text) return null;

    return {
      text,
    };
  } catch (error: unknown) {
    console.error("[TRACIA Copilot] OpenAI request failed:", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function queryRemoteGraphRagCopilot(
  query: string,
  caseId: string | undefined,
  entityFocus?: unknown
) {
  const renderAskBody = {
    question: query,
    case_id: caseId || null,
    entity_focus: entityFocus || null,
  };
  const renderAsk = await fetchRenderJson<unknown>("/api/copilot/ask", {
    method: "POST",
    body: JSON.stringify(renderAskBody),
    timeoutMs: 4500,
  });

  if (!renderAsk.ok) return null;

  const data = renderAsk.data as Record<string, unknown> | string;
  const text = typeof data === "string"
    ? data
    : String(data.answer || data.response || data.text || "");

  return text.trim() ? { text } : null;
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    ai: {
      provider: process.env.OPENAI_API_KEY ? "openai" : "local-evidence",
      model: process.env.OPENAI_MODEL || "gpt-5",
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    },
    graph: {
      neo4jConfigured: Boolean(process.env.NEO4J_URI && process.env.NEO4J_USERNAME && process.env.NEO4J_PASSWORD),
    },
    upstream: process.env.FASTAPI_BACKEND_URL || "https://criminal-network-api-latest.onrender.com",
    endpoints: ["/api/copilot", "/api/copilot/ask", "/api/ask"],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const caseId = body.caseId || body.case_id;
    const query = String(body.prompt || body.question || body.message || body.query || "").trim();
    const queryLower = query.toLowerCase();

    if (!query) {
      return NextResponse.json({ error: "Query prompt is required" }, { status: 400 });
    }

    const requiresLocalTelecomHandling = isTelecomOrDeviceQuery(query);

    const remoteEntityFocus = body.entity_focus || body.entityFocus || null;

    if (!process.env.OPENAI_API_KEY && !requiresLocalTelecomHandling) {
      const remoteAnswer = await queryRemoteGraphRagCopilot(query, caseId ? String(caseId) : undefined, remoteEntityFocus);
      if (remoteAnswer) return NextResponse.json(remoteAnswer);
    }

    const isBroad = [
      "all", "overview", "summary", "network", "entities",
      "graph", "show", "list", "targets", "phones", "suspects", "who", "what", "location", "map"
    ].some((w) => queryLower.includes(w));
    const words = queryLower
      .split(/[^a-zA-Z0-9+]+/)
      .filter((w) => w.length > 2);

    let graph = {
      connected: false,
      cypher: "",
      nodes: [],
      edges: [],
      error: "Graph query not attempted.",
    } as Awaited<ReturnType<typeof queryGraphFromNeo4j>>;

    try {
      graph = caseId
        ? await queryGraphFromNeo4j(buildCaseGraphCypher(), await resolveCaseGraphParams(String(caseId)))
        : await queryGraphFromNeo4j();
    } catch (graphError: unknown) {
      graph = {
        connected: false,
        cypher: "",
        nodes: [],
        edges: [],
        error: graphError instanceof Error ? graphError.message : "Graph query failed.",
      };
    }
    const searchableWords = words.length > 0 ? words : ["case", "entity", "person", "location"];
    const graphNodes = graph.nodes.filter((node) => {
      const haystack = `${node.id} ${node.label} ${node.type} ${node.risk || ""} ${node.details.subtitle || ""}`.toLowerCase();
      return isBroad || searchableWords.some((word) => haystack.includes(word));
    });
    const graphNodeIds = new Set(graphNodes.map((node) => node.id));
    const graphPaths = graph.edges
      .filter((edge) => graphNodeIds.has(edge.from) || graphNodeIds.has(edge.to) || (caseId && graph.nodes.length > 0))
      .map((edge) => {
        const from = graph.nodes.find((node) => node.id === edge.from);
        const to = graph.nodes.find((node) => node.id === edge.to);
        return `(${from?.label || edge.from}:${from?.type || "Entity"}) -[:${edge.label}]-> (${to?.label || edge.to}:${to?.type || "Entity"})`;
      });
    const locationNodes = graph.nodes.filter((node) => node.type === "location");

    const [realCases, realFirs, realEvidence] = await Promise.all([
      getPersistentCases(),
      getPersistentFirs(),
      getPersistentEvidence(),
    ]);
    const cdrRecords = getAuthorizedCdrRecords();
    const evidenceCorpus = await loadEvidenceCorpus(query, caseId ? String(caseId) : undefined);

    const telecomAnswer = buildSensitiveTelecomAnswer(query, cdrRecords, evidenceCorpus);
    if (telecomAnswer) {
      return NextResponse.json(telecomAnswer);
    }

    const aiAnswer = await queryOpenAiCopilot(
      query,
      caseId ? String(caseId) : undefined,
      realCases,
      realFirs,
      realEvidence,
      cdrRecords,
      graph,
      evidenceCorpus
    );

    if (aiAnswer) {
      return NextResponse.json({
        text: aiAnswer.text,
        intent: "OpenAI GPT-5 GraphRAG Synthesis",
        supportingPaths: graphPaths.slice(0, 8),
        sources: [
          "Neo4j Aura Cluster (ba15f687.databases.neo4j.io)",
          "OpenAI GPT-5 Cognitive Reasoning Engine",
          "TRACIA Master Case Repository"
        ],
      });
    }

    if (!requiresLocalTelecomHandling) {
      const remoteAnswer = await queryRemoteGraphRagCopilot(query, caseId ? String(caseId) : undefined, remoteEntityFocus);
      if (remoteAnswer) return NextResponse.json(remoteAnswer);
    }

    if (graph.connected && (caseId || graphNodes.length > 0 || graphPaths.length > 0)) {
      const scopedLabel = caseId ? ` for case ${caseId}` : "";
      const highRisk = graph.nodes.filter((node) => node.risk === "high");
      const entitySummary = (graphNodes.length ? graphNodes : graph.nodes)
        .slice(0, 8)
        .map((node) => `- ${node.label} [${node.type}]${node.risk === "high" ? " HIGH RISK" : ""}`)
        .join("\n");
      const locationSummary = locationNodes.length
        ? `\n\nMapped locations in this investigation: ${locationNodes.map((node) => node.label).join(", ")}. Open the Maps tab to see Neo4j-derived pins.`
        : "";

      return NextResponse.json({
        text:
          `### Investigation Answer${scopedLabel}\n\n` +
          `Neo4j returned ${graph.nodes.length} scoped entities and ${graph.edges.length} relationships for the current investigation context.\n\n` +
          `**High-risk focus:** ${highRisk.map((node) => node.label).join(", ") || "No high-risk node is flagged in this scoped result."}` +
          locationSummary,
        supportingPaths: graphPaths.slice(0, 8),
        intent: "Neo4j Aura GraphRAG Multi-Hop Traversal",
        sources: ["Neo4j Aura Cluster (ba15f687.databases.neo4j.io)", "TRACIA Case Knowledge Base"],
      });
    }



    // 3. Persistent cases and registered FIRs
    return NextResponse.json(buildLocalCopilotAnswer(
      query,
      caseId ? String(caseId) : undefined,
      realCases,
      realFirs,
      realEvidence,
      cdrRecords
    ));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process Copilot query";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
