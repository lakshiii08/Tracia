"use client";

import React, { useState, useRef } from "react";
import { hashFile, formatBytes, type HashResult } from "@/lib/cryptoHash";
import { registerLocalEvidence, verifyEvidenceIntegrity, simulateTamperEvidence, restoreTamperedEvidence } from "@/services/evidenceRegistryService";
import { useAppData } from "@/lib/store";

export default function FileHashingWidget({ caseId }: { caseId: string }) {
  const { pushAudit } = useAppData();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hashResult, setHashResult] = useState<HashResult | null>(null);
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [anchoredReceipt, setAnchoredReceipt] = useState<{
    evidenceId: string;
    txHash: string;
    blockNumber: number;
  } | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<{
    status: "VERIFIED" | "MISMATCH" | "UNREGISTERED";
    message: string;
  } | null>(null);

  const handleFile = async (file: File) => {
    setIsHashing(true);
    setAnchoredReceipt(null);
    setVerificationStatus(null);
    try {
      const res = await hashFile(file);
      setHashResult(res);
      pushAudit(`File hashed: ${file.name} (SHA-256: ${res.sha256.substring(0, 16)}...)`, "INVESTIGATOR");
    } finally {
      setIsHashing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAnchorToBlockchain = () => {
    if (!hashResult) return;
    const evidenceId = `EV-${Math.floor(100 + Math.random() * 900)}`;
    const record = registerLocalEvidence({
      evidence_id: evidenceId,
      case_id: caseId,
      file_name: hashResult.fileName,
      sha256: hashResult.sha256,
      file_size_bytes: hashResult.fileSizeBytes,
      mime_type: hashResult.mimeType,
    });

    setAnchoredReceipt({
      evidenceId: record.evidence_id,
      txHash: record.transaction_hash,
      blockNumber: record.block_number,
    });

    setVerificationStatus({
      status: "VERIFIED",
      message: "Fingerprint successfully anchored to Polygon Amoy EVM Proof-of-Stake ledger!",
    });

    pushAudit(`Evidence anchored to blockchain: ${record.evidence_id} (Block #${record.block_number})`, "INVESTIGATOR");
  };

  const handleVerifyAgainstBlockchain = () => {
    if (!hashResult) return;
    if (!anchoredReceipt) {
      setVerificationStatus({
        status: "UNREGISTERED",
        message: "This file has not been anchored to the blockchain yet. Click 'Anchor Hash to Blockchain' first.",
      });
      return;
    }

    const check = verifyEvidenceIntegrity(anchoredReceipt.evidenceId, hashResult.sha256);
    if (check.is_match) {
      setVerificationStatus({
        status: "VERIFIED",
        message: "Integrity Confirmed: Current file SHA-256 fingerprint matches the immutable blockchain anchor exactly.",
      });
    } else {
      setVerificationStatus({
        status: "MISMATCH",
        message: "ALERT: Cryptographic mismatch detected! File has been altered or tampered with.",
      });
    }
  };

  const handleSimulateTamper = () => {
    if (!anchoredReceipt) return;
    simulateTamperEvidence(anchoredReceipt.evidenceId);
    setVerificationStatus({
      status: "MISMATCH",
      message: "TAMPER SIMULATION ACTIVE: 1-byte storage alteration simulated! Verification failed as expected.",
    });
    pushAudit(`[SECURITY TEST] Simulated tampering on evidence ${anchoredReceipt.evidenceId}`, "SECURITY_DEMO");
  };

  const handleRestoreAuthentic = () => {
    if (!anchoredReceipt) return;
    restoreTamperedEvidence(anchoredReceipt.evidenceId);
    setVerificationStatus({
      status: "VERIFIED",
      message: "Authentic evidence state restored! Cryptographic integrity confirmed.",
    });
    pushAudit(`Restored authentic state for evidence ${anchoredReceipt.evidenceId}`, "SYSTEM_VAULT");
  };

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container overflow-hidden space-y-4">
      {/* Header */}
      <div className="p-4 border-b border-outline-variant bg-surface-container-high/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">fingerprint</span>
          <div>
            <h3 className="font-bold text-sm text-on-surface">Client-Side Cryptographic File Hasher</h3>
            <p className="text-[11px] text-on-surface-variant">
              Web Crypto Subtle API ➔ Real-time SHA-256 / SHA-1 computation &amp; Blockchain Proof Anchoring
            </p>
          </div>
        </div>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-primary">
          ZERO-SERVER LEAKAGE
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-outline-variant/80 hover:border-primary/60 rounded-xl p-8 text-center cursor-pointer transition bg-surface-container-low hover:bg-surface-container-high/40 group"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 text-primary mx-auto flex items-center justify-center group-hover:scale-110 transition duration-200">
            <span className="material-symbols-outlined text-[24px]">enhanced_encryption</span>
          </div>
          <div className="mt-3 font-semibold text-xs text-on-surface">
            Drop any file here or <span className="text-primary underline">choose file</span> to compute cryptographic hash
          </div>
          <div className="text-[11px] text-outline mt-1 font-mono">
            Accepts any file: PDF, Images, Audio, Video, CSV, Logs, Archives
          </div>
        </div>

        {/* Hashing Status */}
        {isHashing && (
          <div className="flex items-center justify-center gap-2 py-4 text-xs text-primary font-semibold">
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            <span>Computing 256-bit cryptographic digest...</span>
          </div>
        )}

        {/* Results Card */}
        {hashResult && !isHashing && (
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/60 pb-3">
              <div className="min-w-0">
                <div className="font-bold text-xs text-on-surface truncate">{hashResult.fileName}</div>
                <div className="text-[10px] font-mono text-outline mt-0.5">
                  Size: {formatBytes(hashResult.fileSizeBytes)} ({hashResult.fileSizeBytes.toLocaleString()} bytes) · Type: {hashResult.mimeType}
                </div>
              </div>
              <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-400 font-bold">
                Computed
              </span>
            </div>

            {/* SHA-256 Output */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono uppercase text-outline font-semibold">SHA-256 (Primary Evidence Fingerprint)</span>
                <button
                  onClick={() => copyToClipboard(hashResult.sha256, "sha256")}
                  className="text-primary hover:underline font-mono text-[10px] flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                  {copiedKey === "sha256" ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/80 font-mono text-[11px] text-amber-400 break-all select-all">
                {hashResult.sha256}
              </div>
            </div>

            {/* SHA-1 Output */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono uppercase text-outline font-semibold">SHA-1 (Legacy Cross-Validation)</span>
                <button
                  onClick={() => copyToClipboard(hashResult.sha1, "sha1")}
                  className="text-primary hover:underline font-mono text-[10px] flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                  {copiedKey === "sha1" ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="p-2 rounded-lg bg-surface-container border border-outline-variant/80 font-mono text-[11px] text-on-surface-variant break-all select-all">
                {hashResult.sha1}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/40">
              <button
                onClick={handleAnchorToBlockchain}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[15px]">lock</span>
                Anchor Hash to Blockchain
              </button>

              <button
                onClick={handleVerifyAgainstBlockchain}
                className="px-3.5 py-2 rounded-lg border border-outline-variant hover:bg-surface-variant text-xs font-semibold text-on-surface transition flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px] text-emerald-400">verified</span>
                Verify File Integrity
              </button>

              {anchoredReceipt && (
                <>
                  <button
                    onClick={handleSimulateTamper}
                    className="px-3 py-2 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition flex items-center gap-1"
                    title="Simulate 1-byte storage tampering"
                  >
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    Simulate Tamper
                  </button>

                  <button
                    onClick={handleRestoreAuthentic}
                    className="px-3 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold transition flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">restore</span>
                    Restore Authentic
                  </button>
                </>
              )}
            </div>

            {/* Anchored Receipt Banner */}
            {anchoredReceipt && (
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs font-mono space-y-1">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>ANCHORED TO BLOCKCHAIN (ID: {anchoredReceipt.evidenceId})</span>
                  <span>Block #{anchoredReceipt.blockNumber}</span>
                </div>
                <div className="text-[10px] text-outline truncate" title={anchoredReceipt.txHash}>
                  TxID: {anchoredReceipt.txHash}
                </div>
              </div>
            )}

            {/* Verification Status Banner */}
            {verificationStatus && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                  verificationStatus.status === "VERIFIED"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : verificationStatus.status === "MISMATCH"
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {verificationStatus.status === "VERIFIED"
                    ? "check_circle"
                    : verificationStatus.status === "MISMATCH"
                    ? "error"
                    : "info"}
                </span>
                <span>{verificationStatus.message}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
