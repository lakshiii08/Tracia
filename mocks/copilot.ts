import type { CopilotMessage, CopilotQueryResponse } from "@/types/copilot";

export const MOCK_COPILOT_INITIAL_MESSAGES: CopilotMessage[] = [
  {
    role: "assistant",
    text: "Greetings Inspector. I am TRACIA's AI Investigation Copilot powered by GraphRAG. Ask me any question regarding suspects, call networks, timeline events, or evidence files for the selected case file.",
  },
  {
    role: "user",
    text: "Show me all high-risk targets connected to the selected case file and their burner phone communications.",
  },
  {
    role: "assistant",
    text: "Based on multi-hop GraphRAG analysis across Neo4j relationship graphs and ingested CDR logs, **Vikram Sharma** (PER_10023, High Risk) is connected to burner phone **+91 9123456780** with 342s of intercepted call activity on 2025-05-10.",
    intent: "Graph Search + CDR Analysis",
    supportingPaths: [
      "(Vikram Sharma:Person) -[:USES]-> (+91 9876543210:Phone) -[:CONNECTED_TO]-> (+91 9123456780:BurnerPhone)",
      "(Vikram Sharma:Person) -[:INVOLVED_IN]-> (Case:Active)",
    ],
    sources: ["incident_report_01.pdf", "cdr_dump_q1.csv", "Neo4j Graph Node PER_10023"],
  },
];

export function generateMockCopilotResponse(prompt: string, caseId?: string): CopilotQueryResponse {
  const queryLower = (prompt || "").toLowerCase();
  const cId = caseId || "TR-102";

  if (queryLower.includes("xyz logistics") || queryLower.includes("shell")) {
    return {
      intent: "Corporate Structure & Financial Link",
      text: "GraphRAG analysis: Person A holds unregistered beneficial ownership of XYZ Logistics (front company), linked through suspicious financial transfers to Account - 4567 and shared vehicle usage.",
      supportingPaths: [
        "(Person A:Person) -[:owns]-> (XYZ Logistics:Org) -[:transferred]-> (Account - 4567:Account)",
        "(Vehicle:MH01AB1234) -[:used_by]-> (Person A:Person)",
      ],
      sources: ["TRACIA Neo4j Graph Engine", "Corporate Registries Database", "Financial Analysis Ledger"],
    };
  }

  if (queryLower.includes("burner") || queryLower.includes("phone") || queryLower.includes("call")) {
    return {
      intent: "CDR Intercept Analysis",
      text: "Intercepted CDR log: Person A made direct calls to burner phone +91 9123456780 (342s duration) during active crime timeframe.",
      supportingPaths: [
        `(${cId}:Case) -[:HAS_SUSPECT]-> (Person A:Person) -[:called 342s]-> (+91 9123456780:BurnerPhone)`,
      ],
      sources: ["CDR Intercept Database", "Cell Tower Telemetry Records"],
    };
  }

  if (queryLower.includes("account") || queryLower.includes("bank") || queryLower.includes("money")) {
    return {
      intent: "Financial Siphoning Path",
      text: "Financial Graph RAG: Wire transfer sink Account - 4567 is linked to institutional financial siphoning in Cyber Fraud Ring (Case #209).",
      supportingPaths: [
        "(Person A:Person) -[:transferred]-> (Account - 4567:Account) -[:temporal]-> (Case #209:Case)",
      ],
      sources: ["Bank Transaction Records", "AML Suspicious Activity Reports"],
    };
  }

  return {
    intent: "GraphRAG Vector + Neo4j Search",
    text: `Synthesized response for query "${prompt}": Entity Vikram Sharma maintains a 94% probabilistic match with V. Sharma across FIR documents and CDR call records in ${cId}. SHA-256 hash verified on Blockchain TxID 0x7f8a3291bc40.`,
    supportingPaths: [
      "(Entity:Vikram Sharma) -[:CONFIRMED_MATCH 94%]--------> (Entity:V. Sharma)",
      `(${cId}:Case) -[:HAS_EVIDENCE]-> (Evidence:EVD_101) -[:VERIFIED_BY]-> (Blockchain:0x7f8a)`,
    ],
    sources: ["TRACIA Neo4j Graph Database", "Blockchain Custody Registry", "CDR Analysis Cluster #1"],
  };
}
