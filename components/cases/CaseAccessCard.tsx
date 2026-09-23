"use client";

import type { ExtendedCaseItem } from "@/types/cases";
import { useAuthorization } from "@/auth/useAuthorization";
import AccessBadge from "../authorization/AccessBadge";
import { getCaseRelationshipsSync } from "@/services/api/relationships";
import { RELATIONSHIP_TYPE_CONFIG } from "@/types/relationships";
import Link from "next/link";
import { useState } from "react";
import AccessRequestModal from "./AccessRequestModal";

interface CaseAccessCardProps {
  caseItem: ExtendedCaseItem;
  onClose?: () => void;
}

export default function CaseAccessCard({ caseItem, onClose }: CaseAccessCardProps) {
  const { evaluateCaseAccess, cases } = useAuthorization();
  const access = evaluateCaseAccess(caseItem);
  const relationships = getCaseRelationshipsSync(caseItem.id);
  const [requestModal, setRequestModal] = useState<ExtendedCaseItem | null>(null);

  return (
    <div className="rounded-xl border border-primary/40 bg-surface-container p-6 space-y-6 shadow-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-outline-variant pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/30">
              {caseItem.id}
            </span>
            <span className="rounded border border-outline/20 bg-outline/10 px-2 py-0.5 text-xs text-outline font-medium">
              ● {caseItem.status}
            </span>
            <span className="rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-xs text-rose-400 font-bold font-mono">
              {caseItem.priority || "High"} Priority
            </span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface">{caseItem.name}</h2>
          <p className="mt-1 text-xs text-on-surface-variant max-w-3xl">{caseItem.desc}</p>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-variant transition"
            >
              Close Inspection
            </button>
          )}
          {access.canView && (
            <Link
              href={`/case/${caseItem.id}`}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-on-primary hover:bg-primary-fixed transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">folder_open</span> Enter Workspace
            </Link>
          )}
        </div>
      </div>

      {/* Case Overview Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 text-xs font-mono">
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3 space-y-1">
          <div className="text-outline uppercase text-[10px]">CATEGORY</div>
          <div className="font-bold text-on-surface">{caseItem.category}</div>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3 space-y-1">
          <div className="text-outline uppercase text-[10px]">CLASSIFICATION</div>
          <div className="font-bold text-amber-400">{caseItem.classification}</div>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3 space-y-1">
          <div className="text-outline uppercase text-[10px]">CREATION DATE</div>
          <div className="font-bold text-on-surface">{caseItem.date}</div>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3 space-y-1">
          <div className="text-outline uppercase text-[10px]">CURRENT EVALUATED ACCESS</div>
          <div><AccessBadge level={access.level} size="sm" /></div>
        </div>
      </div>

      {/* Access Evaluation Detail Card */}
      <div className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-4 space-y-2 text-xs">
        <div className="font-bold text-primary flex items-center gap-1.5 font-mono uppercase text-[11px]">
          <span className="material-symbols-outlined text-[16px]">verified_user</span>
          RBAC &amp; Graph Access Decision Rationale:
        </div>
        <p className="text-on-surface text-xs leading-relaxed">{access.reason}</p>
        {access.canRequestAccess && (
          <div className="pt-2 flex items-center justify-between border-t border-outline-variant/40">
            <span className="text-[11px] text-amber-400">Full access is currently unavailable under default scope.</span>
            <button
              onClick={() => setRequestModal(caseItem)}
              className="rounded bg-primary px-3 py-1 text-xs font-bold text-on-primary hover:bg-primary-fixed transition flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">key</span> Request Full Access (L4)
            </button>
          </div>
        )}
      </div>

      {/* Assigned Officers */}
      <div className="space-y-2">
        <h4 className="font-bold text-xs text-outline uppercase tracking-wider font-label-mono">Assigned Investigation Personnel</h4>
        <div className="flex flex-wrap gap-2">
          {caseItem.assignees?.map((a, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-high px-3 py-1.5 text-xs text-on-surface">
              <span className="material-symbols-outlined text-primary text-[16px]">badge</span>
              <div>
                <span className="font-bold">{a.name}</span>
                <span className="text-[10px] text-outline ml-1.5">({a.role})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related Cases Section */}
      <div className="space-y-3 pt-2 border-t border-outline-variant">
        <h4 className="font-bold text-xs text-outline uppercase tracking-wider font-label-mono flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[16px]">hub</span>
          Graph-Aware Connected Cases ({relationships.length})
        </h4>

        {relationships.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {relationships.map((rel) => {
              const targetId = rel.sourceCaseId === caseItem.id ? rel.targetCaseId : rel.sourceCaseId;
              const targetCase = cases.find((c) => c.id === targetId);
              const relConfig = RELATIONSHIP_TYPE_CONFIG[rel.relationshipType] || { label: rel.relationshipType, icon: "link", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" };
              const targetAccess = targetCase ? evaluateCaseAccess(targetCase) : null;

              return (
                <div key={rel.id} className="rounded-lg border border-outline-variant bg-surface-container-low p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary">{targetId}</span>
                    {targetAccess && <AccessBadge level={targetAccess.level} size="sm" />}
                  </div>

                  <div className="font-bold text-on-surface">{targetCase?.name || rel.targetCaseTitle}</div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold ${relConfig.color}`}>
                      <span className="material-symbols-outlined text-[12px]">{relConfig.icon}</span>
                      {relConfig.label}
                    </span>
                  </div>

                  <p className="text-[11px] text-on-surface-variant leading-tight">{rel.description}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-outline italic">No graph relationships linked to this case file.</p>
        )}
      </div>

      {requestModal && (
        <AccessRequestModal
          isOpen={!!requestModal}
          onClose={() => setRequestModal(null)}
          caseId={requestModal.id}
          caseTitle={requestModal.name}
          currentLevel={access.level}
        />
      )}
    </div>
  );
}
