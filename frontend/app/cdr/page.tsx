"use client";

import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import CaseGate from "@/components/CaseGate";
import { useAppData } from "@/lib/store";
import { getCdrRelayChain, getCdrMetrics } from "@/services/api/cdr";
import type { CdrRelayChain, CdrMetrics } from "@/types/cdr";

export default function CdrAnalysisPage() {
  const { cdrRecords, selectedCase } = useAppData();
  const [search, setSearch] = useState("");
  const [filterOverlap, setFilterOverlap] = useState(false);
  const [relayChain, setRelayChain] = useState<CdrRelayChain | null>(null);
  const [metrics, setMetrics] = useState<CdrMetrics | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    getCdrRelayChain(selectedCase?.id).then(setRelayChain);
    getCdrMetrics(selectedCase?.id).then(setMetrics);
  }, [selectedCase?.id]);

  const filteredCdr = cdrRecords.filter((rec) => {
    const matchesSearch =
      rec.caller.includes(search) ||
      rec.receiver.includes(search) ||
      rec.callerName.toLowerCase().includes(search.toLowerCase()) ||
      rec.receiverName.toLowerCase().includes(search.toLowerCase()) ||
      rec.towerLocation.toLowerCase().includes(search.toLowerCase());
    const matchesOverlap = filterOverlap ? rec.crossCaseOverlap : true;
    return matchesSearch && matchesOverlap;
  });

  const toneClassMap: Record<string, string> = {
    primary: "border-primary/40 bg-primary/10 text-primary",
    amber: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    rose: "border-rose-500/40 bg-rose-500/10 text-rose-400",
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title="CDR Analysis Module"
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <main className="min-w-0 flex-1">
          <CaseGate moduleTitle="CDR Communication Analysis">
            <div className="p-5 lg:p-8">
              <div className="mx-auto max-w-7xl space-y-6">
                {/* Header banner */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">CDR Analysis Engine</h1>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      Analyze Call Detail Records to map communication frequencies, relay chains, and cross-case target overlaps.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface">
                      {cdrRecords.length} Intercepted Calls Loaded
                    </span>
                  </div>
                </div>

                {/* Network Chain Diagram */}
                {relayChain && relayChain.nodes.length > 0 && (
                  <section className="rounded-xl border border-outline-variant bg-surface-container p-5">
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-outline">
                      Call Relay Chain &amp; Cluster Analysis
                    </h2>
                    <div className="flex flex-wrap items-center justify-center gap-4 py-4 font-mono text-xs">
                      {relayChain.nodes.map((node, idx) => {
                        const step = relayChain.steps.find((s) => s.fromNodeId === node.id);
                        const boxClass = toneClassMap[node.tone] || toneClassMap.primary;

                        return (
                          <div key={node.id} className="flex items-center gap-4">
                            <div className={`rounded-lg border p-3 text-center ${boxClass}`}>
                              <div className="font-bold">{node.name}</div>
                              <div className="text-[10px] text-outline">{node.phone}</div>
                            </div>
                            {step && (
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-amber-400">
                                  CALLED ({step.durationSec}s)
                                </span>
                                <span className="material-symbols-outlined text-primary">arrow_forward</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Analysis Metrics Grid */}
                {metrics && (
                  <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
                      <div className="text-xs text-outline">Frequent Contacts</div>
                      <div className="mt-1 text-2xl font-bold">{metrics.frequentContactsCount} Linked Nodes</div>
                      <div className="mt-1 text-[11px] text-primary">{metrics.frequentContactsHighlight}</div>
                    </div>
                    <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
                      <div className="text-xs text-outline">Shared Contacts</div>
                      <div className="mt-1 text-2xl font-bold">{metrics.sharedContactsCount} Common Targets</div>
                      <div className="mt-1 text-[11px] text-emerald-400">{metrics.sharedContactsHighlight}</div>
                    </div>
                    <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
                      <div className="text-xs text-outline">Communication Clusters</div>
                      <div className="mt-1 text-2xl font-bold">{metrics.communicationClustersCount} Clusters</div>
                      <div className="mt-1 text-[11px] text-amber-400">{metrics.communicationClustersHighlight}</div>
                    </div>
                    <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
                      <div className="text-xs text-outline">Cross-Case Overlaps</div>
                      <div className="mt-1 text-2xl font-bold text-rose-400">
                        {metrics.crossCaseOverlapsCount} Overlapping Calls
                      </div>
                      <div className="mt-1 text-[11px] text-rose-300 font-mono">
                        {metrics.crossCaseOverlapsHighlight}
                      </div>
                    </div>
                  </section>
                )}

                {/* Search & Filter Controls */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full max-w-md">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter by phone number, suspect name, tower location..."
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2 pl-10 pr-4 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={filterOverlap}
                      onChange={(e) => setFilterOverlap(e.target.checked)}
                      className="rounded accent-primary"
                    />
                    <span>Show only cross-case overlaps</span>
                  </label>
                </div>

                {/* CDR Call Records Table */}
                <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container-high border-b border-outline-variant font-label-mono text-[11px] uppercase text-on-surface-variant">
                      <tr>
                        <th className="p-3.5">Record ID</th>
                        <th className="p-3.5">Caller Phone &amp; Identity</th>
                        <th className="p-3.5">Receiver Phone &amp; Identity</th>
                        <th className="p-3.5">Duration</th>
                        <th className="p-3.5">Timestamp</th>
                        <th className="p-3.5">Cell Tower Location</th>
                        <th className="p-3.5">Overlap</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/50">
                      {filteredCdr.map((rec) => (
                        <tr key={rec.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="p-3.5 font-mono text-outline">{rec.id}</td>
                          <td className="p-3.5">
                            <div className="font-bold text-on-surface">{rec.caller}</div>
                            <div className="text-[11px] text-on-surface-variant">{rec.callerName}</div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-on-surface">{rec.receiver}</div>
                            <div className="text-[11px] text-on-surface-variant">{rec.receiverName}</div>
                          </td>
                          <td className="p-3.5 font-mono text-emerald-400">{rec.durationSec}s</td>
                          <td className="p-3.5 font-mono text-outline">{rec.timestamp}</td>
                          <td className="p-3.5 text-on-surface-variant">{rec.towerLocation}</td>
                          <td className="p-3.5">
                            {rec.crossCaseOverlap ? (
                              <span className="rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                                Overlap Detected
                              </span>
                            ) : (
                              <span className="text-[11px] text-outline">Normal</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CaseGate>
        </main>
      </div>
    </div>
  );
}
