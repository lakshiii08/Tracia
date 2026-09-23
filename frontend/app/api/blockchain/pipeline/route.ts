import { NextResponse } from "next/server";
import type { CustodyPipelineStep } from "@/types/blockchain";

export async function GET() {
  const custodySteps: CustodyPipelineStep[] = [
    { stepNumber: 1, title: "Evidence Ingested", actor: "Investigating Officer", details: "Initial intake and cryptographic timestamping" },
    { stepNumber: 2, title: "SHA-256 Fingerprint Generated", actor: "Client WebCrypto Engine", details: "Client-side SHA-256 digest computed before upload" },
    { stepNumber: 3, title: "OCR & Document Processing", actor: "TRACIA Processing Pipeline", details: "Entity extraction and schema normalization" },
    { stepNumber: 4, title: "Graph & Relational Anchoring", actor: "Neo4j Aura Cluster", details: "Entities linked across active criminal network nodes" },
    { stepNumber: 5, title: "Immutable Chain of Custody", actor: "Polygon Amoy EVM Ledger", details: "Audit trail and transaction hash registered" },
  ];
  return NextResponse.json(custodySteps);
}
