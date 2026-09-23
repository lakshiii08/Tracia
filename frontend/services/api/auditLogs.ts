import type { AuditEntry } from "@/lib/store";
import { apiClient } from "@/services/apiClient";

let auditLogsStore: AuditEntry[] = [];

export async function getAuditLogs(): Promise<AuditEntry[]> {
  return apiClient<AuditEntry[]>(
    "/api/audit-logs",
    { method: "GET" },
    () => [...auditLogsStore]
  );
}

export function logAuditEventSync(message: string, actor: string = "SYSTEM"): AuditEntry {
  const newEntry: AuditEntry = {
    id: `aud-${Date.now()}`,
    time: new Date().toISOString().replace("T", " ").substring(0, 19),
    message,
    actor,
  };
  auditLogsStore = [newEntry, ...auditLogsStore];
  return newEntry;
}

export async function logAuditEvent(message: string, actor: string = "SYSTEM"): Promise<AuditEntry> {
  return apiClient<AuditEntry>(
    "/api/audit-logs",
    {
      method: "POST",
      body: JSON.stringify({ message, actor }),
    },
    () => logAuditEventSync(message, actor)
  );
}
