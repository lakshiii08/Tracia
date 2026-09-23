"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import CaseGate from "@/components/CaseGate";
import { useAppData } from "@/lib/store";
import { MetaMaskBar } from "@/components/evidence/MetaMaskBar";
import { RegisterEvidenceModal } from "@/components/evidence/RegisterEvidenceModal";
import { VerifyIntegrityModal } from "@/components/evidence/VerifyIntegrityModal";
import { ProvenanceTimelineModal } from "@/components/evidence/ProvenanceTimelineModal";
import {
  getLocalEvidenceRecords,
  verifyEvidenceIntegrity,
  simulateTamperEvidence,
  restoreTamperedEvidence,
  getProvenanceTrail,
  DEFAULT_CONTRACT_ADDRESS,
  verifyOnChainContract,
  computeFileSha256,
} from "@/services/evidenceRegistryService";
import type {
  EvidenceRecord,
  VerificationResult,
  ProvenanceData,
} from "@/types/evidenceIntegrity";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  Layers,
  FileText,
  Activity,
  Lock,
  CheckCircle2,
  Copy,
  Check,
  Cpu,
  Upload,
  Loader2,
  Database,
  Fingerprint,
} from "lucide-react";

export default function EvidenceIntegrityPage() {
  const { evidenceFiles, addEvidenceFiles, selectedCaseId, pushAudit } = useAppData();

  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"ledger" | "pipeline" | "web3">("ledger");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(null);
  const [provenanceData, setProvenanceData] = useState<ProvenanceData | null>(null);
  const [tamperFeedback, setTamperFeedback] = useState<{ id: string; message: string } | null>(null);

  // Web3 state
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [walletConnectedAddress, setWalletConnectedAddress] = useState<string | null>(null);

  // Direct Web3 verification tab state
  const [web3EvidenceId, setWeb3EvidenceId] = useState("EV-101");
  const [web3CandidateFile, setWeb3CandidateFile] = useState<File | null>(null);
  const [web3CandidateHash, setWeb3CandidateHash] = useState<string>("");
  const [web3IsHashing, setWeb3IsHashing] = useState(false);
  const [web3Result, setWeb3Result] = useState<{
    isValid: boolean;
    version: number;
    timestamp: string;
    registeredBy: string;
  } | null>(null);
  const [web3Error, setWeb3Error] = useState<string | null>(null);
  const [web3Verifying, setWeb3Verifying] = useState(false);

  // Ingestion form state
  const [newFile, setNewFile] = useState("");
  const [fileType, setFileType] = useState("FIR");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const evidenceTarget = new URLSearchParams(window.location.search).get("evidence");
      if (evidenceTarget) {
        setSearchTerm(evidenceTarget);
        setActiveTab("ledger");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Load evidence list (tries API, falls back to local storage)
  const refreshRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/evidence/ledger");
      if (res.ok) {
        const apiRecords = await res.json();
        if (Array.isArray(apiRecords) && apiRecords.length > 0) {
          setEvidenceList(apiRecords);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fallback
    }

    const local = getLocalEvidenceRecords();
    setEvidenceList(local);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshRecords();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshRecords]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Run integrity verification
  const handleVerify = (evidenceId: string) => {
    const result = verifyEvidenceIntegrity(evidenceId);
    setVerifyResult(result);
    pushAudit(
      `Evidence integrity verified for ${evidenceId}: ${result.integrity_status}`,
      "AUDITOR"
    );
  };

  // Run provenance query
  const handleViewProvenance = (evidenceId: string) => {
    try {
      const data = getProvenanceTrail(evidenceId);
      setProvenanceData(data);
      pushAudit(`Provenance audit trail inspected for ${evidenceId}`, "INVESTIGATOR");
    } catch (err: unknown) {
      console.error(err);
    }
  };

  // Simulate 1-byte illicit tampering
  const handleSimulateTamper = (evidenceId: string) => {
    try {
      const res = simulateTamperEvidence(evidenceId);
      setTamperFeedback({ id: evidenceId, message: res.message });
      refreshRecords();

      pushAudit(
        `[SECURITY SIMULATION] Illicit 1-byte storage tampering simulated on ${evidenceId}`,
        "SECURITY_DEMO"
      );

      setTimeout(() => {
        handleVerify(evidenceId);
      }, 400);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  // Restore authentic evidence file & hash
  const handleRestore = (evidenceId: string) => {
    try {
      restoreTamperedEvidence(evidenceId);
      setTamperFeedback(null);
      refreshRecords();

      pushAudit(
        `Authentic evidence file and cryptographic hash restored for ${evidenceId}`,
        "SYSTEM_VAULT"
      );

      setTimeout(() => {
        handleVerify(evidenceId);
      }, 300);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  // Web3 candidate file selection & on-chain zero-gas audit
  const handleWeb3FileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setWeb3CandidateFile(file);
      setWeb3IsHashing(true);
      setWeb3Error(null);
      try {
        const hash = await computeFileSha256(file);
        setWeb3CandidateHash(hash);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error hashing file";
        setWeb3Error(msg);
      } finally {
        setWeb3IsHashing(false);
      }
    }
  };

  const handleRunWeb3Verification = async () => {
    if (!web3CandidateHash) {
      setWeb3Error("Please select a candidate file to calculate hash first.");
      return;
    }
    setWeb3Verifying(true);
    setWeb3Error(null);
    try {
      const res = await verifyOnChainContract(
        contractAddress,
        web3EvidenceId,
        web3CandidateHash
      );
      setWeb3Result(res);
      pushAudit(
        `Zero-Gas On-Chain verification performed for ${web3EvidenceId} on ${contractAddress}: ${
          res.isValid ? "VALID" : "MISMATCH"
        }`,
        "WEB3_AUDITOR"
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Contract call failed";
      setWeb3Error(msg);
    } finally {
      setWeb3Verifying(false);
    }
  };

  const handleUploadIngestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile.trim()) return;
    addEvidenceFiles([{ filename: newFile.trim(), type: fileType }]);
    pushAudit(`Uploaded investigation evidence file: ${newFile.trim()}`, "INVESTIGATOR");
    setNewFile("");
  };

  const filteredEvidence = evidenceList.filter(
    (item) =>
      item.evidence_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sha256.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title="Evidence Integrity &amp; Chain of Custody"
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <main className="min-w-0 flex-1">
          <CaseGate moduleTitle="Evidence Integrity &amp; Chain of Custody">
            <div className="p-5 lg:p-8">
              <div className="mx-auto max-w-7xl space-y-6">

                {/* 1. Header Banner */}
                <div className="flex flex-col gap-4 rounded-xl border border-primary/30 bg-surface-container p-5 md:flex-row md:items-center md:justify-between md:p-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <h1 className="text-2xl font-bold sm:text-3xl">Evidence Integrity &amp; Provenance Ledger</h1>
                      <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] font-label-mono font-semibold uppercase text-primary">
                        Polygon Amoy / EVM Proof Ledger
                      </span>
                    </div>
                    <p className="max-w-3xl text-sm text-on-surface-variant">
                      Cryptographic SHA-256 evidence fingerprinting, smart contract anchoring, real-time tamper detection simulation, and immutable audit trails for investigative forensics.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2.5 shrink-0">
                    <button
                      onClick={refreshRecords}
                      className="rounded-lg border border-outline-variant bg-surface-container-low p-2.5 text-outline transition hover:bg-surface-container-high hover:text-on-surface"
                      title="Refresh Ledger"
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-primary" : ""}`} />
                    </button>
                    <button
                      onClick={() => setIsRegisterOpen(true)}
                      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-on-primary transition hover:bg-primary-container"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Anchor New Evidence</span>
                    </button>
                  </div>
                </div>

                {/* 2. Tamper Feedback Alert Banner */}
                {tamperFeedback && (
                  <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-300 sm:flex-row sm:items-center">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/15 text-amber-400">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                      </div>
                      <div>
                        <span className="font-bold uppercase tracking-wider text-amber-400">Tamper Detection Active:</span>{" "}
                        <span className="text-on-surface">{tamperFeedback.message}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleVerify(tamperFeedback.id)}
                        className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-3.5 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/30"
                      >
                        Re-Verify Now
                      </button>
                      <button
                        onClick={() => handleRestore(tamperFeedback.id)}
                        className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
                      >
                        Restore Authentic State
                      </button>
                      <button
                        onClick={() => setTamperFeedback(null)}
                        className="ml-2 text-xs text-outline hover:text-on-surface"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Stats Cards Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-label-mono uppercase tracking-wider text-primary">
                        Total Anchored Items
                      </span>
                      <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-on-surface">{evidenceList.length}</p>
                    <p className="mt-1 text-[11px] text-on-surface-variant">Multi-source evidence records</p>
                  </div>

                  <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-label-mono uppercase tracking-wider text-outline">
                        Blockchain Ledger
                      </span>
                      <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                        <Activity className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mt-2 text-base font-bold text-on-surface">Polygon Amoy / EVM</p>
                    <p className="mt-1 text-[11px] text-on-surface-variant">Proof-of-Stake / Zero-Gas eth_call</p>
                  </div>

                  <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-label-mono uppercase tracking-wider text-outline">
                        Privacy Boundary
                      </span>
                      <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                        <Lock className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mt-2 text-base font-bold text-on-surface">Zero-PII On-Chain</p>
                    <p className="mt-1 text-[11px] text-on-surface-variant">Raw data encrypted off-chain</p>
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-label-mono uppercase tracking-wider text-primary">
                        Integrity Protocol
                      </span>
                      <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                        <Fingerprint className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mt-2 text-base font-bold text-on-surface">SHA-256 (bytes32)</p>
                    <p className="mt-1 text-[11px] text-on-surface-variant">Immutable version history</p>
                  </div>
                </div>

                {/* 4. Navigation View Switcher Tabs */}
                <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant pb-2 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab("ledger")}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 transition ${
                      activeTab === "ledger"
                        ? "bg-primary text-on-primary"
                        : "text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    <span>Evidence Integrity Ledger</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-label-mono ${
                      activeTab === "ledger" ? "bg-on-primary/20 text-on-primary" : "bg-surface-container text-outline"
                    }`}>
                      {evidenceList.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab("pipeline")}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 transition ${
                      activeTab === "pipeline"
                        ? "bg-primary text-on-primary"
                        : "text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Chain of Custody &amp; Ingestion</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("web3")}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 transition ${
                      activeTab === "web3"
                        ? "bg-primary text-on-primary"
                        : "text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    <Cpu className="h-3.5 w-3.5" />
                    <span>Web3 &amp; MetaMask Portal</span>
                  </button>
                </div>

                {/* 5. TAB 1: EVIDENCE INTEGRITY LEDGER TABLE */}
                {activeTab === "ledger" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
                      {/* Search Bar & Filter Header */}
                      <div className="flex flex-col items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-high/40 p-4 sm:flex-row">
                        <div className="relative w-full sm:w-88">
                          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                          <input
                            type="text"
                            placeholder="Search by Case, Evidence ID, or Fingerprint..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2 pl-10 pr-4 text-xs text-on-surface placeholder-outline transition focus:border-primary focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-2 text-xs text-outline">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          <span>Showing {filteredEvidence.length} anchored evidence records</span>
                        </div>
                      </div>

                      {/* Evidence Records Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-outline-variant bg-surface-container-high text-[10px] font-label-mono uppercase tracking-wider text-on-surface-variant">
                            <tr>
                              <th className="p-4">Evidence &amp; Case ID</th>
                              <th className="p-4">File Name &amp; Version</th>
                              <th className="p-4">SHA-256 Fingerprint</th>
                              <th className="p-4">Blockchain Anchor</th>
                              <th className="p-4">Timestamp</th>
                              <th className="p-4 text-right">Integrity Operations</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/40 font-mono text-[11px]">
                            {filteredEvidence.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-12 text-center text-outline font-sans">
                                  <div className="flex flex-col items-center space-y-2">
                                    <ShieldAlert className="w-8 h-8 text-outline" />
                                    <p className="text-sm">No evidence records found.</p>
                                    <p className="text-xs text-outline">Click &quot;Anchor New Evidence&quot; to register your first digital file.</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              filteredEvidence.map((item) => (
                                <tr key={item.evidence_id} className="transition-colors duration-150 hover:bg-surface-container-high">
                                  {/* Evidence / Case ID */}
                                  <td className="p-4 font-sans">
                                    <div className="flex items-center space-x-2">
                                      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-[10px] font-bold text-primary">
                                        EV
                                      </span>
                                      <div>
                                        <div className="flex items-center space-x-1.5">
                                          <p className="font-bold text-on-surface font-mono">{item.evidence_id}</p>
                                          {item.is_tampered && (
                                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-bold font-mono animate-pulse">
                                              TAMPERED
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-outline text-[10px] font-mono">{item.case_id}</p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* File & Version */}
                                  <td className="p-4 font-sans">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-on-surface font-semibold truncate max-w-[170px]" title={item.file_name}>
                                        {item.file_name}
                                      </span>
                                      <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                        v{item.version}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[10px] font-mono flex items-center space-x-1 mt-0.5 ${
                                        item.is_tampered ? "text-amber-400" : "text-emerald-400"
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${item.is_tampered ? "bg-amber-400" : "bg-emerald-400"}`} />
                                      <span>{item.status}</span>
                                    </span>
                                  </td>

                                  {/* SHA-256 Fingerprint */}
                                  <td className="p-4">
                                    <div className="group flex max-w-xs items-center space-x-2 rounded-xl border border-primary/20 bg-surface-container-low px-3 py-1.5 shadow-inner">
                                      <span
                                        className={`truncate text-[10px] ${
                                          item.is_tampered ? "text-amber-400 font-bold" : "text-primary"
                                        }`}
                                        title={item.sha256}
                                      >
                                        {item.sha256}
                                      </span>
                                      <button
                                        onClick={() => handleCopyHash(item.sha256)}
                                        className="shrink-0 p-0.5 text-outline transition hover:text-primary"
                                        title="Copy Hash"
                                      >
                                        {copiedHash === item.sha256 ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  </td>

                                  {/* Anchor Receipt */}
                                  <td className="p-4">
                                    <div className="space-y-0.5 font-mono">
                                      <p className="text-primary text-[10px] font-bold">
                                        Block #{item.block_number}
                                      </p>
                                      <p className="text-outline truncate max-w-[130px] text-[10px]" title={item.transaction_hash}>
                                        {item.transaction_hash}
                                      </p>
                                    </div>
                                  </td>

                                  {/* Registered At */}
                                  <td className="p-4 font-sans text-outline text-[11px]">
                                    {new Date(item.registered_at).toLocaleString([], {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })}
                                  </td>

                                  {/* Actions */}
                                  <td className="p-4 text-right font-sans">
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                      <button
                                        onClick={() => handleVerify(item.evidence_id)}
                                        className="rounded-lg border border-lime-500 bg-lime-500 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-lime-400"
                                        title="Verify cryptographic integrity against blockchain anchor"
                                      >
                                        Verify
                                      </button>

                                      <button
                                        onClick={() => handleViewProvenance(item.evidence_id)}
                                        className="rounded-lg border border-yellow-400 bg-yellow-400 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-yellow-300"
                                        title="View immutable provenance timeline"
                                      >
                                        Provenance
                                      </button>

                                      {item.is_tampered ? (
                                        <button
                                          onClick={() => handleRestore(item.evidence_id)}
                                          className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                                          title="Restore authentic state"
                                        >
                                          Restore
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleSimulateTamper(item.evidence_id)}
                                          className="rounded-lg border border-red-500 bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-400"
                                          title="Simulate 1-byte storage tampering to demonstrate mismatch detection"
                                        >
                                          Simulate Tamper
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. TAB 2: CHAIN OF CUSTODY & INGESTION PIPELINE */}
                {activeTab === "pipeline" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Knowledge Graph Verification Linkage */}
                    <section className="relative overflow-hidden rounded-xl border border-primary/20 bg-surface-container p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          <Database className="h-4 w-4 text-primary" />
                          Evidence Verification Linkage (Knowledge Graph Architecture)
                        </h2>
                        <span className="rounded border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-label-mono font-semibold text-primary">
                          Cypher Linked Node
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-6 py-6 text-center text-xs">
                        {/* Evidence Node */}
                        <div className="min-w-[180px] rounded-xl border border-primary/30 bg-primary/5 p-4">
                          <div className="flex items-center justify-center gap-1.5 font-bold text-primary">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            <span>(:Evidence)</span>
                          </div>
                          <div className="text-[11px] text-on-surface font-semibold mt-1 truncate max-w-[160px]">
                            {evidenceList[0]?.file_name || "CASE-101-FIR.pdf"}
                          </div>
                          <div className="text-[9px] text-outline mt-0.5">
                            ID: {evidenceList[0]?.evidence_id || "EV-101"}
                          </div>
                        </div>

                        {/* Connection Arrow */}
                        <div className="flex flex-col items-center">
                          <span className="mb-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                            -[:VERIFIED_BY]-&gt;
                          </span>
                          <span className="material-symbols-outlined text-primary text-[22px] animate-pulse">
                            arrow_forward
                          </span>
                        </div>

                        {/* Blockchain Record Node */}
                        <div className="min-w-[180px] rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                          <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-400">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <span>(:BlockchainRecord)</span>
                          </div>
                          <div className="text-[11px] text-on-surface font-mono font-semibold mt-1">
                            Block #{evidenceList[0]?.block_number || "104218"}
                          </div>
                          <div className="text-[9px] text-outline mt-0.5 truncate max-w-[160px]">
                            {evidenceList[0]?.transaction_hash?.substring(0, 16) || "0x892a4bc03e7d"}...
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Chain of Custody Pipeline Handover Stepper */}
                    <section className="space-y-4 rounded-xl border border-outline-variant bg-surface-container p-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                          <Layers className="w-4 h-4 text-primary" />
                          Chain of Custody Handover Log
                        </h3>
                        <span className="text-[11px] font-mono text-outline">5 Step Verification Audit</span>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-5 text-center font-mono text-xs pt-2">
                        {[
                          { step: 1, title: "Evidence Ingestion", actor: "Investigating Officer", icon: "upload_file" },
                          { step: 2, title: "SHA-256 Hashing", actor: "Web Crypto Subtle API", icon: "fingerprint" },
                          { step: 3, title: "Blockchain Anchor", actor: "Polygon Amoy EVM", icon: "lock" },
                          { step: 4, title: "Encrypted Vault", actor: "Evidence Custodian", icon: "security" },
                          { step: 5, title: "Court Audit", actor: "Judge & Forensic Analyst", icon: "verified" },
                        ].map((s) => (
                          <div
                            key={s.step}
                            className="space-y-2 rounded-xl border border-outline-variant bg-surface-container-high p-4 transition duration-150 hover:border-primary/40"
                          >
                            <div className="flex items-center justify-center w-7 h-7 mx-auto rounded-full bg-primary/15 text-primary border border-primary/30 font-bold text-xs">
                              {s.step}
                            </div>
                            <div className="text-on-surface font-bold text-xs">{s.title}</div>
                            <div className="text-[10px] text-outline font-sans">{s.actor}</div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Evidence Ingestion & Upload Box */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <form onSubmit={handleUploadIngestion} className="space-y-4 rounded-xl border border-outline-variant bg-surface-container p-6">
                        <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                          <Upload className="w-4 h-4 text-cyan-400" />
                          Upload New Investigation Evidence File
                        </h3>
                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="text-outline font-semibold text-[11px]">Filename</label>
                            <input
                              type="text"
                              value={newFile}
                              onChange={(e) => setNewFile(e.target.value)}
                              placeholder="e.g. suspect_call_record_q1.csv"
                              className="mt-1 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-xs outline-none focus:border-primary text-on-surface font-mono transition"
                            />
                          </div>
                          <div>
                            <label className="text-outline font-semibold text-[11px]">Evidence Type</label>
                            <select
                              value={fileType}
                              onChange={(e) => setFileType(e.target.value)}
                              className="mt-1 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-xs outline-none focus:border-primary text-on-surface transition"
                            >
                              <option>FIR</option>
                              <option>CDR</option>
                              <option>FINANCIAL</option>
                              <option>FORENSIC</option>
                              <option>CCTV</option>
                            </select>
                          </div>
                          <div className="flex justify-end pt-2">
                            <button
                              type="submit"
                              className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary hover:bg-primary/90 transition shadow-md shadow-primary/20"
                            >
                              Upload &amp; Generate SHA-256 Proof
                            </button>
                          </div>
                        </div>
                      </form>

                      {/* Ingested Files List */}
                      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
                        <div className="border-b border-outline-variant/60 bg-surface-container-high/40 p-4">
                          <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Ingested Evidence Files &amp; Pipeline Status
                          </h3>
                        </div>
                        <div className="divide-y divide-outline-variant/40 text-xs p-2 max-h-72 overflow-y-auto">
                          {evidenceFiles.map((f) => (
                            <div key={f.id} className="p-3.5 flex items-center justify-between hover:bg-surface-container-high/30 transition">
                              <div>
                                <div className="font-bold text-on-surface">{f.filename}</div>
                                <div className="text-outline text-[11px] font-mono">Type: {f.type}</div>
                              </div>
                              <span className="rounded-lg bg-primary/10 border border-primary/30 px-2.5 py-1 text-primary font-mono text-[11px] font-bold">
                                {f.status} ({f.progress}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. TAB 3: WEB3 & METAMASK PORTAL */}
                {activeTab === "web3" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <MetaMaskBar
                      contractAddress={contractAddress}
                      onContractAddressChange={setContractAddress}
                      onWalletConnected={(addr) => setWalletConnectedAddress(addr)}
                    />

                    {/* Zero-Gas Public Verification Section */}
                    <div className="space-y-6 rounded-xl border border-outline-variant bg-surface-container p-6 sm:p-8">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-base sm:text-lg font-bold text-on-surface">
                            Zero-Gas Smart Contract Public Verification
                          </h2>
                          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-label-mono font-bold uppercase text-primary">
                            0 Gas ($0.00 Free Eth_Call)
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1">
                          Calculates candidate file SHA-256 fingerprint in browser and executes view call (<code>eth_call</code>) directly against the deployed EvidenceRegistry smart contract.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-outline uppercase mb-1 font-mono">
                            Evidence ID to Audit
                          </label>
                          <input
                            type="text"
                            value={web3EvidenceId}
                            onChange={(e) => setWeb3EvidenceId(e.target.value)}
                            placeholder="e.g. EV-101"
                            className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-outline uppercase mb-1 font-mono">
                            Select Candidate Evidence File
                          </label>
                          <label className="flex items-center justify-center space-x-2 w-full py-5 px-4 rounded-xl border-2 border-dashed border-outline-variant/80 bg-surface-container-low hover:bg-surface-container cursor-pointer transition text-xs text-outline hover:text-on-surface hover:border-cyan-500/50">
                            <Upload className="w-5 h-5 text-cyan-400" />
                            <span className="font-medium">
                              {web3CandidateFile ? web3CandidateFile.name : "Choose candidate file to recalculate SHA-256 in browser"}
                            </span>
                            <input type="file" onChange={handleWeb3FileSelect} className="hidden" />
                          </label>
                        </div>

                        {web3IsHashing && (
                          <div className="text-xs text-cyan-400 flex items-center space-x-2 font-mono py-1">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Computing SHA-256 fingerprint via Web Crypto API...</span>
                          </div>
                        )}

                        {web3CandidateHash && (
                          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant text-xs font-mono space-y-1">
                            <span className="text-outline uppercase text-[10px] font-semibold">Candidate Computed SHA-256:</span>
                            <p className="text-cyan-400 break-all">{web3CandidateHash}</p>
                          </div>
                        )}

                        {web3Error && (
                          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{web3Error}</span>
                          </div>
                        )}

                        <button
                          onClick={handleRunWeb3Verification}
                          disabled={web3Verifying || !web3CandidateHash}
                          className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-900/30 disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                          {web3Verifying && <Loader2 className="w-4 h-4 animate-spin" />}
                          <span>
                            {web3Verifying
                              ? "Querying Smart Contract via eth_call..."
                              : "Run Zero-Gas On-Chain Verification"}
                          </span>
                        </button>
                      </div>

                      {/* Web3 Result Box */}
                      {web3Result && (
                        <div
                          className={`p-5 rounded-2xl border space-y-3 animate-in fade-in ${
                            web3Result.isValid
                              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.15)]"
                              : "bg-amber-950/40 border-amber-500/40 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.15)]"
                          }`}
                        >
                          <div className="flex items-start space-x-3.5">
                            {web3Result.isValid ? (
                              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <h3 className="font-bold text-sm">
                                {web3Result.isValid
                                  ? "✓ VERIFIED - CRYPTOGRAPHIC INTEGRITY CONFIRMED ON-CHAIN"
                                  : "⚠ POTENTIAL INTEGRITY MISMATCH DETECTED"}
                              </h3>
                              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                                {web3Result.isValid
                                  ? "The calculated SHA-256 fingerprint matches the immutable anchor stored in the smart contract on the blockchain."
                                  : "The calculated SHA-256 fingerprint does NOT match the registered anchor. The candidate file may have been modified or tampered with."}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-[11px] bg-surface-container-low/90 p-4 rounded-xl border border-outline-variant font-mono">
                            <div>
                              <span className="text-outline uppercase font-semibold">Registered Version:</span>
                              <span className="text-on-surface ml-2 font-bold">v{web3Result.version}</span>
                            </div>
                            <div>
                              <span className="text-outline uppercase font-semibold">Registered At:</span>
                              <span className="text-on-surface ml-2">
                                {new Date(web3Result.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-outline uppercase font-semibold">Registrar Wallet:</span>
                              <span className="text-cyan-300 ml-2 truncate block" title={web3Result.registeredBy}>
                                {web3Result.registeredBy}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CaseGate>
        </main>
      </div>

      {/* Modals */}
      <RegisterEvidenceModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={() => {
          refreshRecords();
          setIsRegisterOpen(false);
        }}
        defaultCaseId={selectedCaseId || "CASE-TR-102"}
        contractAddress={contractAddress}
        walletConnected={Boolean(walletConnectedAddress)}
      />

      <VerifyIntegrityModal
        isOpen={Boolean(verifyResult)}
        onClose={() => setVerifyResult(null)}
        result={verifyResult}
        onFlagForReview={(id) => {
          pushAudit(`[FLAGGED] Evidence ${id} flagged for urgent forensic review`, "SECURITY");
          alert(`Evidence ${id} has been flagged for immediate forensic inspection.`);
          setVerifyResult(null);
        }}
        onReverify={(updated) => {
          setVerifyResult(updated);
        }}
      />

      <ProvenanceTimelineModal
        isOpen={Boolean(provenanceData)}
        onClose={() => setProvenanceData(null)}
        data={provenanceData}
      />
    </div>
  );
}
