import type { BlockchainRecord, CustodyPipelineStep } from "@/types/blockchain";

export const MOCK_BLOCKCHAIN_RECORDS: BlockchainRecord[] = [
  {
    evidenceId: "EVD_101",
    filename: "incident_report_01.pdf",
    sha256Hash: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
    txId: "0x7f8a3291bc409a12e345b6789c01234567890abc",
    timestamp: "2025-05-10 09:05:12 Z",
    custodian: "Inspector A (INV-4492)",
    verifiedStatus: "Verified",
    history: [
      { step: "Evidence Collected", actor: "Officer A", timestamp: "2025-05-10 09:00:00 Z" },
      { step: "SHA-256 Hash Generated & Stored on Blockchain", actor: "SYSTEM", timestamp: "2025-05-10 09:05:12 Z" },
      { step: "Transferred to Forensic Expert B", actor: "Forensic Expert B", timestamp: "2025-05-10 13:30:00 Z" },
      { step: "Transferred to Secure Custodian Vault", actor: "Custodian Officer C", timestamp: "2025-05-10 15:00:00 Z" },
    ],
  },
  {
    evidenceId: "EVD_102",
    filename: "cdr_dump_q1.csv",
    sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    txId: "0x3b91a827c6014e9921b345a678901234567890ef",
    timestamp: "2025-05-10 10:00:00 Z",
    custodian: "Analyst 01",
    verifiedStatus: "Verified",
    history: [
      { step: "CDR Data Ingested", actor: "Analyst 01", timestamp: "2025-05-10 10:00:00 Z" },
      { step: "SHA-256 Hash Verified", actor: "SYSTEM", timestamp: "2025-05-10 10:02:00 Z" },
    ],
  },
];

export const MOCK_CUSTODY_PIPELINE_STEPS: CustodyPipelineStep[] = [
  { stepNumber: 1, title: "Evidence Collected", actor: "Officer A", details: "Seized from primary crime scene" },
  { stepNumber: 2, title: "Transferred", actor: "Secure Vault", details: "Logged into evidence locker" },
  { stepNumber: 3, title: "Forensic Expert", actor: "Expert B", details: "Forensic extraction underway" },
  { stepNumber: 4, title: "Analysis", actor: "SHA-256 Generated", details: "Cryptographic digest created" },
  { stepNumber: 5, title: "Court Submission", actor: "Verified Legal Record", details: "Immutable chain on permissioned ledger" },
];
