"use client";

import React, { useState, useRef, useEffect } from "react";
import { getCopilotStatus, queryCopilot, type CopilotStatus } from "@/services/api/copilot";
import type { CopilotMessage } from "@/types/copilot";

interface CaseCopilotWidgetProps {
  caseId: string;
  caseName?: string;
}

export default function CaseCopilotWidget({ caseId, caseName }: CaseCopilotWidgetProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      role: "assistant",
      text: `Tactical Intelligence Copilot initialized for Case ${caseId}${caseName ? ` (${caseName})` : ""}. Ask about identified targets, linked phone lines, banking endpoints, or spatial intelligence.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [status, setStatus] = useState<CopilotStatus | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCopilotStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const quickPrompts = [
    `Summarize intelligence for Case ${caseId}`,
    "Identify high-risk targets and linked phones",
    "Trace front company and wire transfers",
    "Summarize verified links and evidence",
  ];

  const handleSendPrompt = async (promptText: string) => {
    const prompt = promptText.trim();
    if (!prompt) return;

    setMessages((prev) => [...prev, { role: "user", text: prompt }]);
    setInput("");
    setIsThinking(true);

    try {
      const res = await queryCopilot(prompt, caseId);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.text,
          intent: res.intent,
          supportingPaths: res.supportingPaths,
          sources: res.sources,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Intelligence Copilot connection timed out or remote API unavailable.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container overflow-hidden shadow-sm flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-outline-variant bg-surface-container-high/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-on-surface">Case Intelligence Copilot (GraphRAG &amp; Spatial AI)</h3>
            <p className="text-[11px] text-on-surface-variant">
              Contextual reasoning for Case <span className="font-mono font-bold text-primary">{caseId}</span>
            </p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {status?.ai?.openaiConfigured ? `OpenAI ${status.ai.model}` : "Evidence AI Mode"}
        </span>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 border-b border-outline-variant/60 bg-surface-container-low flex flex-wrap gap-1.5">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendPrompt(qp)}
            disabled={isThinking}
            className="px-2.5 py-1 rounded-full border border-outline-variant bg-surface-container text-[11px] hover:border-primary hover:text-primary transition disabled:opacity-50 text-on-surface"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-2xl rounded-xl p-3 text-xs leading-relaxed space-y-2 ${
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
                    Neo4j Traversal Paths:
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
            <div className="rounded-xl p-3 text-xs bg-surface-container-low border border-outline-variant text-on-surface flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <span className="text-outline font-mono text-[11px]">
                Thinking through the case context...
              </span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendPrompt(input);
        }}
        className="p-3 border-t border-outline-variant bg-surface-container-high/30 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Inquire about targets, phones, or evidence in Case ${caseId}...`}
          className="flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-xs outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={isThinking || !input.trim()}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container disabled:opacity-50 transition flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[15px]">send</span>
          Send
        </button>
      </form>
    </div>
  );
}
