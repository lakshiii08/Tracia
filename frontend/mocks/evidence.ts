import type { EvidenceFile } from "@/types/evidence";

export const MOCK_EVIDENCE_FILES: EvidenceFile[] = [
  { id: "evd-seed-1", filename: "cdr_dump_q1.csv", type: "CDR", status: "Indexed", progress: 100 },
  { id: "evd-seed-2", filename: "bank_statement_jan.xlsx", type: "FINANCIAL", status: "Extracted", progress: 100 },
  { id: "evd-seed-3", filename: "incident_report_01.pdf", type: "FIR", status: "Indexed", progress: 100 },
];
