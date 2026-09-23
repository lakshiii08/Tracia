export interface BlockchainHistoryEntry {
  step: string;
  actor: string;
  timestamp: string;
}

export interface BlockchainRecord {
  evidenceId: string;
  filename: string;
  sha256Hash: string;
  txId: string;
  timestamp: string;
  custodian: string;
  verifiedStatus: "Verified" | "Pending" | "Mismatch";
  history: BlockchainHistoryEntry[];
}

export interface CustodyPipelineStep {
  stepNumber: number;
  title: string;
  actor: string;
  details?: string;
}
