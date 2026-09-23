export type AlertSeverity = "HIGH" | "MEDIUM" | "LOW";

export interface AlertItem {
  id: string;
  title: string;
  caseId: string;
  severity: AlertSeverity;
  time: string;
  unread: boolean;
  description?: string;
  metadata?: Record<string, string | number | boolean>;
}
