"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import CaseGate from "@/components/CaseGate";
import { useAppData } from "@/lib/store";

export default function TimelinePage() {
  const { timelineEvents } = useAppData();
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const categories = ["All", "Evidence", "CDR", "Device", "Forensics", "Transfer"];

  const filteredEvents = timelineEvents.filter(
    (evt) => filterCategory === "All" || evt.category === filterCategory
  );

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title="Timeline Intelligence"
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <main className="min-w-0 flex-1">
          <CaseGate moduleTitle="Timeline Intelligence &amp; Chronology">
            <div className="p-5 lg:p-8">
              <div className="mx-auto max-w-7xl space-y-6">
                {/* Header banner */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Timeline Intelligence</h1>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      Chronological event reconstruction connecting evidence collection, call detail logs, device telemetry, and forensic reports.
                    </p>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs text-outline uppercase mr-2 font-medium">Category:</span>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        filterCategory === cat
                          ? "bg-primary text-on-primary"
                          : "border border-outline-variant bg-surface-container hover:border-primary/50 text-on-surface-variant"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Vertical Interactive Timeline View */}
                <div className="relative border-l-2 border-outline-variant/60 ml-4 pl-6 space-y-8 py-2">
                  {filteredEvents.map((evt) => {
                    const categoryColor: Record<string, string> = {
                      Evidence: "border-blue-500 bg-blue-500/10 text-blue-400",
                      CDR: "border-emerald-500 bg-emerald-500/10 text-emerald-400",
                      Device: "border-purple-500 bg-purple-500/10 text-purple-400",
                      Forensics: "border-amber-500 bg-amber-500/10 text-amber-400",
                      Transfer: "border-rose-500 bg-rose-500/10 text-rose-400",
                    };

                    const iconMap: Record<string, string> = {
                      Evidence: "folder",
                      CDR: "call",
                      Device: "devices",
                      Forensics: "analytics",
                      Transfer: "sync_alt",
                    };

                    return (
                      <div key={evt.id} className="relative group">
                        {/* Node marker on line */}
                        <div className="absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-surface text-primary">
                          <span className="material-symbols-outlined text-[13px]">{iconMap[evt.category] || "event"}</span>
                        </div>

                        {/* Event Card */}
                        <div className="rounded-xl border border-outline-variant bg-surface-container p-5 transition group-hover:border-primary/50">
                          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-3">
                              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${categoryColor[evt.category]}`}>
                                {evt.category}
                              </span>
                              <h3 className="text-base font-bold text-on-surface">{evt.title}</h3>
                            </div>
                            <div className="flex items-center gap-3 font-mono text-xs text-outline">
                              <span>{evt.date}</span>
                              <span className="font-bold text-primary">{evt.time}</span>
                            </div>
                          </div>

                          <p className="mt-2 text-sm text-on-surface-variant">{evt.description}</p>

                          <div className="mt-3 flex items-center justify-between border-t border-outline-variant/40 pt-3 text-xs">
                            <div className="flex items-center gap-2 text-outline">
                              <span className="material-symbols-outlined text-[15px]">person</span>
                              <span>Logged by: <b className="text-on-surface">{evt.actor}</b></span>
                            </div>
                            {evt.evidenceRef && (
                              <div className="flex items-center gap-1 font-mono text-primary hover:underline cursor-pointer">
                                <span className="material-symbols-outlined text-[15px]">attach_file</span>
                                <span>Ref: {evt.evidenceRef}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CaseGate>
        </main>
      </div>
    </div>
  );
}
