import type { AuditEntry } from "@/lib/store";

export const MOCK_AUDIT_LOGS: AuditEntry[] = [
  { id: "audit-1", time: "13:55:12.901Z", message: "Evidence Ingested — Batch ID: BTCH_994A", actor: "INV-4492" },
  { id: "audit-2", time: "13:58:44.210Z", message: "OCR Extraction Complete — incident_report_01.pdf", actor: "SYSTEM" },
  { id: "audit-3", time: "14:02:18.004Z", message: "Entity Resolved: PER_8922 — high confidence match across 3 sources", actor: "INV-4492" },
  { id: "audit-4", time: "2025-05-23 10:14:02", message: "Case access request submitted for C-1045 by Det. J. Smith", actor: "IO-101" },
  { id: "audit-5", time: "2025-05-23 09:45:10", message: "Case access request APPROVED for C-1001 by Admin", actor: "Inspector A. Admin" },
  { id: "audit-6", time: "2025-05-23 08:30:15", message: "User session authenticated: Det. J. Smith (Investigating Officer)", actor: "SYSTEM" },
];
