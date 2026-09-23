"use client";

import React, { useState } from "react";
import type { VerificationResult } from "@/types/evidenceIntegrity";
import { computeFileSha256, verifyEvidenceIntegrity } from "@/services/evidenceRegistryService";
import {
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Loader2,
  Flag,
  Copy,
  Check,
} from "lucide-react";

interface VerifyIntegrityModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: VerificationResult | null;
  onFlagForReview?: (evidenceId: string) => void;
  onReverify?: (updatedResult: VerificationResult) => void;
}

export const VerifyIntegrityModal: React.FC<VerifyIntegrityModalProps> = ({
  isOpen,
  onClose,
  result: initialResult,
  onFlagForReview,
  onReverify,
}) => {
  const [currentResult, setCurrentResult] = useState<VerificationResult | null>(initialResult);
  const [testingFile, setTestingFile] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  React.useEffect(() => {
    setCurrentResult(initialResult);
    setFlagged(false);
  }, [initialResult]);

  if (!isOpen || !currentResult) return null;

  const isVerified = currentResult.is_match;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleTestCandidateFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTestingFile(true);
      try {
        const candidateHash = await computeFileSha256(file);
        const updated = verifyEvidenceIntegrity(
          currentResult.evidence_id,
          candidateHash,
          "Auditor Candidate File Check"
        );
        setCurrentResult(updated);
        if (onReverify) onReverify(updated);
      } catch (err) {
        console.error("Failed to test candidate file:", err);
      } finally {
        setTestingFile(false);
      }
    }
  };

  const handleFlag = () => {
    setFlagged(true);
    if (onFlagForReview) {
      onFlagForReview(currentResult.evidence_id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-surface-container via-surface-container to-surface-container-low border border-outline-variant/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/60 bg-surface-container-high/40">
          <div className="flex items-center space-x-3">
            {isVerified ? (
              <div className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <ShieldCheck className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2.5 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <ShieldAlert className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-base sm:text-lg font-bold text-on-surface">
                Cryptographic Evidence Audit
              </h2>
              <p className="text-xs text-on-surface-variant font-mono">
                Evidence: <span className="text-primary font-bold">{currentResult.evidence_id}</span> (v{currentResult.version})
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

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Status Alert Banner */}
          {isVerified ? (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-start space-x-3.5 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-emerald-400 text-sm sm:text-base">
                  ✓ VERIFIED - CRYPTOGRAPHIC INTEGRITY CONFIRMED
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  {currentResult.explanation}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-start space-x-3.5 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-400 text-sm sm:text-base">
                  ⚠ POTENTIAL INTEGRITY MISMATCH DETECTED
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  {currentResult.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Side-by-Side Fingerprint Comparison */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-outline tracking-wider font-mono">
              Cryptographic Fingerprint Audit
            </h4>

            <div className="space-y-2.5 text-xs">
              {/* Registered On-Chain Hash */}
              <div className="bg-surface-container-low/90 p-4 rounded-2xl border border-outline-variant space-y-1.5 shadow-inner">
                <div className="flex justify-between items-center text-xs text-outline">
                  <span className="font-bold text-on-surface">Registered On-Chain Hash (Smart Contract Anchor)</span>
                  <span className="text-cyan-400 font-mono text-[10px] bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    Anchor Target
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="font-mono text-xs text-cyan-300 break-all flex-1">{currentResult.registered_hash}</p>
                  <button
                    onClick={() => handleCopy(currentResult.registered_hash)}
                    className="text-outline hover:text-cyan-300 p-1 shrink-0 transition"
                    title="Copy Anchor Hash"
                  >
                    {copiedHash === currentResult.registered_hash ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Current Computed Candidate Hash */}
              <div
                className={`p-4 rounded-2xl border space-y-1.5 shadow-inner transition-all ${
                  isVerified
                    ? "bg-surface-container-low/90 border-outline-variant"
                    : "bg-amber-950/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-on-surface">Current Computed File Hash</span>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                      isVerified
                        ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30"
                        : "text-amber-400 bg-amber-500/15 border border-amber-500/40 animate-pulse"
                    }`}
                  >
                    {isVerified ? "✓ HASH MATCH CONFIRMED" : "⚠ MISMATCH DETECTED"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <p
                    className={`font-mono text-xs break-all flex-1 ${
                      isVerified ? "text-on-surface" : "text-amber-300 font-bold"
                    }`}
                  >
                    {currentResult.current_hash}
                  </p>
                  <button
                    onClick={() => handleCopy(currentResult.current_hash)}
                    className="text-outline hover:text-on-surface p-1 shrink-0 transition"
                    title="Copy Computed Hash"
                  >
                    {copiedHash === currentResult.current_hash ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Blockchain Provenance Details */}
          <div className="grid grid-cols-2 gap-3.5 bg-surface-container-low/90 p-4 rounded-2xl border border-outline-variant text-xs shadow-inner">
            <div>
              <p className="text-outline font-bold uppercase text-[10px] font-mono">Blockchain Network</p>
              <p className="text-on-surface font-semibold mt-0.5">{currentResult.blockchain_network}</p>
            </div>
            <div>
              <p className="text-outline font-bold uppercase text-[10px] font-mono">Block Number</p>
              <p className="text-cyan-400 font-mono font-bold mt-0.5">
                {currentResult.block_number ? `#${currentResult.block_number}` : "N/A"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-outline font-bold uppercase text-[10px] font-mono">Transaction Hash (TxID)</p>
              <p className="font-mono text-[11px] text-indigo-300 break-all mt-0.5">
                {currentResult.transaction_hash || "In-system simulated anchor"}
              </p>
            </div>
          </div>

          {/* Test External Candidate File */}
          <div className="rounded-2xl border-2 border-dashed border-outline-variant/80 p-4 bg-surface-container-low/50 hover:bg-surface-container-low transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-on-surface">Test External Candidate File</span>
              {testingFile && (
                <span className="text-[10px] text-cyan-400 flex items-center space-x-1 font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Computing candidate hash...</span>
                </span>
              )}
            </div>
            <label className="flex items-center justify-center space-x-2 w-full py-3 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs text-outline hover:text-on-surface cursor-pointer transition">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span className="font-medium">Select any candidate file to recalculate SHA-256 &amp; verify against this anchor</span>
              <input type="file" onChange={handleTestCandidateFile} className="hidden" />
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-outline-variant/60">
            {currentResult.explorer_url ? (
              <a
                href={currentResult.explorer_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 text-xs text-cyan-400 hover:text-cyan-300 underline font-mono"
              >
                <span>View on PolygonScan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2.5">
              {!isVerified && (
                <button
                  type="button"
                  onClick={handleFlag}
                  disabled={flagged}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flagged ? "Flagged for Forensic Review" : "Flag for Forensic Review"}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-surface-container-high hover:bg-outline-variant text-on-surface rounded-xl text-xs font-bold transition"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
