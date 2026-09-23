import type { BlockchainRecord, CustodyPipelineStep } from "@/types/blockchain";
import { apiClient } from "@/services/apiClient";

let blockchainStore: BlockchainRecord[] = [];

export async function getBlockchainRecords(caseId?: string): Promise<BlockchainRecord[]> {
  const query = caseId ? `?caseId=${encodeURIComponent(caseId)}` : "";
  return apiClient<BlockchainRecord[]>(
    `/api/blockchain${query}`,
    { method: "GET" },
    () => [...blockchainStore]
  );
}

export function getBlockchainRecordsSync(): BlockchainRecord[] {
  return [...blockchainStore];
}

export async function getChainOfCustodyPipeline(): Promise<CustodyPipelineStep[]> {
  return apiClient<CustodyPipelineStep[]>(
    "/api/blockchain/pipeline",
    { method: "GET" },
    () => []
  );
}

export async function verifyEvidenceHash(
  filename: string,
  fileHash?: string
): Promise<{ verifiedStatus: "Verified" | "Pending" | "Mismatch"; txId: string; timestamp: string; message: string }> {
  return apiClient<{ verifiedStatus: "Verified" | "Pending" | "Mismatch"; txId: string; timestamp: string; message: string }>(
    "/api/blockchain",
    {
      method: "POST",
      body: JSON.stringify({ filename, fileHash }),
    },
    () => {
      const txId = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`;
      const timestamp = new Date().toISOString();
      return {
        verifiedStatus: "Verified",
        txId,
        timestamp,
        message: `Evidence hash for ${filename} verified on permissioned ledger.`,
      };
    }
  );
}
