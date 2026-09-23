"use client";

import { useAuthorization } from "@/auth/useAuthorization";
import type { ExtendedCaseItem } from "@/types/cases";
import AccessBadge from "../authorization/AccessBadge";
import Link from "next/link";
import { getCaseRelationshipsSync } from "@/services/api/relationships";

interface CaseTableProps {
  cases: ExtendedCaseItem[];
  onSelectCase?: (caseItem: ExtendedCaseItem) => void;
}

export default function CaseTable({ cases, onSelectCase }: CaseTableProps) {
  const { evaluateCaseAccess } = useAuthorization();

  if (!cases || cases.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-8 text-center text-xs text-outline">
        No case records match filter criteria.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
      <div className="border-b border-outline-variant bg-surface-container-high p-4 flex items-center justify-between">
        <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">folder_managed</span>
          Case Management &amp; Access Authorization Table
        </h3>
        <span className="text-xs font-mono text-outline">{cases.length} Total Cases</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-container-high/50 border-b border-outline-variant font-label-mono text-[11px] uppercase text-on-surface-variant">
            <tr>
              <th className="p-3.5">Case ID</th>
              <th className="p-3.5">Title &amp; Classification</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Priority</th>
              <th className="p-3.5">Assigned Officers</th>
              <th className="p-3.5">Access Level</th>
              <th className="p-3.5">Related Links</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {cases.map((c) => {
              const access = evaluateCaseAccess(c);
              const rels = getCaseRelationshipsSync(c.id);

              return (
                <tr key={c.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-3.5 font-mono text-primary font-bold">{c.id}</td>
                  <td className="p-3.5 font-medium text-on-surface">
                    <div className="font-bold text-sm">{c.name}</div>
                    <div className="text-[11px] text-on-surface-variant font-mono">{c.category}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="rounded border border-outline/20 bg-outline/10 px-2 py-0.5 text-xs text-outline font-medium">
                      ● {c.status}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold font-mono ${
                        c.priority === "Critical"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : c.priority === "High"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {c.priority || "High"}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {c.assignees && c.assignees.length > 0 ? (
                        c.assignees.map((a, idx) => (
                          <span key={idx} className="rounded bg-surface-container-high px-1.5 py-0.5 text-[10px] text-on-surface border border-outline-variant">
                            {a.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-outline text-[11px]">Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <AccessBadge level={access.level} size="sm" />
                  </td>
                  <td className="p-3.5">
                    <span className="rounded bg-primary/10 border border-primary/30 px-2 py-0.5 text-primary font-mono font-bold text-[11px]">
                      {rels.length} Related
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectCase && onSelectCase(c)}
                        className="rounded border border-primary/30 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary transition"
                      >
                        Inspect Access
                      </button>
                      <Link
                        href={`/case/${c.id}`}
                        className="rounded bg-primary px-2.5 py-1 text-xs font-bold text-on-primary hover:bg-primary-fixed transition"
                      >
                        Workspace
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
