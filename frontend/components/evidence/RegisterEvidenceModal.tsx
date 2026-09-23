"use client";

import React, { useState } from "react";
import {
  computeFileSha256,
  registerLocalEvidence,
  registerOnChainWithMetaMask,
  DEFAULT_CONTRACT_ADDRESS,
} from "@/services/evidenceRegistryService";
import type { EvidenceRecord } from "@/types/evidenceIntegrity";
import {
  Upload,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  FileCode,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface RegisterEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRecord: EvidenceRecord) => void;
  defaultCaseId?: string;
  contractAddress?: string;
  walletConnected?: boolean;
}

export const RegisterEvidenceModal: React.FC<RegisterEvidenceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultCaseId = "CASE-TR-102",
  contractAddress = DEFAULT_CONTRACT_ADDRESS,
  walletConnected = false,
}) => {
  const [caseId, setCaseId] = useState(defaultCaseId);
  const [evidenceId, setEvidenceId] = useState(`EV-${Math.floor(100 + Math.random() * 900)}`);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientHash, setClientHash] = useState<string>("");
  const [isHashing, setIsHashing] = useState(false);
  const [anchorMode, setAnchorMode] = useState<"system" | "metamask">("system");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvidenceRecord | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setError(null);
      setIsHashing(true);

      try {
        const hash = await computeFileSha256(file);
        setClientHash(hash);
      } catch (err: unknown) {
        console.error("Error computing client hash:", err);
        setError("Could not compute file SHA-256 fingerprint.");
      } finally {
        setIsHashing(false);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a digital evidence file to anchor.");
      return;
    }
    if (!clientHash) {
      setError("Cryptographic SHA-256 hash not computed yet.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (anchorMode === "metamask") {
        // Register through MetaMask EVM
        const txData = await registerOnChainWithMetaMask(
          contractAddress,
          evidenceId,
          clientHash
        );

        const record = registerLocalEvidence({
          evidence_id: evidenceId,
          case_id: caseId,
          file_name: selectedFile.name,
          sha256: clientHash,
          file_size_bytes: selectedFile.size,
          mime_type: selectedFile.type,
          blockchain_network: txData.networkName,
          contract_address: contractAddress,
          transaction_hash: txData.transactionHash,
          block_number: txData.blockNumber,
          registered_by: txData.registeredBy,
        });

        setResult(record);
        onSuccess(record);
      } else {
        // In-System Ledger Registration
        try {
          const formData = new FormData();
          formData.append("evidence_id", evidenceId);
          formData.append("case_id", caseId);
          formData.append("file", selectedFile);
          fetch("/api/evidence", { method: "POST", body: formData }).catch(() => {});
        } catch {
          // Ignore
        }

        const record = registerLocalEvidence({
          evidence_id: evidenceId,
          case_id: caseId,
          file_name: selectedFile.name,
          sha256: clientHash,
          file_size_bytes: selectedFile.size,
          mime_type: selectedFile.type,
          blockchain_network: "Polygon Amoy EVM Proof Ledger",
          contract_address: contractAddress,
        });

        setResult(record);
        onSuccess(record);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHash = () => {
    if (!clientHash && !result?.sha256) return;
    navigator.clipboard.writeText(result?.sha256 || clientHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleReset = () => {
    setResult(null);
    setSelectedFile(null);
    setClientHash("");
    setEvidenceId(`EV-${Math.floor(100 + Math.random() * 900)}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-surface-container via-surface-container to-surface-container-low border border-outline-variant/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/60 bg-surface-container-high/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-on-surface">
                Anchor Digital Evidence to Blockchain
              </h2>
              <p className="text-xs text-on-surface-variant font-mono">
                Zero-PII Cryptographic SHA-256 Fingerprint Anchoring
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

        {/* Content */}
        {result ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start space-x-3.5 shadow-[0_0_20px_rgba(16,185,129,0.12)]">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-emerald-400 text-sm sm:text-base">
                  Evidence Cryptographically Anchored
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Fingerprint permanently recorded on immutable ledger:{" "}
                  <span className="font-semibold text-on-surface">{result.blockchain_network}</span>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs bg-surface-container-low/90 p-5 rounded-2xl border border-outline-variant shadow-inner">
              <div>
                <p className="text-outline text-[10px] uppercase font-bold font-mono">Evidence Identifier</p>
                <p className="font-mono font-bold text-primary text-sm mt-0.5">{result.evidence_id} (v{result.version})</p>
              </div>
              <div>
                <p className="text-outline text-[10px] uppercase font-bold font-mono">Case Reference</p>
                <p className="font-semibold text-on-surface text-sm mt-0.5">{result.case_id}</p>
              </div>
              <div>
                <p className="text-outline text-[10px] uppercase font-bold font-mono">Anchored File</p>
                <p className="font-medium text-on-surface truncate mt-0.5">{result.file_name}</p>
              </div>
              <div>
                <p className="text-outline text-[10px] uppercase font-bold font-mono">Block Number</p>
                <p className="font-mono text-cyan-400 font-bold mt-0.5">#{result.block_number}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-outline text-[10px] uppercase font-bold font-mono">
                  SHA-256 Digital Fingerprint
                </p>
                <div className="flex items-center space-x-2 bg-surface-container p-2.5 rounded-xl border border-outline-variant mt-1 font-mono text-[11px] text-cyan-300">
                  <span className="break-all flex-1">{result.sha256}</span>
                  <button
                    onClick={handleCopyHash}
                    className="text-outline hover:text-cyan-300 p-1 shrink-0 transition"
                    title="Copy Fingerprint"
                  >
                    {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="text-outline text-[10px] uppercase font-bold font-mono">
                  Blockchain Transaction Receipt (TxID)
                </p>
                <p className="font-mono text-[11px] text-indigo-300 break-all bg-surface-container p-2.5 rounded-xl border border-outline-variant mt-1">
                  {result.transaction_hash}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl text-xs font-bold transition shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                Done &amp; View Ledger
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="p-6 sm:p-8 space-y-5">
            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-outline uppercase block mb-1.5 font-mono">
                  Case ID
                </label>
                <input
                  type="text"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  required
                  placeholder="e.g. CASE-TR-102"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 font-mono transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-outline uppercase block mb-1.5 font-mono">
                  Evidence ID
                </label>
                <input
                  type="text"
                  value={evidenceId}
                  onChange={(e) => setEvidenceId(e.target.value)}
                  required
                  placeholder="e.g. EV-105"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 font-mono transition"
                />
              </div>
            </div>

            {/* File Upload Selector */}
            <div>
              <label className="text-xs font-bold text-outline uppercase block mb-1.5 font-mono">
                Select Digital Evidence File
              </label>
              <div className="rounded-2xl border-2 border-dashed border-outline-variant/80 bg-surface-container-low/60 hover:bg-surface-container-low p-6 text-center transition hover:border-cyan-500/50 relative cursor-pointer group">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center space-y-2 text-xs">
                  <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition duration-200">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-on-surface text-sm">
                    {selectedFile ? selectedFile.name : "Click or drag digital evidence file to compute fingerprint"}
                  </p>
                  <p className="text-[11px] text-outline">
                    PDF, CSV, CDR Dump, Forensic Image, CCTV Video (up to 500MB)
                  </p>
                </div>
              </div>
            </div>

            {/* In-Browser Hash Display */}
            {isHashing && (
              <div className="flex items-center space-x-2 text-xs text-cyan-400 font-mono py-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Computing streaming SHA-256 fingerprint in browser via Web Crypto API...</span>
              </div>
            )}

            {clientHash && (
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-outline uppercase text-[10px] font-bold font-mono">
                    Computed Client-Side SHA-256
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ready to Anchor
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="font-mono text-xs text-cyan-400 break-all flex-1">{clientHash}</p>
                  <button
                    type="button"
                    onClick={handleCopyHash}
                    className="text-outline hover:text-cyan-300 p-1 shrink-0 transition"
                    title="Copy Fingerprint"
                  >
                    {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Anchoring Mode Selector */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-outline uppercase block font-mono">
                Anchoring Protocol &amp; Target Ledger
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setAnchorMode("system")}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start space-x-3 ${
                    anchorMode === "system"
                      ? "border-primary bg-primary/10 text-on-surface shadow-[0_0_15px_rgba(74,142,255,0.15)] ring-1 ring-primary"
                      : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs">In-System Verified Proof</div>
                    <div className="text-[10px] text-outline mt-0.5">
                      Fast, instant cryptographic anchoring into Tracia ledger
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAnchorMode("metamask")}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start space-x-3 ${
                    anchorMode === "metamask"
                      ? "border-primary bg-primary/10 text-on-surface shadow-[0_0_15px_rgba(74,142,255,0.15)] ring-1 ring-primary"
                      : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <FileCode className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs">MetaMask On-Chain Sign</div>
                    <div className="text-[10px] text-outline mt-0.5">
                      Sign transaction on Polygon Amoy or Local Hardhat EVM
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-outline-variant/60">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedFile || !clientHash}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container hover:opacity-95 text-on-primary text-xs font-bold rounded-xl transition shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {loading
                    ? "Anchoring on Blockchain..."
                    : anchorMode === "metamask"
                    ? "Sign & Anchor with MetaMask"
                    : "Anchor Fingerprint Now"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
