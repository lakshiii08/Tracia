"use client";

import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import CaseGate from "@/components/CaseGate";
import { useAppData } from "@/lib/store";
import { getCyberChain } from "@/services/api/cyberIntel";
import type { CyberChain } from "@/types/cyberIntel";

export default function CyberIntelPage() {
  const { cyberEvents, selectedCase } = useAppData();
  const [cyberChain, setCyberChain] = useState<CyberChain | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    getCyberChain(selectedCase?.id).then(setCyberChain);
  }, [selectedCase?.id]);

  const toneClassMap: Record<string, { border: string; bg: string; text: string }> = {
    blue: { border: "border-blue-500/40", bg: "bg-blue-500/10", text: "text-blue-400" },
    emerald: { border: "border-emerald-500/40", bg: "bg-emerald-500/10", text: "text-emerald-400" },
    amber: { border: "border-amber-500/40", bg: "bg-amber-500/10", text: "text-amber-400" },
    rose: { border: "border-rose-500/40", bg: "bg-rose-500/10", text: "text-rose-400" },
    purple: { border: "border-purple-500/40", bg: "bg-purple-500/10", text: "text-purple-400" },
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title="Cybercrime Intelligence Module"
          showSearch
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <main className="min-w-0 flex-1">
          <CaseGate moduleTitle="Cybercrime Intelligence & Digital Indicators">
            <div className="p-5 lg:p-8">
              <div className="mx-auto max-w-7xl space-y-6">
                {/* Header banner */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Cyber Intelligence</h1>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      Correlate authorized digital indicators (IP addresses, device identifiers, and network telemetry) with case entities.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-1.5 text-xs font-semibold text-on-surface">
                      {cyberEvents.length} Active Cyber Indicators
                    </span>
                  </div>
                </div>

                {/* Relationship Flow Schema */}
                {cyberChain && cyberChain.nodes.length > 0 && (
                  <section className="rounded-xl border border-outline-variant bg-surface-container p-5">
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-outline">
                      Cyber Entity Correlation Chain
                    </h2>
                    <div className="flex flex-wrap items-center justify-center gap-3 py-3 font-mono text-xs text-center">
                      {cyberChain.nodes.map((node, idx) => {
                        const style = toneClassMap[node.tone] || toneClassMap.blue;
                        const step = cyberChain.steps.find((s) => s.fromNodeId === node.id);

                        return (
                          <div key={node.id} className="flex items-center gap-3">
                            <div className={`rounded-lg border ${style.border} ${style.bg} px-3 py-2`}>
                              <div className={`font-bold ${style.text}`}>{node.title}</div>
                              <div className="text-[10px] text-outline">{node.value}</div>
                            </div>
                            {step && <span className="text-outline font-bold">{step.label}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Cyber Events Table */}
                <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
                  <div className="border-b border-outline-variant bg-surface-container-high p-4 flex justify-between items-center">
                    <h3 className="font-semibold text-sm">Logged Cyber Indicators &amp; Threat Events</h3>
                    <span className="text-xs text-outline">Real-time threat feed</span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container-high/50 border-b border-outline-variant font-label-mono text-[11px] uppercase text-on-surface-variant">
                      <tr>
                        <th className="p-3.5">Event ID</th>
                        <th className="p-3.5">Suspect</th>
                        <th className="p-3.5">IP Address</th>
                        <th className="p-3.5">MAC &amp; Device ID</th>
                        <th className="p-3.5">Event Type &amp; Domain</th>
                        <th className="p-3.5">Anonymizer</th>
                        <th className="p-3.5">Threat Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/50">
                      {cyberEvents.map((evt) => (
                        <tr key={evt.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="p-3.5 font-mono text-outline">{evt.id}</td>
                          <td className="p-3.5 font-bold text-on-surface">{evt.suspect}</td>
                          <td className="p-3.5 font-mono text-amber-400 font-bold">{evt.ipAddress}</td>
                          <td className="p-3.5 font-mono">
                            <div className="text-on-surface">{evt.deviceId}</div>
                            <div className="text-[10px] text-outline">{evt.macAddress}</div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-on-surface">{evt.eventType}</div>
                            <div className="text-[11px] text-primary">{evt.domain}</div>
                          </td>
                          <td className="p-3.5">
                            {evt.isVpnOrTor ? (
                              <span className="rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                                VPN / TOR DETECTED
                              </span>
                            ) : (
                              <span className="text-outline text-[11px]">Direct Connection</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-rose-400 font-mono text-sm">{evt.riskScore}/100</span>
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
