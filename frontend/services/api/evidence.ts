import type { EvidenceFile, EvidenceStatus } from "@/types/evidence";
import { apiClient } from "@/services/apiClient";

let evidenceStore: EvidenceFile[] = [];

export async function getEvidenceFiles(caseId?: string): Promise<EvidenceFile[]> {
  const query = caseId ? `?caseId=${encodeURIComponent(caseId)}` : "";
  return apiClient<EvidenceFile[]>(
    `/api/evidence${query}`,
    { method: "GET" },
    () => [...evidenceStore]
  );
}

export function getEvidenceFilesSync(): EvidenceFile[] {
  return [...evidenceStore];
}

export async function uploadEvidenceFile(file: { filename: string; type: string }): Promise<EvidenceFile> {
  return apiClient<EvidenceFile>(
    "/api/evidence",
    { method: "POST", body: JSON.stringify(file) },
    () => {
      const newFile: EvidenceFile = {
        id: `evd-${Date.now()}`,
        filename: file.filename,
        type: file.type,
        status: "Uploaded",
        progress: 0,
      };
      evidenceStore = [newFile, ...evidenceStore];
      return newFile;
    }
  );
}

export async function updateEvidenceStatus(
  id: string,
  status: EvidenceStatus,
  progress?: number
): Promise<EvidenceFile | null> {
  return apiClient<EvidenceFile | null>(
    `/api/evidence/${id}/status`,
    { method: "PATCH", body: JSON.stringify({ status, progress }) },
    () => {
      let updated: EvidenceFile | null = null;
      evidenceStore = evidenceStore.map((f) => {
        if (f.id === id) {
          updated = { ...f, status, progress: progress !== undefined ? progress : f.progress };
          return updated;
        }
        return f;
      });
      return updated;
    }
  );
}
