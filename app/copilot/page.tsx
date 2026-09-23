"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useRef } from "react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { useAppData } from "@/lib/store";
import { getCopilotInitialMessages, getCopilotStatus, queryCopilot, type CopilotStatus } from "@/services/api/copilot";
import type { CopilotMessage } from "@/types/copilot";

const QUICK_PROMPTS = [
  "Identify all connected phone numbers and entities",
  "Who are the high risk syndicate targets?",
  "Investigate shell company XYZ Logistics and wire accounts",
  "Summarize active criminal network cases and registered FIRs",
  "Show location connections for Mumbai and Delhi",
];

export default function CopilotPage() {
  const { selectedCase, cases, selectCase } = useAppData();
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [copilotStatus, setCopilotStatus] = useState<CopilotStatus | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const activeCaseRef = useRef<string | null>(null);
  const selectedCaseId = selectedCase?.id || null;
  const selectedCaseName = selectedCase?.name || "";

  useEffect(() => {
    activeCaseRef.current = selectedCaseId;
    setIsThinking(false);
    getCopilotStatus().then(setCopilotStatus).catch(() => setCopilotStatus(null));
    getCopilotInitialMessages().then((initialMessages) => {
      if (activeCaseRef.current !== selectedCaseId) return;
      const contextMessage: CopilotMessage = {
        role: "assistant",
        intent: "Case Context",
        text: selectedCaseId
          ? `Case context changed to ${selectedCaseId}: ${selectedCaseName}. I will answer using this investigation's graph, map, and evidence context.`
          : "Global Network Mode active. I will answer across the available investigation graph.",
      };
      setMessages([contextMessage, ...initialMessages.slice(1)]);
    });
  }, [selectedCaseId, selectedCaseName]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const sendPrompt = async (promptText: string) => {
    const prompt = promptText.trim();
    if (!prompt) return;

    const userMsg: CopilotMessage = { role: "user", text: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    try {
      const requestCaseId = selectedCase?.id || null;
      const res = await queryCopilot(prompt, requestCaseId || undefined);
      if (activeCaseRef.current !== requestCaseId) return;
      const assistantMsg: CopilotMessage = {
        role: "assistant",
        text: res.text,
        intent: res.intent,
        supportingPaths: res.supportingPaths,
        sources: res.sources,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: CopilotMessage = {
        role: "assistant",
        text: "Failed to query Copilot reasoning service. Please check network connectivity or backend availability.",
      };
      if (activeCaseRef.current !== (selectedCase?.id || null)) return;
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      if (activeCaseRef.current === (selectedCase?.id || null)) {
        setIsThinking(false);
      }
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendPrompt(input);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex select-none">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title="Intelligence Copilot"
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <main className="min-w-0 flex-1 flex flex-col p-4 lg:p-6">
          <div className="mx-auto max-w-4xl w-full flex-1 flex flex-col space-y-4">
            {/* Header & Case Context Selector */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-outline-variant/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">smart_toy</span>
                  <h1 className="text-lg font-bold text-on-surface">Criminal Network Copilot &amp; GraphRAG</h1>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {copilotStatus?.ai?.openaiConfigured
                    ? `OpenAI ${copilotStatus.ai.model} is connected to TRACIA evidence, CDR, FIR, and Neo4j context.`
                    : "Evidence AI mode is using TRACIA records, CDR, FIR, and Neo4j context until OpenAI credentials are configured."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {cases.length > 0 ? (
                  <select
                    value={selectedCase?.id || ""}
                    onChange={(e) => selectCase(e.target.value || null)}
                    className="bg-surface-container-high border border-outline-variant rounded-lg px-2.5 py-1 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                  >
                    <option value="">Global Network Mode</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        Case {c.id}: {c.name.substring(0, 24)}...
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-[11px] font-mono px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                    Live Neo4j Cluster Mode
                  </span>
                )}
              </div>
            </div>

            {/* Quick Prompt Suggestion Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-mono uppercase text-outline shrink-0 mr-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">bolt</span> Inquire:
              </span>
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => sendPrompt(qp)}
                  disabled={isThinking}
                  className="shrink-0 px-2.5 py-1 rounded-full border border-outline-variant bg-surface-container hover:border-primary hover:text-primary transition text-[11px] text-on-surface disabled:opacity-50"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Chat Conversation Area */}
            <div className="flex-1 rounded-xl border border-outline-variant bg-surface-container p-4 overflow-y-auto space-y-4 min-h-[420px] max-h-[620px]">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-2xl rounded-xl p-3.5 text-xs leading-relaxed space-y-2.5 shadow-sm ${
                      m.role === "user"
                        ? "bg-primary text-on-primary font-medium"
                        : "bg-surface-container-low border border-outline-variant text-on-surface"
                    }`}
                  >
                    {m.intent && (
                      <div className="flex items-center gap-1.5 pb-1 border-b border-outline-variant/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] font-mono text-primary uppercase tracking-wide">
                          {m.intent}
                        </span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                    {m.supportingPaths && m.supportingPaths.length > 0 && (
                      <div className="pt-2 border-t border-outline-variant/40 space-y-1">
                        <div className="text-[10px] font-mono text-outline uppercase tracking-wider">
                          Neo4j Graph Traversal Paths:
                        </div>
                        <div className="space-y-0.5 font-mono text-[11px] text-on-surface-variant bg-surface-container/60 p-2 rounded border border-outline-variant/40">
                          {m.supportingPaths.map((pStr, pIdx) => (
                            <div key={pIdx} className="truncate">↳ {pStr}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {m.sources && m.sources.length > 0 && (
                      <div className="text-[10px] font-mono text-outline/80 pt-1">
                        Sources: {m.sources.join(" · ")}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex flex-col items-start">
                  <div className="max-w-2xl rounded-xl p-3 text-xs bg-surface-container-low border border-outline-variant text-on-surface flex items-center gap-2.5 shadow-sm">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    <span className="text-outline font-mono">
                      Thinking through the investigation context...
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Console */}
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about suspects, phone intercepts, accounts, shell companies, or FIR facts..."
                className="flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-xs outline-none focus:border-primary transition"
              />
              <button
                type="submit"
                disabled={isThinking || !input.trim()}
                className="rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-on-primary flex items-center gap-1.5 disabled:opacity-50 hover:bg-primary-container transition shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">send</span> Send
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
