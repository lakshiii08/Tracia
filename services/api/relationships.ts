import type { CaseRelationship } from "@/types/relationships";
import { apiClient } from "@/services/apiClient";

let relationshipsStore: CaseRelationship[] = [];

export async function getCaseRelationships(caseId?: string): Promise<CaseRelationship[]> {
  const query = caseId ? `?caseId=${encodeURIComponent(caseId)}` : "";
  return apiClient<CaseRelationship[]>(
    `/api/relationships${query}`,
    { method: "GET" },
    () => {
      if (!caseId) return [...relationshipsStore];
      return relationshipsStore.filter(
        (r) => r.sourceCaseId === caseId || r.targetCaseId === caseId
      );
    }
  );
}

export function getCaseRelationshipsSync(caseId?: string): CaseRelationship[] {
  if (!caseId) return [...relationshipsStore];
  return relationshipsStore.filter(
    (r) => r.sourceCaseId === caseId || r.targetCaseId === caseId
  );
}

export async function getRelatedCases(caseId: string): Promise<CaseRelationship[]> {
  return getCaseRelationships(caseId);
}
