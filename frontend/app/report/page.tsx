"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { useAppData } from "@/lib/store";

export default function ReportPage() {
  const { graphNodes, graphEdges, evidenceFiles, auditTrail, resolvedEntities, cases } = useAppData();
  const [generated, setGenerated] = useState(false);
  const [status, setStatus] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const current = cases.find((c) => c.id === "CASE_101") ?? cases[0];
  const risky = graphNodes.filter((n) => n.risk === "high" || (n.details.riskScore ?? 0) >= 70);
  const topLinks = graphEdges.slice(0, 8);

  const generate = () => {
    setStatus("Generating report from live case state…");
    setTimeout(() => {
      setGenerated(true);
      setStatus("Report generated from current intelligence state.");
    }, 500);
  };

  const share = async () => {
    const text = `TRACIA Report · ${current?.name ?? "Investigation"} · ${graphNodes.length} entities · ${graphEdges.length} relationships`;
    try {
      if (navigator.share) await navigator.share({ title: "TRACIA Investigation Report", text });
      else await navigator.clipboard.writeText(text);
      setStatus("Report reference shared/copied.");
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex print:bg-white print:text-black">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title="Investigation Forensic Report"
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <main className="max-w-6xl w-full mx-auto p-5 lg:p-8 space-y-6 flex-1">
          <section className="rounded-xl border border-outline-variant bg-surface-container p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <div className="font-label-mono text-xs text-primary">CASE_ID: {current?.id ?? "N/A"}</div>
                <h1 className="text-3xl font-bold mt-2">{current?.name ?? "Investigation Report"}</h1>
                <p className="text-on-surface-variant mt-1">Generated from the current TRACIA intelligence state.</p>
              </div>
              <div className="flex gap-2 print:hidden items-center">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-semibold hover:bg-surface-container-high transition"
                >
                  Export / Print
                </button>
                <button
                  onClick={share}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-semibold hover:bg-surface-container-high transition"
                >
                  Share
                </button>
                <button
                  onClick={generate}
                  disabled={generated}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold disabled:opacity-60 hover:bg-primary-container transition"
                >
                  {generated ? "✓ Report Ready" : "Generate Report"}
                </button>
              </div>
            </div>
            {status && (
              <div className="mt-4 pt-3 border-t border-outline-variant/40 text-xs text-primary font-mono">
                {status}
              </div>
            )}
          </section>

          <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ["Entities", graphNodes.length],
              ["Relationships", graphEdges.length],
              ["Evidence", evidenceFiles.length],
              ["Confirmed merges", resolvedEntities.length],
            ].map(([l, v]) => (
              <div key={String(l)} className="rounded-xl border border-outline-variant bg-surface-container p-5">
                <div className="text-xs text-outline">{l}</div>
                <div className="text-3xl font-bold mt-1 text-primary">{v}</div>
              </div>
            ))}
          </section>

          <section className="grid lg:grid-cols-3 gap-6">
            <article className="lg:col-span-2 rounded-xl border border-outline-variant bg-surface-container p-6">
              <h2 className="text-lg font-bold">Live Findings</h2>
              <div className="space-y-4 mt-4">
                {risky.map((n) => (
                  <div key={n.id} className="border-l-2 border-entity-risk pl-4">
                    <div className="font-semibold text-sm">
                      {n.label} <span className="font-code-sm text-xs text-outline">({n.details.idLabel})</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      High-risk entity currently indexed with {n.details.connections ?? 0} known connections and {n.details.evidenceCount ?? 0} evidence references.
                    </p>
                  </div>
                ))}
                {!risky.length && <p className="text-xs text-outline">No high-risk entities are currently indexed.</p>}
              </div>
            </article>

            <article className="rounded-xl border border-outline-variant bg-surface-container p-6">
              <h2 className="text-lg font-bold">Risk Assessment</h2>
              <div className="text-4xl font-bold text-entity-risk mt-4">
                {risky.length ? "HIGH" : "NORMAL"}
              </div>
              <p className="text-xs text-outline mt-1 font-mono">Current network risk indicator</p>
              <div className="mt-6 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-outline">Audit events</span>
                  <b className="font-mono">{auditTrail.length}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Evidence files</span>
                  <b className="font-mono">{evidenceFiles.length}</b>
                </div>
              </div>
            </article>
          </section>

          <section className="rounded-xl border border-outline-variant bg-surface-container overflow-hidden">
            <div className="p-5 border-b border-outline-variant">
              <h2 className="text-lg font-bold">Relationship Register</h2>
            </div>
            {topLinks.map((e) => {
              const a = graphNodes.find((n) => n.id === e.from)?.label ?? e.from;
              const b = graphNodes.find((n) => n.id === e.to)?.label ?? e.to;
              return (
                <div
                  key={e.id}
                  className="grid md:grid-cols-[1fr_160px_1fr] gap-3 p-4 border-b border-outline-variant/40 text-xs"
                >
                  <span className="font-medium">{a}</span>
                  <span className="text-primary font-code-sm">{e.label}</span>
                  <span className="font-medium">{b}</span>
                </div>
              );
            })}
          </section>

          <section className="rounded-xl border border-outline-variant bg-surface-container p-6">
            <h2 className="text-lg font-bold">Evidence Register</h2>
            <div className="grid md:grid-cols-2 gap-3 mt-4">
              {evidenceFiles.map((f) => (
                <div key={f.id} className="p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                  <div className="font-semibold text-xs text-on-surface">{f.filename}</div>
                  <div className="text-[11px] text-outline mt-1 font-mono">
                    {f.type} · {f.status} · {f.progress}%
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
