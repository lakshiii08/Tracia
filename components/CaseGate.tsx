"use client";

import { ReactNode, useState } from "react";
import { useAppData } from "@/lib/store";

export default function CaseGate({
  children,
  moduleTitle = "Intelligence & Traces Module",
}: {
  children: ReactNode;
  moduleTitle?: string;
}) {
  const { cases, selectedCase, selectCase } = useAppData();
  const [showSelectorModal, setShowSelectorModal] = useState(false);

  if (!selectedCase) {
    return (
      <div className="min-h-screen bg-background text-on-surface p-4 sm:p-8 flex flex-col justify-center items-center">
        <div className="w-full max-w-4xl space-y-6">
          {/* Header Context */}
          <div className="rounded-xl border border-outline-variant bg-surface-container p-6 text-center space-y-2 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[28px]">folder_open</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-on-surface">
              Select a Case to View {moduleTitle}
            </h1>
            <p className="text-xs text-on-surface-variant max-w-xl mx-auto">
              This module operates within the context of an active investigation. Select a case file below to load associated records, intelligence graphs, and custody trails.
            </p>
          </div>

          {/* Case Directory Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                Available Case Files ({cases.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cases.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-outline-variant bg-surface-container p-5 space-y-4 hover:border-primary/50 transition flex flex-col justify-between shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-primary border border-primary/30">
                        {c.id}
                      </span>
                      <span className="rounded-full border border-outline-variant bg-surface-variant px-2.5 py-0.5 text-xs text-on-surface-variant font-medium">
                        ● {c.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">{c.icon}</span>
                      {c.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2">{c.desc}</p>
                  </div>

                  {/* Assignees List */}
                  <div className="pt-3 border-t border-outline-variant/50 space-y-2">
                    <div className="text-[11px] font-mono text-outline uppercase font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">badge</span>
                      Assigned Personnel:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.assignees && c.assignees.length > 0 ? (
                        c.assignees.map((a, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded bg-surface-container-high px-2 py-1 text-xs text-on-surface border border-outline-variant"
                          >
                            <span className="material-symbols-outlined text-[14px] text-primary">person</span>
                            <span className="font-medium">{a.name}</span>
                            <span className="text-[10px] text-outline">({a.role})</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-outline italic">Inspector A. Admin (Lead)</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => selectCase(c.id)}
                    className="w-full mt-2 py-2.5 px-4 rounded-lg bg-primary text-on-primary font-bold text-xs hover:bg-primary-fixed transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">lock_open</span>
                    Select Case File &amp; Access Intelligence
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 min-w-0 h-full overflow-hidden">
      {/* Active Case Context Bar */}
      <div className="shrink-0 bg-surface-container border-b border-outline-variant px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm z-30">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 font-semibold text-on-surface bg-surface-container-high px-2.5 py-1 rounded-lg border border-outline-variant">
            <span className="material-symbols-outlined text-[16px] text-primary">folder_open</span>
            <span>Case {selectedCase.id}: {selectedCase.name}</span>
          </div>

          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="text-outline">Assigned:</span>
            <div className="flex items-center gap-1">
              {selectedCase.assignees && selectedCase.assignees.length > 0 ? (
                selectedCase.assignees.map((a, i) => (
                  <span key={i} className="bg-surface-container-high px-2 py-0.5 rounded text-[11px] font-medium text-on-surface border border-outline-variant/50">
                    {a.name}
                  </span>
                ))
              ) : (
                <span className="bg-surface-container-high px-2 py-0.5 rounded text-[11px] text-outline">Inspector A.</span>
              )}
            </div>
          </div>

          <span className="rounded border border-outline-variant bg-surface-container-high px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">
            {selectedCase.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSelectorModal(true)}
            className="flex items-center gap-1 rounded bg-surface-variant hover:bg-surface-container px-2.5 py-1 text-xs text-primary font-semibold border border-primary/30 transition"
          >
            <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
            Switch Case File
          </button>
        </div>
      </div>

      {/* Quick Switch Modal */}
      {showSelectorModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container w-full max-w-xl rounded-xl border border-outline-variant p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">swap_horiz</span>
                Switch Active Case File
              </h3>
              <button
                onClick={() => setShowSelectorModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {cases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    selectCase(c.id);
                    setShowSelectorModal(false);
                  }}
                  className={`w-full text-left p-3.5 rounded-lg border transition flex items-center justify-between ${
                    selectedCase.id === c.id
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-outline-variant bg-surface-container-low hover:bg-surface-variant text-on-surface"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-primary">{c.id}</span>
                      <span className="text-sm font-semibold">{c.name}</span>
                    </div>
                    <div className="mt-1 text-xs text-on-surface-variant">
                      Assignees: {c.assignees?.map((a) => a.name).join(", ") || "Inspector A."}
                    </div>
                  </div>
                  {selectedCase.id === c.id && (
                    <span className="material-symbols-outlined text-primary">check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 min-w-0 h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
