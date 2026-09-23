import type { AlertItem } from "@/types/alerts";
import { apiClient } from "@/services/apiClient";

let alertsStore: AlertItem[] = [];

export async function getAlerts(): Promise<AlertItem[]> {
  return apiClient<AlertItem[]>("/api/alerts", { method: "GET" }, () => [...alertsStore]);
}

export function getAlertsSync(): AlertItem[] {
  return alertsStore;
}

export async function markAlertAsRead(id: string): Promise<AlertItem | null> {
  return apiClient<AlertItem | null>(
    `/api/alerts/${id}/read`,
    { method: "POST" },
    () => {
      let updated: AlertItem | null = null;
      alertsStore = alertsStore.map((item) => {
        if (item.id === id) {
          updated = { ...item, unread: false };
          return updated;
        }
        return item;
      });
      return updated;
    }
  );
}

export async function markAllAlertsAsRead(): Promise<AlertItem[]> {
  return apiClient<AlertItem[]>(
    "/api/alerts/mark-all-read",
    { method: "POST" },
    () => {
      alertsStore = alertsStore.map((item) => ({ ...item, unread: false }));
      return [...alertsStore];
    }
  );
}

export async function clearAllAlerts(): Promise<void> {
  return apiClient<void>(
    "/api/alerts/clear",
    { method: "POST" },
    () => {
      alertsStore = [];
    }
  );
}

export async function dismissAlert(id: string): Promise<void> {
  return apiClient<void>(
    `/api/alerts/${id}`,
    { method: "DELETE" },
    () => {
      alertsStore = alertsStore.filter((item) => item.id !== id);
    }
  );
}
