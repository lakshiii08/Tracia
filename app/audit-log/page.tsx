"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppData } from "@/lib/store";
import { useAuthorization } from "@/auth/useAuthorization";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import CaseGate from "@/components/CaseGate";

export default function AuditLogPage() {
  const { auditTrail } = useAppData();
  const { currentUser, hasPermission } = useAuthorization();
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const entries = useMemo(
    () =>
      auditTrail.filter((e) =>
        `${e.time} ${e.message} ${e.actor}`.toLowerCase().includes(query.toLowerCase())
      ),
    [auditTrail, query]
  );

  const canViewAudit = hasPermission("audit.view");

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title="Security & Investigation Audit Trail"
          showSearch
          searchValue={query}
          onSearchChange={setQuery}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <main className="min-w-0 flex-1">
          {!canViewAudit ? (
            <div className="p-8 flex items-center justify-center min-h-[500px]">
              <div className="max-w-md w-full text-center p-8 rounded-xl border border-rose-500/30 bg-surface-container space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">lock</span>
                </div>
                <h1 className="text-xl font-bold text-on-surface">Access Restricted: 403 Forbidden</h1>
                <p className="text-sm text-outline">
                  The Compliance Audit Log is restricted to <span className="text-primary font-bold">Admin</span> and{" "}
                  <span className="text-primary font-bold">Auditor</span> clearance roles.
                </p>
                <div className="rounded-lg bg-surface-container-low p-3 text-xs font-mono text-on-surface-variant">
                  Current Role: <span className="font-bold text-amber-400">{currentUser.role}</span>
                </div>
                <div>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-on-primary hover:bg-primary-fixed"
                  >
                    Return to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <CaseGate moduleTitle="Security &amp; Investigation Audit Trail">
              <div className="p-5 lg:p-8">
                <div className="mx-auto max-w-6xl">
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <div className="font-label-mono text-xs text-primary">SECURITY / AUDIT</div>
                      <h1 className="mt-1 text-3xl font-bold">Audit Log</h1>
                      <p className="mt-2 text-on-surface-variant">
                        Chronological record of investigation actions recorded for the active case session.
                      </p>
                    </div>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search audit events..."
                      className="rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
                    <div className="grid grid-cols-[150px_1fr_140px] gap-4 border-b border-outline-variant p-4 text-[10px] font-label-mono text-outline">
                      <span>TIME</span>
                      <span>EVENT</span>
                      <span>ACTOR</span>
                    </div>
                    {entries.length ? (
                      entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="grid grid-cols-[150px_1fr_140px] gap-4 border-b border-outline-variant/40 p-4 text-sm hover:bg-surface-container-low"
                        >
                          <span className="font-code-sm text-primary">{entry.time}</span>
                          <span>{entry.message}</span>
                          <span className="font-code-sm text-outline">{entry.actor}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center text-sm text-outline">
                        No audit events match this search.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CaseGate>
          )}
        </main>
      </div>
    </div>
  );
}
