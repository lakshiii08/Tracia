"use client";

import { useState } from "react";
import Link from "next/link";
import type { CaseRelationship } from "@/types/relationships";
import { RELATIONSHIP_TYPE_CONFIG } from "@/types/relationships";
import type { ExtendedCaseItem } from "@/types/cases";
import type { AccessDecision } from "@/types/accessControl";
import AccessBadge from "../authorization/AccessBadge";
import AccessRequestModal from "./AccessRequestModal";

interface RelatedCasesProps {
  relatedItems: {
    caseItem: ExtendedCaseItem;
    relationship: CaseRelationship;
    access: AccessDecision;
  }[];
}

export default function RelatedCases({ relatedItems }: RelatedCasesProps) {
  const [selectedForRequest, setSelectedForRequest] = useState<{
    caseId: string;
    caseTitle: string;
    currentLevel: import("@/types/accessControl").AccessLevel;
  } | null>(null);

  if (!relatedItems || relatedItems.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-6 text-center text-xs text-outline">
        No graph-connected related cases discovered for current officer assignment scope.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">hub</span>
            Graph Discovered Related Cases
          </h3>
          <p className="text-xs text-on-surface-variant">
            Cross-case relationships discovered through shared phones, suspects, vehicles &amp; cyber indicators.
          </p>
        </div>
        <span className="rounded bg-primary/10 border border-primary/30 px-2.5 py-1 text-xs font-mono font-bold text-primary">
          {relatedItems.length} Related Cases Found
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {relatedItems.map(({ caseItem, relationship, access }) => {
          const relConfig = RELATIONSHIP_TYPE_CONFIG[relationship.relationshipType] || {
            label: relationship.relationshipType,
            icon: "link",
            color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
          };

          return (
            <div
              key={caseItem.id}
              className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container p-4 space-y-3 hover:border-primary/40 transition shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    Case {caseItem.id}
                  </span>
                  <AccessBadge level={access.level} size="sm" />
                </div>

                <h4 className="font-bold text-sm text-on-surface line-clamp-1">{caseItem.name}</h4>
                <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">{caseItem.desc}</p>
              </div>

              {/* Relationship card block */}
              <div className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-3 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] font-mono text-outline">
                  <span className="material-symbols-outlined text-[14px]">account_tree</span>
                  Graph Relationship
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold ${relConfig.color}`}>
                    <span className="material-symbols-outlined text-[13px]">{relConfig.icon}</span>
                    {relConfig.label}
                  </span>
                </div>

                {relationship.sharedAttributeValue && (
                  <div className="font-mono text-[11px] text-amber-400 bg-amber-500/10 p-1.5 rounded border border-amber-500/20 truncate">
                    Link: {relationship.sharedAttributeValue}
                  </div>
                )}

                <div className="text-[11px] text-on-surface-variant leading-tight">
                  {relationship.description}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/50">
                <Link
                  href="/graph"
                  className="flex-1 rounded-lg border border-outline-variant bg-surface-container-high py-1.5 text-center text-xs font-semibold text-on-surface hover:bg-surface-variant transition flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">hub</span> View Graph
                </Link>

                {access.canRequestAccess && (
                  <button
                    onClick={() =>
                      setSelectedForRequest({
                        caseId: caseItem.id,
                        caseTitle: caseItem.name,
                        currentLevel: access.level,
                      })
                    }
                    className="flex-1 rounded-lg bg-primary py-1.5 text-center text-xs font-bold text-on-primary hover:bg-primary-fixed transition flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">key</span> Request Access
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedForRequest && (
        <AccessRequestModal
          isOpen={!!selectedForRequest}
          onClose={() => setSelectedForRequest(null)}
          caseId={selectedForRequest.caseId}
          caseTitle={selectedForRequest.caseTitle}
          currentLevel={selectedForRequest.currentLevel}
        />
      )}
    </div>
  );
}
