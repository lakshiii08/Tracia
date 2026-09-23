"use client";

import { useState } from "react";
import { useAuthorization } from "@/auth/useAuthorization";
import type { AccessLevel } from "@/types/accessControl";
import AccessBadge from "../authorization/AccessBadge";

interface AccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  caseTitle: string;
  currentLevel: AccessLevel;
}

export default function AccessRequestModal({
  isOpen,
  onClose,
  caseId,
  caseTitle,
  currentLevel,
}: AccessRequestModalProps) {
  const { submitAccessRequest } = useAuthorization();
  const [requestedLevel, setRequestedLevel] = useState<AccessLevel>("L4");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      await submitAccessRequest(caseId, caseTitle, currentLevel, requestedLevel, reason.trim());
      setSuccessMessage("Access request submitted successfully to System Administrator.");
      setTimeout(() => {
        setSuccessMessage(null);
        setIsSubmitting(false);
        setReason("");
        onClose();
      }, 1500);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-outline-variant bg-surface-container p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">key</span>
            REQUEST CASE ACCESS
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {successMessage ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-xs text-emerald-400 font-bold space-y-1">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
            <p>{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-primary font-bold">{caseId}</span>
                <AccessBadge level={currentLevel} size="sm" />
              </div>
              <div className="font-bold text-sm text-on-surface">{caseTitle}</div>
            </div>

            <div>
              <label className="block text-outline font-medium mb-1">Requested Access Level</label>
              <select
                value={requestedLevel}
                onChange={(e) => setRequestedLevel(e.target.value as AccessLevel)}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface outline-none focus:border-primary"
              >
                <option value="L4">L4 - Full Case Access (Complete Investigation Workspace)</option>
                <option value="L3">L3 - Relevant Case Information &amp; Entity Summaries</option>
                <option value="L2">L2 - Relationship Access &amp; Shared Graph Attributes</option>
              </select>
            </div>

            <div>
              <label className="block text-outline font-medium mb-1">Investigation Justification &amp; Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                placeholder="Explain the investigative relevance (e.g. Shared phone number intercept, common suspect lead, cross-jurisdiction wire transfer)..."
                className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-xs text-on-surface outline-none focus:border-primary placeholder:text-outline/60"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-variant transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-on-primary hover:bg-primary-fixed disabled:opacity-50 transition flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">sync</span> Submitting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">send</span> Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
