export interface EvidenceRecord {
  evidence_id: string;
  case_id: string;
  version: number;
  file_name: string;
  sha256: string;
  blockchain_network: string;
  contract_address: string;
  transaction_hash: string;
  block_number: number;
  status: "CONFIRMED" | "CONFIRMED (DEMO)" | "PENDING" | "FAILED" | "TAMPERED";
  registered_at: string;
  registered_by: string;
  explorer_url?: string;
  file_size_bytes?: number;
  mime_type?: string;
  is_tampered?: boolean;
  original_sha256?: string;
}

export interface VerificationResult {
  evidence_id: string;
  version: number;
  current_hash: string;
  registered_hash: string;
  integrity_status: "VERIFIED" | "POTENTIAL_INTEGRITY_MISMATCH" | "ERROR";
  is_match: boolean;
  verified_at: string;
  verified_by: string;
  blockchain_network: string;
  contract_address?: string;
  transaction_hash?: string;
  block_number?: number;
  explanation: string;
  explorer_url?: string;
}

export interface ProvenanceEvent {
  step_number: number;
  stage: "EVIDENCE_INGESTION" | "BLOCKCHAIN_ANCHOR" | "CUSTODY_TRANSFER" | "INTEGRITY_VERIFICATION";
  description: string;
  timestamp: string;
  actor: string;
  details?: Record<string, unknown>;
}

export interface VerificationHistoryItem {
  id: number;
  version: number;
  integrity_status: string;
  is_match: boolean;
  calculated_hash: string;
  expected_hash: string;
  verified_at: string;
  verified_by: string;
  notes?: string;
}

export interface ProvenanceData {
  evidence_id: string;
  case_id: string;
  current_version: number;
  sha256_hash: string;
  status: string;
  timeline: ProvenanceEvent[];
  verification_history: VerificationHistoryItem[];
}

export interface Web3WalletState {
  connected: boolean;
  address: string | null;
  chainId: string | null;
  networkName: string;
  isConnecting: boolean;
  contractAddress: string;
  error: string | null;
}
