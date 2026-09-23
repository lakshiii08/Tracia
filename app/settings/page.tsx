"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";
import { useTheme, type ThemeMode, type AccentColor } from "@/components/ThemeProvider";

export default function SettingsPage() {
  const { theme, setTheme, accent, setAccent } = useTheme();
  const [compact, setCompact] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [saved, setSaved] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const save = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const themes: {
    id: ThemeMode;
    name: string;
    description: string;
    badge: string;
    bgPreview: string;
    cardPreview: string;
    accentPreview: string;
    textPreview: string;
  }[] = [
    {
      id: "default",
      name: "Default (Cyber Slate)",
      description: "TRACIA's signature dark tactical palette with deep slate surfaces and neon blue accents.",
      badge: "ORIGINAL",
      bgPreview: "#0f131c",
      cardPreview: "#1c1f29",
      accentPreview: "#adc7ff",
      textPreview: "#dfe2ef",
    },
    {
      id: "pure-black",
      name: "Pure Black (OLED Dark)",
      description: "100% pure pitch black (#000000) for zero backlight bleed, high contrast, and OLED displays.",
      badge: "PURE BLACK",
      bgPreview: "#000000",
      cardPreview: "#121212",
      accentPreview: "#60a5fa",
      textPreview: "#ffffff",
    },
    {
      id: "pure-white",
      name: "Pure White (High Contrast Light)",
      description: "100% crisp pure white (#FFFFFF) background for daylight clarity, reporting, and forensic review.",
      badge: "PURE WHITE",
      bgPreview: "#ffffff",
      cardPreview: "#f1f5f9",
      accentPreview: "#1d4ed8",
      textPreview: "#09090b",
    },
  ];

  const accentColors: {
    id: AccentColor;
    name: string;
    description: string;
    swatchColor: string;
  }[] = [
    {
      id: "blue",
      name: "Tactical Blue",
      description: "Default operational intelligence blue with crisp tactical contrast.",
      swatchColor: "#3b82f6",
    },
    {
      id: "red",
      name: "Crimson Red",
      description: "High-alert crimson red for critical findings, investigations, and high-risk flags.",
      swatchColor: "#ef4444",
    },
    {
      id: "yellow",
      name: "Amber Gold",
      description: "High-visibility tactical surveillance amber for alert monitoring and warnings.",
      swatchColor: "#f59e0b",
    },
    {
      id: "green",
      name: "Emerald Green",
      description: "Terminal cyber green aesthetic for verified evidence, telemetry, and forensics.",
      swatchColor: "#10b981",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      {/* Persistent Left Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title="System & Workspace Settings"
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
          {saved && (
            <div
              role="status"
              className="fixed right-5 top-20 z-50 rounded-lg border border-primary/30 bg-surface-container-high px-4 py-3 text-sm text-primary shadow-xl flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Settings saved locally.</span>
            </div>
          )}

          <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link href="/dashboard" className="text-sm text-primary hover:underline flex items-center gap-1">
                  ← Back to Dashboard
                </Link>
                <h1 className="mt-2 text-3xl font-bold">Workspace Settings</h1>
                <p className="mt-1 text-sm text-outline">
                  Configure visual theme modes, accent colors, session parameters, and workspace preferences.
                </p>
              </div>
              <Link
                href="/profile"
                className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2 text-sm hover:border-primary/50 transition flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">badge</span>
                <span>Operator Profile</span>
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <div className="space-y-6">
                {/* 1. Theme Selector Section */}
                <section className="rounded-xl border border-outline-variant bg-surface-container p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-base flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">palette</span>
                        <span>Appearance &amp; Theme Mode</span>
                      </h2>
                      <p className="mt-1 text-xs text-outline">
                        Select your preferred display theme. Changes apply immediately across all modules.
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 border border-primary/30 px-2.5 py-0.5 text-xs font-mono font-bold text-primary">
                      ACTIVE: {theme.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 pt-2">
                    {themes.map((t) => {
                      const isSelected = theme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTheme(t.id)}
                          className={`relative rounded-xl border p-4 text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? "border-primary ring-2 ring-primary/40 bg-surface-container-high shadow-lg"
                              : "border-outline-variant bg-surface-container-low hover:border-outline hover:bg-surface-container"
                          }`}
                        >
                          {/* Color Palette Preview Swatch */}
                          <div
                            className="h-16 w-full rounded-lg mb-3 p-2.5 flex flex-col justify-between border border-white/10"
                            style={{ backgroundColor: t.bgPreview }}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className="h-3 w-8 rounded"
                                style={{ backgroundColor: t.accentPreview }}
                              />
                              <span
                                className="text-[10px] font-mono font-bold"
                                style={{ color: t.textPreview }}
                              >
                                {t.badge}
                              </span>
                            </div>
                            <div
                              className="h-4 w-full rounded p-1 flex items-center"
                              style={{ backgroundColor: t.cardPreview }}
                            >
                              <span
                                className="h-1.5 w-12 rounded"
                                style={{ backgroundColor: t.accentPreview }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold text-xs text-on-surface">{t.name}</h3>
                              {isSelected && (
                                <span className="material-symbols-outlined text-primary text-[18px]">
                                  check_circle
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 text-[11px] text-outline leading-relaxed">
                              {t.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* 2. Accent Color Selector Section */}
                <section className="rounded-xl border border-outline-variant bg-surface-container p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-base flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">brush</span>
                        <span>Accent Color</span>
                      </h2>
                      <p className="mt-1 text-xs text-outline">
                        Select your primary UI accent color for active buttons, indicators, tabs, and focus highlights.
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 border border-primary/30 px-2.5 py-0.5 text-xs font-mono font-bold text-primary uppercase">
                      ACCENT: {accent}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2">
                    {accentColors.map((c) => {
                      const isSelected = accent === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setAccent(c.id)}
                          className={`relative rounded-xl border p-4 text-left transition-all flex flex-col justify-between group ${
                            isSelected
                              ? "border-primary ring-2 ring-primary/40 bg-surface-container-high shadow-lg"
                              : "border-outline-variant bg-surface-container-low hover:border-outline hover:bg-surface-container"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-5 w-5 rounded-full border border-white/20 shadow-sm shrink-0"
                                  style={{ backgroundColor: c.swatchColor }}
                                />
                                <h3 className="font-bold text-xs text-on-surface">{c.name}</h3>
                              </div>
                              {isSelected ? (
                                <span className="material-symbols-outlined text-primary text-[18px]">
                                  check_circle
                                </span>
                              ) : (
                                <span className="h-4 w-4 rounded-full border border-outline-variant group-hover:border-outline transition" />
                              )}
                            </div>

                            <div
                              className="h-1.5 w-full rounded-full mb-3"
                              style={{ backgroundColor: c.swatchColor }}
                            />

                            <p className="text-[11px] text-outline leading-relaxed">
                              {c.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* 3. Workspace Density & Preferences */}
                <section className="rounded-xl border border-outline-variant bg-surface-container p-6">
                  <h2 className="font-bold text-base flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                    <span>Workspace Preferences</span>
                  </h2>
                  <div className="mt-4 divide-y divide-outline-variant/40">
                    <Toggle
                      label="Compact Density Grid"
                      description="Reduce cell padding in CDR tables and relationship lists for high-density analysis."
                      checked={compact}
                      onChange={setCompact}
                    />
                    <Toggle
                      label="Auto-Save Form Drafts"
                      description="Persist unfinished case notes and form state automatically."
                      checked={autoSave}
                      onChange={setAutoSave}
                    />
                  </div>
                </section>

                {/* 4. Session Settings */}
                <section className="rounded-xl border border-outline-variant bg-surface-container p-6">
                  <h2 className="font-bold text-base flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">timer</span>
                    <span>Session &amp; Security</span>
                  </h2>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-on-surface-variant">
                      Inactivity Lock Timeout
                    </label>
                    <select
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-xs outline-none focus:border-primary sm:max-w-xs"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes (Recommended)</option>
                      <option value="60">60 minutes</option>
                      <option value="120">2 hours</option>
                    </select>
                    <p className="mt-1.5 text-[11px] text-outline">
                      Terminal will automatically lock and require operator cipher entry after inactivity.
                    </p>
                  </div>
                </section>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={save}
                    className="rounded-lg bg-primary px-6 py-2.5 text-xs font-bold text-on-primary hover:bg-primary-container transition shadow-sm"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>

              {/* Aside summary */}
              <aside className="h-fit rounded-xl border border-outline-variant bg-surface-container p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-sm">System &amp; Environment</h3>
                  <p className="text-xs text-outline mt-0.5">Active client session</p>
                </div>
                <div className="space-y-2 text-xs">
                  <Status label="Active Theme" value={theme.toUpperCase()} />
                  <Status label="Accent Color" value={accent.toUpperCase()} />
                  <Status label="Environment" value="Production" />
                  <Status label="Gateway Link" value="Active (TLS 1.3)" />
                  <Status label="Session Timeout" value={`${sessionTimeout}m`} />
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div>
        <p className="text-xs font-bold text-on-surface">{label}</p>
        <p className="mt-0.5 text-[11px] text-outline">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-10 shrink-0 rounded-full transition ${
          checked ? "bg-primary" : "bg-outline/30"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition shadow-sm ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
      <span className="text-outline text-[11px]">{label}</span>
      <span className="font-mono text-xs font-bold text-primary">{value}</span>
    </div>
  );
}
