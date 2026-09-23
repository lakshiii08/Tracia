"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAppData } from "@/lib/store";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { useAuthorization } from "@/auth/useAuthorization";
import AccessBadge from "@/components/authorization/AccessBadge";
import CaseTable from "@/components/cases/CaseTable";
import RelatedCases from "@/components/cases/RelatedCases";
import AccessRequestsTable from "@/components/admin/AccessRequestsTable";
import CaseAccessCard from "@/components/cases/CaseAccessCard";
import type { ExtendedCaseItem } from "@/types/cases";

const toneClass: Record<string, string> = {
  person: "bg-entity-person",
  account: "bg-entity-account",
  outline: "bg-outline",
  organization: "bg-entity-organization",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cases: storeCases, selectedCase, selectCase } = useAppData();
  const {
    currentUser,
    hasPermission,
    assignedCases,
    relatedCases,
    accessRequests,
    evaluateCaseAccess,
    cases: mockCases,
  } = useAuthorization();

  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [inspectCase, setInspectCase] = useState<ExtendedCaseItem | null>(null);
  const [activeTab, setActiveTab] = useState<"directory" | "management" | "assigned" | "related" | "requests">("directory");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Merge storeCases and mockCases for complete data consistency
  const allCasesList = useMemo(() => {
    const existingIds = new Set(mockCases.map((c) => c.id.toUpperCase()));
    const extraCases: ExtendedCaseItem[] = storeCases
      .filter((c) => !existingIds.has(c.id.toUpperCase()))
      .map((c) => ({
        id: c.id,
        name: c.name,
        desc: c.desc,
        entities: c.entities || 0,
        date: c.date || new Date().toISOString().split("T")[0],
        status: c.status || "Active",
        tone: c.tone || "account",
        icon: c.icon || "folder",
        category: c.category || "Cyber Crime",
        classification: "Confidential",
        priority: "High",
        assignedOfficerIds: [currentUser.id, "ADMIN-01"],
        href: `/case/${c.id}`,
        assignees: c.assignees || [{ name: currentUser.name, role: currentUser.role }],
      }));
    return [...extraCases, ...mockCases];
  }, [mockCases, storeCases, currentUser]);

  const filteredCases = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCasesList;
    return allCasesList.filter((c) =>
      `${c.id} ${c.name} ${c.desc} ${c.status} ${c.assignees?.map((a) => a.name).join(" ")}`.toLowerCase().includes(q)
    );
  }, [allCasesList, query]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2600);
  };

  useEffect(() => {
    const created = searchParams.get("created");
    if (created) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      showNotice(`${created} created and added to Active Cases.`);
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  const handleSelectAndOpen = (c: ExtendedCaseItem) => {
    selectCase(c.id);
    const access = evaluateCaseAccess(c);
    if (access.canView) {
      router.push(c.href || `/case/${c.id}`);
    } else {
      setInspectCase(c);
    }
  };

  const pendingRequestsCount = accessRequests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      {notice && (
        <div
          role="status"
          className="fixed right-5 top-20 z-50 rounded-lg border border-primary/30 bg-surface-container-high px-4 py-3 text-sm text-on-surface shadow-xl"
        >
          {notice}
        </div>
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title="Case Management Directory"
          showSearch
          searchValue={query}
          onSearchChange={setQuery}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <main className="flex-1 flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-outline-variant pb-4">
            <div>
              <h1 className="text-2xl font-bold text-on-surface">Case Directory</h1>
              <p className="mt-1 text-xs text-on-surface-variant">
                Role-based case management and intelligence repository. Select an investigation to open its workspace.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {hasPermission("cases.assign") && (
                <Link
                  href="/case/new"
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary-container transition shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>New Case
                </Link>
              )}
            </div>
          </section>

          {/* Navigation View Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant pb-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("directory")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition ${
                activeTab === "directory" ? "bg-primary text-on-primary font-bold" : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span> Case Cards Directory ({filteredCases.length})
            </button>

            <button
              onClick={() => setActiveTab("management")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition ${
                activeTab === "management" ? "bg-primary text-on-primary font-bold" : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">table_chart</span> RBAC Case Table
            </button>

            <button
              onClick={() => setActiveTab("assigned")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition ${
                activeTab === "assigned" ? "bg-primary text-on-primary font-bold" : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">assignment_ind</span> My Assigned Cases ({assignedCases.length})
            </button>

            <button
              onClick={() => setActiveTab("related")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition ${
                activeTab === "related" ? "bg-primary text-on-primary font-bold" : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">hub</span> Related Cases ({relatedCases.length})
            </button>

            {hasPermission("cases.approveAccess") && (
              <button
                onClick={() => setActiveTab("requests")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition ${
                  activeTab === "requests" ? "bg-primary text-on-primary font-bold" : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">key</span> Access Requests ({pendingRequestsCount})
              </button>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              ["folder_open", "Accessible Cases Scope", `${currentUser.role === "ADMIN" ? allCasesList.length : assignedCases.length + relatedCases.length}`, "primary"],
              ["badge", "Assigned Cases (L4)", `${assignedCases.length}`, "primary"],
              ["hub", "Discovered Related Cases", `${relatedCases.length}`, "vehicle"],
              ["key", "Pending Access Requests", `${pendingRequestsCount}`, "risk"],
            ].map(([icon, label, value, tone]) => (
              <div
                key={label}
                className="flex items-center gap-4 rounded-xl border border-surface-variant/50 bg-surface-container p-4 hover:border-primary/30 transition shadow-sm"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    tone === "risk"
                      ? "bg-entity-risk/10 text-entity-risk"
                      : tone === "vehicle"
                      ? "bg-entity-vehicle/10 text-entity-vehicle"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </div>
                <div>
                  <p className="text-[11px] text-on-surface-variant font-medium">{label}</p>
                  <p className="font-headline-md text-xl text-on-surface font-bold">{value}</p>
                </div>
              </div>
            ))}
          </section>

          {/* TAB: Inspection Drawer Overlay */}
          {inspectCase && (
            <CaseAccessCard caseItem={inspectCase} onClose={() => setInspectCase(null)} />
          )}

          {/* TAB 1: Case Cards Directory */}
          {activeTab === "directory" && (
            <div>
              {filteredCases.length ? (
                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {filteredCases.map((c) => {
                    const isSelected = selectedCase?.id === c.id;
                    const access = evaluateCaseAccess(c);

                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelectAndOpen(c)}
                        className={`relative flex h-full flex-col gap-3 overflow-hidden rounded-xl border p-5 transition-all cursor-pointer hover:-translate-y-1 ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-lg ring-1 ring-primary"
                            : "border-surface-variant/50 bg-surface-container hover:border-primary/50"
                        }`}
                      >
                        <div className={`absolute left-0 top-0 h-full w-1 ${toneClass[c.tone]}`} />
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-primary/10 px-2 py-0.5 font-label-mono text-label-mono text-primary font-bold border border-primary/20">
                              {c.id}
                            </span>
                            {isSelected && (
                              <span className="rounded bg-primary text-on-primary px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <AccessBadge level={access.level} size="sm" />
                        </div>

                        <div>
                          <h4 className="font-headline-md text-headline-md text-on-surface font-bold">{c.name}</h4>
                          <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">{c.desc}</p>
                        </div>

                        {/* Assignees List Section */}
                        <div className="pt-2 border-t border-surface-variant/50 space-y-1.5">
                          <div className="text-[10px] font-mono text-outline uppercase font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-primary">badge</span>
                            Assignees:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {c.assignees && c.assignees.length > 0 ? (
                              c.assignees.map((a, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 rounded bg-surface-container-high px-2 py-0.5 text-[11px] text-on-surface border border-outline-variant/60"
                                >
                                  <span className="font-medium">{a.name}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-outline italic">Inspector A. Admin</span>
                            )}
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between border-t border-surface-variant/50 pt-3 text-xs text-on-surface-variant">
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className="material-symbols-outlined text-[16px] text-primary">{c.icon}</span>
                            {c.entities} Entities Mapped
                          </span>
                          <span className="font-code-sm text-code-sm text-outline">{c.date}</span>
                        </div>
                      </div>
                    );
                  })}
                </section>
              ) : (
                <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-outline">search_off</span>
                  <h4 className="mt-3 font-headline-md text-on-surface">No cases found</h4>
                  <p className="mt-1 text-sm text-on-surface-variant">Try a different search query.</p>
                  <button
                    onClick={() => setQuery("")}
                    className="mt-4 rounded-lg border border-primary/30 px-4 py-2 text-sm text-primary"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RBAC Case Table */}
          {activeTab === "management" && (
            <CaseTable cases={filteredCases} onSelectCase={(c) => setInspectCase(c)} />
          )}

          {/* TAB 3: My Assigned Cases */}
          {activeTab === "assigned" && (
            <CaseTable cases={assignedCases} onSelectCase={(c) => setInspectCase(c)} />
          )}

          {/* TAB 4: Graph Discovered Related Cases */}
          {activeTab === "related" && (
            <RelatedCases relatedItems={relatedCases} />
          )}

          {/* TAB 5: Access Requests Management (Admin) */}
          {activeTab === "requests" && (
            <AccessRequestsTable />
          )}

          <footer className="flex flex-col gap-2 border-t border-surface-variant/30 pt-6 text-xs text-outline sm:flex-row sm:items-center sm:justify-between">
            <span>TRACIA Intelligence Platform</span>
            <span>Audited &amp; Encrypted Session</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
