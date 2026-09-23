import type { CopilotMessage, CopilotQueryResponse } from "@/types/copilot";

export type CopilotStatus = {
  status: string;
  ai?: {
    provider: "openai" | "local-evidence" | string;
    model: string;
    openaiConfigured: boolean;
  };
  graph?: {
    neo4jConfigured: boolean;
  };
};

export async function getCopilotStatus(): Promise<CopilotStatus | null> {
  const res = await fetch("/api/copilot", { method: "GET", cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as CopilotStatus;
}

export async function getCopilotInitialMessages(): Promise<CopilotMessage[]> {
  const res = await fetch("/api/copilot/history", { method: "GET", cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as CopilotMessage[];
}

export async function queryCopilot(prompt: string, caseId?: string): Promise<CopilotQueryResponse> {
  const res = await fetch("/api/copilot", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, caseId }),
  });

  const data = (await res.json()) as CopilotQueryResponse;
  if (!res.ok) {
    throw new Error(data.error || `Copilot API error ${res.status}`);
  }
  return data;
}
