import type { CyberIntelEvent, CyberChain } from "@/types/cyberIntel";
import { apiClient } from "@/services/apiClient";

let cyberEventsStore: CyberIntelEvent[] = [];

export async function getCyberEvents(caseId?: string): Promise<CyberIntelEvent[]> {
  const query = caseId ? `?caseId=${encodeURIComponent(caseId)}` : "";
  return apiClient<CyberIntelEvent[]>(
    `/api/cyber-intel${query}`,
    { method: "GET" },
    () => [...cyberEventsStore]
  );
}

export function getCyberEventsSync(): CyberIntelEvent[] {
  return [...cyberEventsStore];
}

export async function getCyberChain(caseId?: string): Promise<CyberChain> {
  const query = caseId ? `?caseId=${encodeURIComponent(caseId)}` : "";
  return apiClient<CyberChain>(
    `/api/cyber-intel/chain${query}`,
    { method: "GET" },
    () => ({ nodes: [], steps: [] })
  );
}

export async function addCyberEvent(event: Omit<CyberIntelEvent, "id">): Promise<CyberIntelEvent> {
  return apiClient<CyberIntelEvent>(
    "/api/cyber-intel",
    { method: "POST", body: JSON.stringify(event) },
    () => {
      const newEvent: CyberIntelEvent = {
        ...event,
        id: `CYBER_0${cyberEventsStore.length + 1}`,
      };
      cyberEventsStore = [newEvent, ...cyberEventsStore];
      return newEvent;
    }
  );
}
