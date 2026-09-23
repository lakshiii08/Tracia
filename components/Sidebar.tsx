"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAppData } from "@/lib/store";
import { useAuthorization } from "@/auth/useAuthorization";
import { useTheme } from "@/components/ThemeProvider";
import type { Permission } from "@/types/accessControl";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  activeWorkspaceTab?: string;
  onSelectWorkspaceTab?: (tab: string) => void;
}

type WorkspaceTabItem = {
  id: string;
  label: string;
  icon: string;
  href?: string;
};

export default function Sidebar({
  isOpen = false,
  onClose,
  activeWorkspaceTab,
  onSelectWorkspaceTab,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { cases, selectedCase, selectCase } = useAppData();
  const { currentUser, hasPermission } = useAuthorization();
  const { theme } = useTheme();
  const [caseDropdownOpen, setCaseDropdownOpen] = useState(false);

  const caseHref = selectedCase ? `/case/${selectedCase.id}` : "/case/TR-102";
  const isCasePage = pathname.startsWith("/case/");

  const workspaceTabs: WorkspaceTabItem[] = [
    { id: "overview", label: "Overview & Intelligence Matrix", icon: "dashboard" },
    { id: "persons", label: "Persons & Entities", icon: "group" },
    { id: "evidence", label: "Evidence & Ingested FIRs", icon: "folder" },
    { id: "cdr", label: "CDR & Telemetry Analysis", icon: "call" },
    { id: "timeline", label: "Timeline Intelligence", icon: "timeline" },
    { id: "graph", label: "Neo4j Knowledge Graph", icon: "hub", href: "/graph" },
    { id: "maps", label: "Spatial Maps (AI Pinpoints)", icon: "map" },
    { id: "cyber", label: "Cyber Threat Telemetry", icon: "security" },
    { id: "analytics", label: "Graph Analytics & Inference", icon: "insights" },
    { id: "custody", label: "Chain of Custody & File Hashing", icon: "verified" },
    { id: "ai", label: "13-Stage AI Pipeline", icon: "smart_toy" },
  ];

  const systemModules = [
    { id: "directory", href: "/dashboard", icon: "folder_managed", label: "Case Directory", requiresCase: false },
    { id: "copilot", href: "/copilot", icon: "smart_toy", label: "Intelligence Copilot (GraphRAG)", requiresCase: false },
    { id: "entity-resolution", href: "/entity-resolution", icon: "group_add", label: "Entity Resolution Queue", requiresCase: true },
    { id: "audit-log", href: "/audit-log", icon: "history", label: "Audit & Security Logs", requiresCase: true, requiredPermission: "audit.view" as Permission },
    { id: "report", href: "/report", icon: "description", label: "Forensic Reports", requiresCase: false },
    { id: "settings", href: "/settings", icon: "settings", label: "Platform Settings", requiresCase: false },
  ];

  const handleSelectTab = (tab: WorkspaceTabItem) => {
    if (tab.href) {
      router.push(tab.href);
      onClose?.();
      return;
    }

    if (onSelectWorkspaceTab) {
      onSelectWorkspaceTab(tab.id);
    } else {
      router.push(`${caseHref}?tab=${tab.id}`);
    }
    onClose?.();
  };

  const handleNavigate = (href: string) => {
    router.push(href);
    onClose?.();
  };

  const logout = async () => {
    onClose?.();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
    }
  };

  const canCreateCase = currentUser.role === "ADMIN" || currentUser.role === "INVESTIGATING_OFFICER";

  return (
    <>
      {/* 1. Backdrop Overlay (Visible when isOpen is true) */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      />

      {/* 2. Slide-out Navigation Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-surface-container-lowest text-on-surface z-50 border-r border-outline-variant shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out select-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Tactical Navigation Drawer"
      >
        {/* Top Header: Branding & Close Button */}
        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3.5 shrink-0 bg-surface-container-low/40">
          <Link
            href="/dashboard"
            onClick={() => onClose?.()}
            className="relative flex h-8 w-36 items-center"
          >
            <Image
              src={theme === "pure-white" ? "/assets/TRACIA_dashboard_white.jpeg" : "/assets/TRACIA_dashboard_black.png"}
              alt="TRACIA platform"
              fill
              sizes="144px"
              className="object-contain object-left"
            />
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1" title="Cluster Connected" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface transition flex items-center justify-center"
              title="Close navigation"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Operator Profile Badge */}
        <div className="border-b border-outline-variant bg-surface-container-low/20 p-3 shrink-0">
          <Link
            href="/profile"
            onClick={() => onClose?.()}
            className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-surface-container transition"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-bold text-primary border border-primary/20">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-on-surface">{currentUser.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="rounded bg-primary/10 px-1.5 py-0.2 font-mono text-[9px] font-bold text-primary border border-primary/20">
                  {currentUser.role === "INVESTIGATING_OFFICER"
                    ? "INVESTIGATOR"
                    : currentUser.role === "INTELLIGENCE_OFFICER"
                    ? "ANALYST"
                    : currentUser.role}
                </span>
                <span className="text-[9px] font-mono text-outline">{currentUser.clearanceLevel || "L04"}</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Active Case Selector & New Investigation */}
        <div className="p-3 border-b border-outline-variant space-y-2 shrink-0">
          <div className="relative">
            <button
              onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}
              className={`w-full flex items-center justify-between rounded-lg border p-2 text-xs transition ${
                selectedCase
                  ? "border-primary/40 bg-primary/10 text-on-surface hover:bg-primary/20"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-1">
                <span className="material-symbols-outlined text-[17px] text-primary shrink-0">
                  {selectedCase ? "folder_open" : "warning"}
                </span>
                <div className="text-left min-w-0">
                  <div className="text-[9px] uppercase font-mono font-bold text-outline">
                    {selectedCase ? "Active Investigation" : "No Case Selected"}
                  </div>
                  <div className="truncate font-bold text-xs">
                    {selectedCase ? `${selectedCase.id}: ${selectedCase.name}` : "Select Active Case"}
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-[16px] text-outline shrink-0">arrow_drop_down</span>
            </button>

            {caseDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-outline-variant bg-surface-container-high p-2 shadow-2xl z-50 space-y-1 max-h-56 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-mono text-outline uppercase font-bold border-b border-outline-variant/40 mb-1">
                  Select Case File:
                </div>
                {cases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      selectCase(c.id);
                      setCaseDropdownOpen(false);
                      if (isCasePage) {
                        router.push(`/case/${c.id}`);
                      }
                      onClose?.();
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition flex items-center justify-between ${
                      selectedCase?.id === c.id
                        ? "bg-primary/20 text-primary font-bold"
                        : "hover:bg-surface-variant text-on-surface"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold truncate">{c.id} - {c.name}</div>
                      <div className="text-[10px] text-on-surface-variant truncate">{c.desc}</div>
                    </div>
                    {selectedCase?.id === c.id && (
                      <span className="material-symbols-outlined text-primary text-[16px] shrink-0">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {canCreateCase && (
            <button
              onClick={() => handleNavigate("/case/new")}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary py-1.5 text-xs font-bold text-on-primary hover:bg-primary/90 transition shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              New Investigation (Add FIR)
            </button>
          )}
        </div>

        {/* Scrollable Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {/* Section 1: Workspace Tabs (Active Investigation) */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-outline flex items-center justify-between">
              <span>Workspace Tabs</span>
              <span className="text-[9px] text-primary font-bold">
                {selectedCase ? selectedCase.id : "TR-102"}
              </span>
            </div>
            <div className="space-y-0.5">
              {workspaceTabs.map((tab) => {
                const isActive = tab.href ? pathname === tab.href : isCasePage && activeWorkspaceTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectTab(tab)}
                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition text-left ${
                      isActive
                        ? "bg-primary/15 font-bold text-primary border-l-2 border-primary"
                        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`material-symbols-outlined text-[17px] shrink-0 ${
                          isActive ? "text-primary" : "text-outline"
                        }`}
                      >
                        {tab.icon}
                      </span>
                      <span className="truncate">{tab.label}</span>
                    </div>
                    {isActive && (
                      <span className="material-symbols-outlined text-[14px] text-primary shrink-0">
                        arrow_forward_ios
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Global Modules */}
          <div className="pt-2 border-t border-outline-variant/50">
            <div className="px-2 pb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-outline">
              System Modules
            </div>
            <div className="space-y-0.5">
              {systemModules.map((item) => {
                const isPermitted = !item.requiredPermission || hasPermission(item.requiredPermission);
                const isActive = pathname === item.href;

                if (!isPermitted) return null;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.href)}
                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition text-left ${
                      isActive
                        ? "bg-primary/15 font-bold text-primary border-l-2 border-primary"
                        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="material-symbols-outlined text-[17px] text-outline shrink-0">
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Bottom Utility Controls */}
        <div className="border-t border-outline-variant p-2.5 space-y-0.5 shrink-0 bg-surface-container-low/30">
          <button
            onClick={() => handleNavigate("/alerts")}
            className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[17px] text-amber-400">notifications</span>
              <span>Alerts &amp; Telemetry Feed</span>
            </div>
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[17px]">logout</span>
              <span className="font-semibold">Sign Out</span>
            </div>
            <span className="material-symbols-outlined text-[13px]">chevron_right</span>
          </button>
        </div>
      </aside>
    </>
  );
}
