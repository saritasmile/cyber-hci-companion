"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RabbitResult {
  summary: string;
  analyst_note: string;
  hci_note: string;
  related: string[];
  rabbit: string;
}

interface TrailEntry {
  keyword: string;
  result: RabbitResult;
}

const MAX_TRAIL = 8;

// ── UI Primitives ─────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#161412] border border-[#2a2520] rounded-lg p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children, color = "#9d9080" }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className="text-[9px] uppercase tracking-[0.25em] mb-2"
      style={{ fontFamily: "var(--font-mono)", color }}
    >
      {children}
    </p>
  );
}

function StreamingIndicator({ accent }: { accent: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-2">
        <span className="inline-flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{ backgroundColor: accent, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.2em] text-[#9d9080]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Exploring…
        </span>
      </div>
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#161412] border border-[#2a2520] rounded-lg p-5">
            <div className="h-2 w-16 rounded mb-3" style={{ backgroundColor: accent + "30" }} />
            <div className="space-y-2">
              <div className="h-3 bg-[#2a2520] rounded w-full" />
              <div className="h-3 bg-[#2a2520] rounded w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RabbitPage() {
  const [inputValue, setInputValue] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [trail, setTrail] = useState<TrailEntry[]>([]);
  const [current, setCurrent] = useState<TrailEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function explore(keyword: string) {
    if (!keyword.trim() || streaming) return;
    const kw = keyword.trim();

    setStreaming(true);
    setError(null);

    try {
      const res = await fetch("/api/rabbit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }

      const jsonText = accumulated
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

      const parsed = JSON.parse(jsonText) as RabbitResult;
      const entry: TrailEntry = { keyword: kw, result: parsed };

      setCurrent(entry);
      setTrail((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_TRAIL ? next.slice(next.length - MAX_TRAIL) : next;
      });

      // Record to knowledge map (fire-and-forget)
      recordKnowledgeMapEntry(kw);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Exploration failed. Please try again.");
    } finally {
      setStreaming(false);
    }
  }

  async function recordKnowledgeMapEntry(keyword: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from("knowledge_map_entries")
        .select("id, visit_count")
        .eq("user_id", user.id)
        .eq("topic", keyword)
        .eq("module", "rabbit")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("knowledge_map_entries")
          .update({ visit_count: existing.visit_count + 1, last_visited: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("knowledge_map_entries").insert({
          user_id: user.id,
          topic: keyword,
          module: "rabbit",
          depth_level: "touched",
          visit_count: 1,
          last_visited: new Date().toISOString(),
        });
      }
    } catch {
      // Non-critical — silently ignore
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    explore(inputValue);
    setInputValue("");
  }

  function handleRelatedClick(concept: string) {
    explore(concept);
  }

  function handleTrailClick(entry: TrailEntry) {
    setCurrent(entry);
  }

  return (
    <div className="px-10 py-10 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <p
          className="text-[10px] uppercase tracking-[0.25em] text-[#9d9080] mb-1"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Module
        </p>
        <h1
          className="text-3xl font-bold text-[#e8e0d4] mb-2 leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Rabbit Hole
        </h1>
        <p className="text-sm text-[#9d9080] max-w-xl leading-relaxed">
          Enter a keyword to start exploring. Follow related concepts through clickable pills and discover surprising connections.
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleFormSubmit} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g. Supply chain attack, Nudge theory, Passkeys…"
            className="flex-1 bg-[#161412] border border-[#2a2520] rounded-lg px-4 py-3 text-sm text-[#e8e0d4] placeholder-[#4a4540] outline-none focus:border-[#b07fd4] transition-colors"
            style={{ fontFamily: "var(--font-body)" }}
            disabled={streaming}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || streaming}
            className="px-5 py-2 rounded-lg text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            style={{
              fontFamily: "var(--font-mono)",
              backgroundColor: "#b07fd415",
              border: "1px solid #b07fd4",
              color: "#b07fd4",
            }}
          >
            {streaming ? "Exploring…" : "Explore →"}
          </button>
        </div>
      </form>

      {/* Session trail */}
      {trail.length > 0 && (
        <div className="mb-6">
          <p
            className="text-[9px] uppercase tracking-[0.25em] text-[#9d9080] mb-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Trail {trail.length > 0 && `· ${trail.length}/${MAX_TRAIL}`}
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            {trail.map((entry, i) => {
              const isCurrent = current?.keyword === entry.keyword && i === trail.length - 1;
              return (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <span className="text-[#4a4540] text-xs" style={{ fontFamily: "var(--font-mono)" }}>
                      →
                    </span>
                  )}
                  <button
                    onClick={() => handleTrailClick(entry)}
                    className="text-[10px] px-2.5 py-1 rounded-full border transition-colors"
                    style={{
                      fontFamily: "var(--font-mono)",
                      borderColor: isCurrent ? "#b07fd4" : "#2a2520",
                      backgroundColor: isCurrent ? "#b07fd415" : "transparent",
                      color: isCurrent ? "#b07fd4" : "#9d9080",
                    }}
                  >
                    {entry.keyword}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-[#161412] border border-[#e8854a]/30 rounded-lg p-5 mb-6">
          <p
            className="text-[10px] uppercase tracking-[0.2em] text-[#e8854a] mb-1"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Error
          </p>
          <p className="text-sm text-[#9d9080]">{error}</p>
        </div>
      )}

      {/* Streaming indicator */}
      {streaming && <StreamingIndicator accent="#b07fd4" />}

      {/* Current result */}
      {current && !streaming && (
        <div className="space-y-5">
          {/* Keyword heading */}
          <div className="flex items-baseline gap-3">
            <h2
              className="text-xl font-bold text-[#e8e0d4]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {current.keyword}
            </h2>
          </div>

          {/* Summary */}
          <Card>
            <SectionLabel>Overview</SectionLabel>
            <p className="text-sm text-[#e8e0d4] leading-relaxed">{current.result.summary}</p>
          </Card>

          {/* Two-column notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <SectionLabel color="#4eb8a0">Analyst Note</SectionLabel>
              <p className="text-sm text-[#e8e0d4] leading-relaxed">{current.result.analyst_note}</p>
            </Card>
            <Card>
              <SectionLabel color="#e8854a">HCI / UX Note</SectionLabel>
              <p className="text-sm text-[#e8e0d4] leading-relaxed">{current.result.hci_note}</p>
            </Card>
          </div>

          {/* Related concepts */}
          <div>
            <p
              className="text-[9px] uppercase tracking-[0.25em] text-[#9d9080] mb-3"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Related Concepts
            </p>
            <div className="flex flex-wrap gap-2">
              {current.result.related.map((concept, i) => {
                const alreadyExplored = trail.some((t) => t.keyword === concept);
                const atLimit = trail.length >= MAX_TRAIL;
                return (
                  <button
                    key={i}
                    onClick={() => handleRelatedClick(concept)}
                    disabled={streaming || atLimit}
                    className="text-xs px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      fontFamily: "var(--font-mono)",
                      borderColor: alreadyExplored ? "#b07fd440" : "#2a2520",
                      backgroundColor: alreadyExplored ? "#b07fd410" : "#161412",
                      color: alreadyExplored ? "#b07fd4" : "#9d9080",
                    }}
                    title={atLimit ? `Trail limit reached (${MAX_TRAIL})` : `Explore: ${concept}`}
                  >
                    {alreadyExplored && (
                      <span className="mr-1 opacity-60">✓</span>
                    )}
                    {concept}
                  </button>
                );
              })}
            </div>
            {trail.length >= MAX_TRAIL && (
              <p
                className="text-[10px] text-[#9d9080] mt-2"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Trail limit reached ({MAX_TRAIL} concepts). Start a new search to continue.
              </p>
            )}
          </div>

          {/* Surprising connection */}
          <div
            className="rounded-lg p-5 border"
            style={{
              borderColor: "#c9a96e40",
              backgroundColor: "#c9a96e08",
            }}
          >
            <p
              className="text-[9px] uppercase tracking-[0.25em] mb-2"
              style={{ fontFamily: "var(--font-mono)", color: "#c9a96e" }}
            >
              Surprising Connection
            </p>
            <p className="text-sm text-[#e8e0d4] leading-relaxed">{current.result.rabbit}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!current && !streaming && !error && (
        <div className="py-12 text-center">
          <p
            className="text-[#4a4540] text-2xl mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            ⬢
          </p>
          <p
            className="text-[10px] uppercase tracking-[0.2em] text-[#4a4540]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Enter a keyword to begin exploring
          </p>
        </div>
      )}
    </div>
  );
}
