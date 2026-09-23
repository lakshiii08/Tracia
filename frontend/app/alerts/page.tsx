"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import type { AlertItem } from "@/types/alerts";
import {
  getAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
  clearAllAlerts,
  dismissAlert,
} from "@/services/api/alerts";

export default function AlertsPage() {
  const [filter, setFilter] = useState("ALL");
  const [items, setItems] = useState<AlertItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    getAlerts()
      .then((data) => {
        setItems(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(
    () => items.filter((a) => filter === "ALL" || a.severity === filter),
    [items, filter]
  );

  const act = (fn: () => void, msg: string) => {
    fn();
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2200);
  };

  const handleMarkAllRead = async () => {
    act(() => setItems((x) => x.map((a) => ({ ...a, unread: false }))), "All alerts marked read");
    await markAllAlertsAsRead();
  };

  const handleClearAll = async () => {
    act(() => setItems([]), "All alerts cleared");
    await clearAllAlerts();
  };

  const handleMarkRead = async (id: string) => {
    act(() => setItems((x) => x.map((i) => (i.id === id ? { ...i, unread: false } : i))), "Alert marked read");
    await markAlertAsRead(id);
  };

  const handleDismiss = async (id: string) => {
    act(() => setItems((x) => x.filter((i) => i.id !== id)), "Alert dismissed");
    await dismissAlert(id);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title="Operational Alerts & Intelligence Feed"
          showSearch
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
          {notice && (
            <div
              role="status"
              className="fixed right-5 top-5 z-50 rounded-lg border border-primary/30 bg-surface-container-high px-4 py-3 text-sm text-primary shadow-xl"
            >
              {notice}
            </div>
          )}
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link href="/dashboard" className="text-sm text-primary hover:underline">
                  ← Dashboard
                </Link>
                <h1 className="mt-3 text-3xl font-bold">Alerts &amp; Notifications</h1>
                <p className="mt-1 text-outline">
                  Review investigation events that need operator attention.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleMarkAllRead}
                  className="rounded-lg border border-outline-variant px-3 py-2 text-xs hover:border-primary/50"
                >
                  Mark all read
                </button>
                <button
                  onClick={handleClearAll}
                  className="rounded-lg border border-outline-variant px-3 py-2 text-xs hover:border-primary/50"
                >
                  Clear all
                </button>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {["ALL", "HIGH", "MEDIUM", "LOW"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    filter === f
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant text-outline hover:text-on-surface"
                  }`}
                >
                  {f}
                  {f === "ALL" && items.some((x) => x.unread)
                    ? ` · ${items.filter((x) => x.unread).length} new`
                    : ""}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="rounded-xl border border-outline-variant bg-surface-container p-12 text-center text-outline">
                <span className="h-6 w-6 inline-block rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
                <p className="mt-2 text-xs">Loading alerts...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visible.length ? (
                  visible.map((a) => (
                    <article
                      key={a.id}
                      className={`rounded-xl border bg-surface-container p-5 transition ${
                        a.unread ? "border-primary/30" : "border-outline-variant"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-outline">{a.id}</span>
                            <span className="rounded-full border border-outline-variant px-2 py-1 text-[10px]">
                              {a.severity}
                            </span>
                            {a.unread && (
                              <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] text-primary">
                                NEW
                              </span>
                            )}
                          </div>
                          <h2 className="mt-2 font-semibold">{a.title}</h2>
                          <p className="mt-1 text-sm text-outline">
                            {a.caseId} · {a.time}
                          </p>
                          {a.description && (
                            <p className="mt-1.5 text-xs text-on-surface-variant max-w-2xl">
                              {a.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/case/${a.caseId || "TR-102"}`}
                            className="rounded-lg bg-primary-container px-3 py-2 text-sm text-on-primary-container"
                          >
                            Review case
                          </Link>
                          {a.unread && (
                            <button
                              onClick={() => handleMarkRead(a.id)}
                              className="rounded-lg border border-outline-variant px-3 py-2 text-sm"
                            >
                              Read
                            </button>
                          )}
                          <button
                            onClick={() => handleDismiss(a.id)}
                            className="rounded-lg border border-outline-variant px-3 py-2 text-sm"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-outline-variant p-16 text-center text-outline">
                    <span className="material-symbols-outlined text-4xl">notifications_off</span>
                    <p className="mt-3">No alerts in this view.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
