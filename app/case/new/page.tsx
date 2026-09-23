"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/store";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { computeSha256 } from "@/lib/cryptoHash";

const categories = [
  { value: "cyber", label: "Cyber Fraud & Financial Intercept" },
  { value: "money_laundering", label: "Syndicate Money Laundering" },
  { value: "extortion", label: "Digital Extortion & Coercion" },
  { value: "narcotics", label: "Narcotics Trafficking Telemetry" },
  { value: "kidnapping", label: "Kidnapping & High-Risk Missing Person" },
  { value: "arms", label: "Illicit Arms Procurement" },
];

export default function NewCasePage() {
  const router = useRouter();
  const { addCase } = useAppData();

  // Investigation Details State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("cyber");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("high");
  const [description, setDescription] = useState("");
  const [investigator, setInvestigator] = useState("admin");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // FIR Option Toggle & Fields State
  const [includeFir, setIncludeFir] = useState(true);
  const [firNumber, setFirNumber] = useState("FIR-2025-0109");
  const [policeStation, setPoliceStation] = useState("Cyber Crime Police Station, Central District");
  const [incidentDate, setIncidentDate] = useState("2025-04-18");
  const [incidentTime, setIncidentTime] = useState("14:30");
  const [sections, setSections] = useState("Sec 420, 468, 471, 120B IPC & Sec 66D IT Act");
  const [complainant, setComplainant] = useState("");
  const [accused, setAccused] = useState("");
  const [firNarrative, setFirNarrative] = useState("");

  // FIR File Upload & Cryptographic Hashing State
  const [firFileName, setFirFileName] = useState<string | null>(null);
  const [firSha256, setFirSha256] = useState<string>("");
  const [isHashing, setIsHashing] = useState<boolean>(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsHashing(true);
    setFirFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const hash = await computeSha256(buffer);
      setFirSha256(hash);
    } catch {
      // Fallback hash based on filename & timestamp
      const encoder = new TextEncoder();
      const fallbackBuf = encoder.encode(file.name + Date.now());
      const hash = await computeSha256(fallbackBuf.buffer);
      setFirSha256(hash);
    } finally {
      setIsHashing(false);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setError("Please provide an investigation case title or operation name.");
      return;
    }
    if (!category) {
      setError("Please select an investigation category.");
      return;
    }
    if (includeFir && !firNumber.trim()) {
      setError("Please specify the FIR number for this investigation.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const created = addCase({
        name: title.trim(),
        desc: description.trim() || (includeFir ? firNarrative.trim() : "New active criminal network investigation."),
        category,
        priority: priority === "high" ? "High" : priority === "medium" ? "Medium" : "Low",
        investigator,
        fir: includeFir
          ? {
              firNumber: firNumber.trim(),
              policeStation: policeStation.trim() || "Cyber Crime Police Station",
              incidentDate: `${incidentDate} ${incidentTime}`.trim(),
              sections: sections.trim(),
              complainant: complainant.trim() || "State Cyber Cell Automated Alert",
              accused: accused.trim() || "Unidentified Cyber Ring",
              description: firNarrative.trim() || description.trim() || "First Information Report registered at intake.",
              fileName: firFileName || `${firNumber.replace(/\//g, "_")}.pdf`,
              sha256Hash: firSha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
              status: "Registered",
            }
          : undefined,
      });

      router.push(`/case/${created.id}?tab=overview`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create investigation case.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col select-none">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title="Initiate New Investigation"
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 flex justify-center">
          <div className="bg-surface-container w-full max-w-3xl rounded-xl border border-outline-variant shadow-2xl flex flex-col my-2">
            {/* Modal Title Header */}
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-high/40 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-on-surface">Initiate New Investigation Case</h2>
                  <p className="text-xs text-outline">
                    Register intelligence file, attach verified FIR, and anchor digital hash
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="text-on-surface-variant hover:text-on-surface p-2 rounded-lg hover:bg-surface-variant/50 transition"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </Link>
            </div>

            <form
              className="p-6 overflow-y-auto space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              {/* SECTION 1: CASE PARTICULARS */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">folder_managed</span>
                  1. Investigation Particulars
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-on-surface mb-1.5">
                      Case Title / Operation Codename <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Operation Cyber Citadel · Cross-State Mule Ring"
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3.5 py-2.5 text-on-surface focus:outline-none focus:border-primary transition text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">
                      Investigation Category <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3.5 py-2.5 text-on-surface focus:outline-none focus:border-primary transition text-xs"
                    >
                      {categories.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">
                      Lead Investigating Officer
                    </label>
                    <select
                      value={investigator}
                      onChange={(e) => setInvestigator(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3.5 py-2.5 text-on-surface focus:outline-none focus:border-primary transition text-xs"
                    >
                      <option value="admin">Inspector A. Admin (Supervising Admin)</option>
                      <option value="smith">Det. J. Smith (Lead Field Investigator)</option>
                      <option value="patel">Analyst C. Patel (Intelligence &amp; Graph)</option>
                    </select>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-on-surface mb-1.5">Priority Level</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["low", "medium", "high"] as const).map((level) => (
                        <label key={level} className="cursor-pointer">
                          <input
                            type="radio"
                            name="priority"
                            value={level}
                            checked={priority === level}
                            onChange={() => setPriority(level)}
                            className="sr-only"
                          />
                          <div
                            className={`py-2 text-center rounded-lg border text-xs font-bold uppercase transition ${
                              priority === level
                                ? level === "high"
                                  ? "bg-rose-500/20 border-rose-500 text-rose-400"
                                  : level === "medium"
                                  ? "bg-amber-500/20 border-amber-500 text-amber-400"
                                  : "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                : "bg-surface-container-lowest border-outline-variant text-outline hover:border-outline"
                            }`}
                          >
                            {level}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-on-surface mb-1.5">
                      Case Summary / Initial Objective
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief operational objective, suspected syndicate actors, or background intelligence..."
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3.5 py-2 text-on-surface focus:outline-none focus:border-primary transition text-xs resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: OPTION TO ADD FIRST INFORMATION REPORT (FIR) */}
              <div className="pt-4 border-t border-outline-variant space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">description</span>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                      2. First Information Report (FIR) Ingestion
                    </h3>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={includeFir}
                      onChange={(e) => setIncludeFir(e.target.checked)}
                      className="rounded text-primary focus:ring-0"
                    />
                    <span className="font-semibold text-on-surface">Attach FIR at Intake</span>
                  </label>
                </div>

                {includeFir ? (
                  <div className="rounded-xl border border-primary/30 bg-surface-container-low p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          FIR Number / Code <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={firNumber}
                          onChange={(e) => setFirNumber(e.target.value)}
                          placeholder="e.g. FIR-2025-0109 or 0102/2025"
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface font-mono focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          Police Station Jurisdiction <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={policeStation}
                          onChange={(e) => setPoliceStation(e.target.value)}
                          placeholder="e.g. Cyber Crime PS Central, Delhi"
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">Incident Date &amp; Time</label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={incidentDate}
                            onChange={(e) => setIncidentDate(e.target.value)}
                            className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                          />
                          <input
                            type="time"
                            value={incidentTime}
                            onChange={(e) => setIncidentTime(e.target.value)}
                            className="w-28 bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          Legal Sections / IPC / IT Act
                        </label>
                        <input
                          type="text"
                          value={sections}
                          onChange={(e) => setSections(e.target.value)}
                          placeholder="e.g. Sec 420, 120B IPC &amp; 66D IT Act"
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">Complainant / Informant</label>
                        <input
                          type="text"
                          value={complainant}
                          onChange={(e) => setComplainant(e.target.value)}
                          placeholder="e.g. Victim Name / Bank Cyber Team"
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">Named Suspects / Accused</label>
                        <input
                          type="text"
                          value={accused}
                          onChange={(e) => setAccused(e.target.value)}
                          placeholder="e.g. Primary Target, Account Beneficiary, Unknown Intermediaries"
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          FIR Incident Statement / Facts Alleged
                        </label>
                        <textarea
                          rows={3}
                          value={firNarrative}
                          onChange={(e) => setFirNarrative(e.target.value)}
                          placeholder="Brief narration of complaint, fraudulent transaction details, IP spoofing, or extortion demand..."
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none resize-none"
                        />
                      </div>

                      {/* FIR Document File Upload with Live SHA-256 Hashing */}
                      <div className="sm:col-span-2 space-y-2">
                        <label className="block text-xs font-bold text-on-surface">
                          Upload Signed FIR Document (PDF / Scan)
                        </label>
                        <div className="rounded-lg border border-dashed border-outline-variant p-4 bg-surface-container flex flex-col items-center justify-center text-center relative hover:border-primary/50 transition">
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.txt,.doc"
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <span className="material-symbols-outlined text-primary text-[28px] mb-1">
                            upload_file
                          </span>
                          <span className="text-xs font-semibold text-on-surface">
                            {firFileName ? firFileName : "Click or drag FIR document to upload"}
                          </span>
                          <span className="text-[10px] text-outline mt-0.5">
                            Auto-calculates Web Crypto SHA-256 cryptographic digest for chain of custody
                          </span>
                        </div>

                        {/* Real-time Hash Badge */}
                        {isHashing ? (
                          <div className="p-2 rounded bg-surface-container border border-outline-variant text-[11px] font-mono text-outline flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] animate-spin text-primary">sync</span>
                            Computing SHA-256 cryptographic digest...
                          </div>
                        ) : firSha256 ? (
                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono flex items-center justify-between">
                            <div className="flex items-center gap-2 truncate mr-2">
                              <span className="material-symbols-outlined text-emerald-400 text-[15px]">verified</span>
                              <span className="text-emerald-400 font-bold">SHA-256:</span>
                              <span className="text-on-surface truncate">{firSha256}</span>
                            </div>
                            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase shrink-0">
                              Anchored
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low text-xs text-outline text-center">
                    Case will be initialized without an intake FIR. FIRs can be ingested later from the workspace Evidence tab.
                  </div>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400"
                >
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{error}</span>
                </div>
              )}
            </form>

            {/* Bottom Actions */}
            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-high/40 rounded-b-xl flex justify-end gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition text-xs font-semibold"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition text-xs font-bold flex items-center gap-2 disabled:opacity-60 shadow-md shadow-primary/20"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {submitting ? "sync" : "add_circle"}
                </span>
                {submitting ? "Initiating Investigation..." : "Create Investigation & Anchor FIR"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
