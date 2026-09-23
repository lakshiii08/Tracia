import type { CdrRecord, CdrRelayChain, CdrMetrics } from "@/types/cdr";
import { apiClient } from "@/services/apiClient";

let cdrRecordsStore: CdrRecord[] = [];

export async function getCdrRecords(caseId?: string): Promise<CdrRecord[]> {
  const query = caseId ? `?caseId=${encodeURIComponent(caseId)}` : "";
  return apiClient<CdrRecord[]>(
    `/api/cdr${query}`,
    { method: "GET" },
    () => [...cdrRecordsStore]
  );
}

export function getCdrRecordsSync(): CdrRecord[] {
  return [...cdrRecordsStore];
}

export async function getCdrRelayChain(caseId?: string): Promise<CdrRelayChain> {
  const query = caseId ? `?caseId=${encodeURIComponent(caseId)}` : "";
  return apiClient<CdrRelayChain>(
    `/api/cdr/relay-chain${query}`,
    { method: "GET" },
    () => ({ nodes: [], steps: [] })
  );
}

export async function getCdrMetrics(caseId?: string): Promise<CdrMetrics> {
  const query = caseId ? `?caseId=${encodeURIComponent(caseId)}` : "";
  return apiClient<CdrMetrics>(
    `/api/cdr/metrics${query}`,
    { method: "GET" },
    () => ({
      frequentContactsCount: 0,
      frequentContactsHighlight: "No live CDR data",
      sharedContactsCount: 0,
      sharedContactsHighlight: "No live CDR data",
      communicationClustersCount: 0,
      communicationClustersHighlight: "No live CDR data",
      crossCaseOverlapsCount: 0,
      crossCaseOverlapsHighlight: "No live CDR data",
    })
  );
}

export async function addCdrRecord(record: Omit<CdrRecord, "id">): Promise<CdrRecord> {
  return apiClient<CdrRecord>(
    "/api/cdr",
    { method: "POST", body: JSON.stringify(record) },
    () => {
      const newRecord: CdrRecord = {
        ...record,
        id: `cdr-${100 + cdrRecordsStore.length + 1}`,
      };
      cdrRecordsStore = [newRecord, ...cdrRecordsStore];
      return newRecord;
    }
  );
}
