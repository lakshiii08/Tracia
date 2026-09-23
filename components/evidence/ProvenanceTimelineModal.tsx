"use client";

import React from "react";
import type { ProvenanceData } from "@/types/evidenceIntegrity";
import {
  Layers,
  X,
  Clock,
  CheckCircle2,
  FileCheck,
  Shield,
  ArrowRight,
  Fingerprint,
  UserCheck,
} from "lucide-react";

interface ProvenanceTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ProvenanceData | null;
}

export const ProvenanceTimelineModal: React.FC<ProvenanceTimelineModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-surface-container via-surface-container to-surface-container-low border border-outline-variant/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/60 bg-surface-container-high/40 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/15 text-indigo-400 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-on-surface">
                Immutable Provenance Trail
              </h2>
              <p className="text-xs text-on-surface-variant font-mono">
                Case: <span className="text-on-surface font-semibold">{data.case_id}</span> | Evidence:{" "}
                <span className="text-primary font-bold">{data.evidence_id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-outline hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container-high transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Status summary banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-surface-container-low/90 rounded-2xl border border-outline-variant text-xs shadow-inner">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-outline">Current Version:</span>
              <span className="font-mono font-bold text-on-surface text-sm">v{data.current_version}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-outline">Ledger Status:</span>
              <span className="font-mono text-emerald-400 font-bold uppercase bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {data.status}
              </span>
            </div>
            <div className="w-full truncate font-mono text-[11px] text-cyan-300 bg-surface-container p-2.5 rounded-xl border border-outline-variant">
              SHA-256: {data.sha256_hash}
            </div>
          </div>

          {/* Chronological Timeline */}
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-cyan-400 before:to-indigo-500">
            {data.timeline.map((event) => (
              <div key={event.step_number} className="relative flex items-start space-x-4 pl-1 group">
                {/* Step circle */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-highest border-2 border-primary text-primary font-bold text-xs shrink-0 z-10 shadow-[0_0_12px_rgba(74,142,255,0.3)] group-hover:scale-110 transition duration-150 font-mono">
                  {event.step_number}
                </div>

                {/* Event Card */}
                <div className="flex-1 bg-surface-container-low/90 p-5 rounded-2xl border border-outline-variant space-y-2.5 shadow-md hover:border-primary/40 transition duration-150">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 uppercase tracking-wider font-mono">
                      {event.stage.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] text-outline flex items-center space-x-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(event.timestamp).toLocaleString()}</span>
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-on-surface font-semibold">
                    {event.description}
                  </p>
                  
                  <div className="flex items-center space-x-1.5 text-xs text-outline">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Authorized Custodian:</span>
                    <span className="text-on-surface font-medium font-mono">{event.actor}</span>
                  </div>

                  {/* Additional details */}
                  {event.details && (
                    <div className="bg-surface-container p-3 rounded-xl border border-outline-variant/60 text-xs font-mono space-y-1 mt-2">
                      {Object.entries(event.details).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-start text-[11px]">
                          <span className="text-outline uppercase font-semibold">{key}:</span>
                          <span className="text-cyan-300 break-all text-right ml-4">
                            {typeof val === "boolean" ? (val ? "true" : "false") : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Verification Audit History */}
          {data.verification_history.length > 0 && (
            <div className="pt-4 border-t border-outline-variant/60 space-y-3">
              <h3 className="text-xs font-bold uppercase text-outline flex items-center space-x-2 tracking-wider font-mono">
                <FileCheck className="w-4 h-4 text-cyan-400" />
                <span>Verification Audit History ({data.verification_history.length})</span>
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-outline-variant shadow-md">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-high/60 text-outline uppercase text-[10px] font-mono font-semibold">
                    <tr>
                      <th className="p-3.5">Audit Time</th>
                      <th className="p-3.5">Auditor</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Calculated Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40 font-mono text-[11px]">
                    {data.verification_history.map((h) => (
                      <tr key={h.id} className="hover:bg-surface-container-high/30 transition">
                        <td className="p-3.5 text-on-surface-variant">
                          {new Date(h.verified_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="p-3.5 text-on-surface font-medium">{h.verified_by}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              h.is_match
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {h.integrity_status}
                          </span>
                        </td>
                        <td className="p-3.5 text-cyan-300 truncate max-w-xs" title={h.calculated_hash}>
                          {h.calculated_hash}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-outline-variant/60 bg-surface-container-high/20 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-surface-container-high hover:bg-outline-variant text-on-surface rounded-xl text-xs font-bold transition shadow-sm"
          >
            Close Provenance
          </button>
        </div>
      </div>
    </div>
  );
};
