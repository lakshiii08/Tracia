"use client";

import Link from "next/link";
import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import CaseGate from "@/components/CaseGate";
import { useAppData } from "@/lib/store";

export default function EntityResolutionPage() {
  const { entityQueue, totalEntityMatches, resolveEntity } = useAppData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const reviewed = totalEntityMatches - entityQueue.length;
  const progressPct = totalEntityMatches ? Math.round((reviewed / totalEntityMatches) * 100) : 100;
  const current = entityQueue[0];
  const upcoming = entityQueue.slice(1);

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title="Entity Resolution & Record Matching"
          showSearch
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <main className="flex-1 min-w-0">
          <CaseGate moduleTitle="Entity Resolution &amp; Record Matching">
            <div className="p-6 w-full relative">
              <div className="max-w-4xl mx-auto relative z-10 flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-primary text-[20px]">group_add</span>
                      <h1 className="text-headline-md font-headline-md text-on-surface">Entity Resolution Review</h1>
                    </div>
                    <p className="text-body-sm text-outline">Resolve potential duplicates across recent intelligence feeds.</p>
                  </div>
                  <div className="bg-surface-container p-3 rounded-lg border border-outline-variant min-w-[300px] shadow-md">
                    <div className="flex justify-between text-label-mono font-label-mono text-outline mb-2">
                      <span>REVIEW PROGRESS</span>
                      <span className="text-primary font-bold">{reviewed} / {totalEntityMatches} Reviewed ({progressPct}%)</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                </div>

                {!current ? (
                  <div className="flex-1 rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-16 text-center">
                    <span className="material-symbols-outlined text-4xl text-entity-phone">verified</span>
                    <h2 className="mt-3 font-headline-md text-headline-md text-on-surface">All matches reviewed</h2>
                    <p className="mt-1 text-sm text-on-surface-variant">Every duplicate entity in this queue has been confirmed or rejected.</p>
                    <Link href="/graph" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-on-primary hover:bg-primary-fixed">
                      <span className="material-symbols-outlined text-[18px]">hub</span> View updated graph
                    </Link>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col gap-6 pb-10">
                    <div className="bg-surface-container-low rounded-xl p-4 md:p-6 relative transition-all duration-300 border border-outline-variant">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-entity-person rounded-l-xl opacity-80" />
                      <div className="flex justify-between items-center mb-6 pb-4 border-b border-outline-variant border-dashed">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/20 p-2 rounded-lg border border-primary/30">
                            <span className="material-symbols-outlined text-primary">person</span>
                          </div>
                          <div>
                            <h3 className="text-body-md font-semibold flex items-center gap-2">Potential Match Found</h3>
                            <span className="text-label-mono font-label-mono text-outline">ALG_SCORE: {current.similarity >= 90 ? "HIGH_PROBABILITY" : current.similarity >= 75 ? "MEDIUM_PROBABILITY" : "LOW_PROBABILITY"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-outline font-label-mono">SIMILARITY MATCH</span>
                            <span className="text-headline-md text-entity-person font-bold">{current.similarity}%</span>
                          </div>
                          <div className="w-12 h-12 rounded-full border-2 border-entity-person flex items-center justify-center bg-entity-person/10">
                            <span className="material-symbols-outlined text-entity-person">fingerprint</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-start">
                        <div className="bg-surface p-4 rounded-lg border border-outline-variant relative">
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-label-mono bg-surface-variant text-outline border border-outline-variant">SOURCE: {current.sourceA}</div>
                          <div className="flex items-center gap-4 mb-4 mt-2">
                            <div className="w-16 h-16 rounded border border-outline-variant bg-surface-container flex items-center justify-center">
                              <span className="material-symbols-outlined text-[32px] text-outline">person</span>
                            </div>
                            <div className="text-body-sm font-semibold">{current.nameA}</div>
                          </div>
                          <div className="space-y-3">
                            {current.fieldsA.map((f) => (
                              <div key={f.label}>
                                <div className="text-[10px] text-outline uppercase font-label-mono">{f.label}</div>
                                <div className="text-body-sm bg-primary/10 border border-primary/30 px-2 py-1 rounded text-primary">{f.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="hidden md:flex flex-col items-center justify-center h-full text-outline opacity-50 px-2">
                          <div className="w-px h-16 bg-outline-variant" />
                          <span className="material-symbols-outlined my-2">link</span>
                          <div className="w-px h-16 bg-outline-variant" />
                        </div>

                        <div className="bg-surface p-4 rounded-lg border border-outline-variant relative">
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-label-mono bg-surface-variant text-outline border border-outline-variant">SOURCE: {current.sourceB}</div>
                          <div className="flex items-center gap-4 mb-4 mt-2">
                            <div className="w-16 h-16 rounded border border-outline-variant bg-surface-container flex items-center justify-center">
                              <span className="material-symbols-outlined text-[32px] text-outline">person</span>
                            </div>
                            <div className="text-body-sm font-semibold">{current.nameB}</div>
                          </div>
                          <div className="space-y-3">
                            {current.fieldsB.map((f) => (
                              <div key={f.label}>
                                <div className="text-[10px] text-outline uppercase font-label-mono">{f.label}</div>
                                <div className={`text-body-sm px-2 py-1 rounded flex justify-between items-center ${f.matched ? "bg-primary/10 border border-primary/30 text-primary" : "bg-surface-variant border border-outline-variant text-outline italic"}`}>
                                  {f.value}
                                  {f.matched && <span className="material-symbols-outlined text-[14px] text-primary">check_circle</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-outline-variant border-dashed flex justify-end gap-3">
                        <button
                          onClick={() => resolveEntity(current.id, "reject")}
                          className="px-6 py-2 rounded border border-outline-variant text-body-sm hover:bg-surface-variant transition-colors flex items-center gap-2 text-on-surface"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span> Reject Match
                        </button>
                        <button
                          onClick={() => resolveEntity(current.id, "confirm")}
                          className="px-6 py-2 rounded bg-primary-container text-on-primary-container font-semibold text-body-sm hover:brightness-110 transition-all flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">merge</span> Confirm Merge
                        </button>
                      </div>
                    </div>

                    {upcoming.map((m) => (
                      <div key={m.id} className="bg-surface-container-lowest rounded-xl p-4 md:p-6 opacity-60 hover:opacity-100 transition-opacity duration-300 relative border border-outline-variant">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-entity-person rounded-l-xl opacity-40" />
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-outline">person</span>
                            <span className="font-code-sm text-code-sm text-outline">{m.nameA} {"\u2194"} {m.nameB}</span>
                          </div>
                          <div className="text-[10px] text-outline font-label-mono">SIMILARITY: {m.similarity}%</div>
                        </div>
                        <div className="h-12 bg-surface-variant rounded border border-outline-variant flex items-center justify-center text-outline text-body-sm">Up next in the queue</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CaseGate>
        </main>
      </div>
    </div>
  );
}
