import type { ExtendedCaseItem } from "@/types/cases";
import { apiClient } from "@/services/apiClient";

let casesStore: ExtendedCaseItem[] = [];

export async function getCases(): Promise<ExtendedCaseItem[]> {
  return apiClient<ExtendedCaseItem[]>(
    "/api/cases",
    { method: "GET" },
    () => [...casesStore]
  );
}

export function getCasesSync(): ExtendedCaseItem[] {
  return [...casesStore];
}

export async function getCaseById(caseId: string): Promise<ExtendedCaseItem | null> {
  return apiClient<ExtendedCaseItem | null>(
    `/api/cases/${encodeURIComponent(caseId)}`,
    { method: "GET" },
    () => casesStore.find((c) => c.id.toUpperCase() === caseId.toUpperCase()) || null
  );
}

export async function getAssignedCases(userId: string): Promise<ExtendedCaseItem[]> {
  return apiClient<ExtendedCaseItem[]>(
    `/api/cases/assigned/${encodeURIComponent(userId)}`,
    { method: "GET" },
    () => casesStore.filter((c) => c.assignedOfficerIds?.includes(userId))
  );
}

export async function addCaseApi(input: {
  name: string;
  desc: string;
  category: string;
  priority: "High" | "Medium" | "Critical" | "Low";
  assignedOfficerId?: string;
}): Promise<ExtendedCaseItem> {
  return apiClient<ExtendedCaseItem>(
    "/api/cases",
    { method: "POST", body: JSON.stringify(input) },
    () => {
      const newId = `C-${1000 + casesStore.length + 1}`;
      const newCase: ExtendedCaseItem = {
        id: newId,
        name: input.name,
        desc: input.desc,
        entities: 1,
        date: new Date().toISOString().split("T")[0],
        status: "Active",
        tone: "person",
        icon: "folder",
        href: `/case/${newId}`,
        priority: input.priority || "High",
        category: input.category || "General",
        classification: "Confidential",
        assignedOfficerIds: [input.assignedOfficerId || "IO-101"],
        assignees: [
          { name: "Det. J. Smith", role: "Lead Investigator" },
          { name: "Inspector A. Admin", role: "Supervising Admin" },
        ],
      };

      casesStore = [newCase, ...casesStore];
      return newCase;
    }
  );
}

export async function updateCaseApi(
  id: string,
  patch: Partial<ExtendedCaseItem>
): Promise<ExtendedCaseItem | null> {
  return apiClient<ExtendedCaseItem | null>(
    `/api/cases/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(patch) },
    () => {
      let updated: ExtendedCaseItem | null = null;
      casesStore = casesStore.map((c) => {
        if (c.id === id) {
          updated = { ...c, ...patch };
          return updated;
        }
        return c;
      });
      return updated;
    }
  );
}
