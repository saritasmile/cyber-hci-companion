"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StudyAnalyst {
  summary: string;
  concepts: string[];
  tools: string[];
}

interface StudyHCI {
  summary: string;
  challenges: string[];
  design_questions: string[];
}

interface StudyResult {
  analyst: StudyAnalyst;
  hci: StudyHCI;
  reflect: string[];
}

type DepthKey = "overview" | "working_knowledge" | "deep_dive";
type TabKey = "analyst" | "hci" | "reflect";

// ── UI Primitives ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[9px] uppercase tracking-[0.25em] text-[#9d9080] mb-2"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {children}
    </p>
  );
}

function BulletList({ items, accent }: { items: string[]; accent: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm text-[#e8e0d4] leading-relaxed">
          <span
            className="mt-1.5 shrink-0 w-1 h-1 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#161412] border border-[#2a2520] rounded-lg p-5 ${className}`}>
      {children}
    </div>
  );
}

// ── Streaming indicator ───────────────────────────────────────────────────────

function StreamingIndicator({ accent }: { accent: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-3">
        <span
          className="inline-flex gap-1"
          aria-label="Generating"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{
                backgroundColor: accent,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.2em] text-[#9d9080]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Generating…
        </span>
      </div>
      <div className="animate-pulse space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-[#161412] border border-[#2a2520] rounded-lg p-5">
            <div className="h-2 w-20 rounded mb-4" style={{ backgroundColor: accent + "30" }} />
            <div className="space-y-2">
              <div className="h-3 bg-[#2a2520] rounded w-full" />
              <div className="h-3 bg-[#2a2520] rounded w-5/6" />
              <div className="h-3 bg-[#2a2520] rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Depth options ─────────────────────────────────────────────────────────────

const DEPTH_OPTIONS: { value: DepthKey; label: string; description: string }[] = [
  { value: "overview", label: "Overview", description: "High-level concepts and context" },
  { value: "working_knowledge", label: "Working Knowledge", description: "Practitioner-level understanding" },
  { value: "deep_dive", label: "Deep Dive", description: "Expert depth with technical nuance" },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StudyPage() {
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<DepthKey>("overview");
  const [streaming, setStreaming] = useState(false);
  const [result, setResult] = useState<StudyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("analyst");
  const [reflections, setReflections] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const currentTopicRef = useRef("");

  // Pre-fill topic from ?topic= query param (e.g. from Horizon Scan "Go deep" button)
  useEffect(() => {
    const prefill = searchParams.get("topic");
    if (prefill) setTopic(decodeURIComponent(prefill));
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || streaming) return;

    const trimmedTopic = topic.trim();
    currentTopicRef.current = trimmedTopic;
    setStreaming(true);
    setResult(null);
    setError(null);
    setReflections({});
    setSaved(false);
    setActiveTab("analyst");

    try {
      const res = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: trimmedTopic, depth }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

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

      const parsed = JSON.parse(jsonText) as StudyResult;
      setResult(parsed);

      // Record knowledge map entry (fire-and-forget)
      recordKnowledgeMapEntry(trimmedTopic, depth);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally {
      setStreaming(false);
    }
  }

  async function recordKnowledgeMapEntry(topicName: string, depthKey: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const depthLevel =
        depthKey === "deep_dive" ? "deep" : depthKey === "working_knowledge" ? "explored" : "touched";

      const { data: existing } = await supabase
        .from("knowledge_map_entries")
        .select("id, visit_count")
        .eq("user_id", user.id)
        .eq("topic", topicName)
        .eq("module", "study")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("knowledge_map_entries")
          .update({ visit_count: existing.visit_count + 1, last_visited: new Date().toISOString(), depth_level: depthLevel })
          .eq("id", existing.id);
      } else {
        await supabase.from("knowledge_map_entries").insert({
          user_id: user.id,
          topic: topicName,
          module: "study",
          depth_level: depthLevel,
          visit_count: 1,
          last_visited: new Date().toISOString(),
        });
      }
    } catch {
      // Non-critical — silently ignore
    }
  }

  async function handleSave() {
    if (!result || saving || saved) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const reflectionsArray = result.reflect.map((q, i) => ({
        question: q,
        answer: reflections[i] ?? "",
      }));

      await supabase.from("saved_notes").insert({
        user_id: user.id,
        topic: currentTopicRef.current,
        depth: depth,
        analyst_content: result.analyst,
        hci_content: result.hci,
        reflections: reflectionsArray,
      });

      setSaved(true);
    } catch (err) {
      console.error("[study] Save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  const TABS: { id: TabKey; label: string; accent: string }[] = [
    { id: "analyst", label: "Analyst View", accent: "#4eb8a0" },
    { id: "hci", label: "HCI / UX View", accent: "#e8854a" },
    { id: "reflect", label: "Reflect", accent: "#b07fd4" },
  ];

  const activeTabDef = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  return (
    <div className="px-10 py-10 max-w-5xl">
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
          Guided Study
        </h1>
        <p className="text-sm text-[#9d9080] max-w-xl leading-relaxed">
          Enter a cybersecurity or HCI topic. Choose a depth level, then explore the analyst and UX perspectives side by side.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex flex-col gap-4">
          {/* Topic input */}
          <div>
            <label
              htmlFor="topic"
              className="block text-[9px] uppercase tracking-[0.2em] text-[#9d9080] mb-2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Topic
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Phishing-resistant MFA, Zero Trust Architecture, Alert Fatigue…"
              className="w-full bg-[#161412] border border-[#2a2520] rounded-lg px-4 py-3 text-sm text-[#e8e0d4] placeholder-[#4a4540] outline-none focus:border-[#4eb8a0] transition-colors"
              style={{ fontFamily: "var(--font-body)" }}
              disabled={streaming}
            />
          </div>

          {/* Depth selector */}
          <div>
            <p
              className="text-[9px] uppercase tracking-[0.2em] text-[#9d9080] mb-2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Depth
            </p>
            <div className="flex flex-wrap gap-2">
              {DEPTH_OPTIONS.map((opt) => {
                const isSelected = depth === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDepth(opt.value)}
                    className="px-4 py-2 rounded-lg border text-xs transition-colors text-left"
                    style={{
                      fontFamily: "var(--font-mono)",
                      borderColor: isSelected ? "#4eb8a0" : "#2a2520",
                      backgroundColor: isSelected ? "#4eb8a010" : "#161412",
                      color: isSelected ? "#4eb8a0" : "#9d9080",
                    }}
                    disabled={streaming}
                  >
                    <span className="block font-semibold">{opt.label}</span>
                    <span className="block text-[10px] opacity-70 mt-0.5">{opt.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={!topic.trim() || streaming}
              className="px-6 py-2.5 rounded-lg text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                fontFamily: "var(--font-mono)",
                backgroundColor: "#4eb8a015",
                border: "1px solid #4eb8a0",
                color: "#4eb8a0",
              }}
            >
              {streaming ? "Generating…" : "Study →"}
            </button>
          </div>
        </div>
      </form>

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
      {streaming && <StreamingIndicator accent="#4eb8a0" />}

      {/* Results */}
      {result && !streaming && (
        <div>
          {/* Tab bar */}
          <div className="flex gap-0 border-b border-[#2a2520] mb-6">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative shrink-0 px-4 py-3 text-[11px] tracking-[0.12em] uppercase transition-colors"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: isActive ? tab.accent : "#9d9080",
                    borderBottom: isActive ? `2px solid ${tab.accent}` : "2px solid transparent",
                    marginBottom: "-1px",
                  }}
                >
                  {isActive && (
                    <span
                      className="absolute inset-0 opacity-5 rounded-t"
                      style={{ backgroundColor: tab.accent }}
                    />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Analyst Tab */}
          {activeTab === "analyst" && (
            <div className="space-y-5">
              <Card>
                <SectionLabel>Summary</SectionLabel>
                <p className="text-sm text-[#e8e0d4] leading-relaxed">{result.analyst.summary}</p>
              </Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <SectionLabel>Key Concepts</SectionLabel>
                  <BulletList items={result.analyst.concepts} accent="#4eb8a0" />
                </Card>
                <Card>
                  <SectionLabel>Tools & Resources</SectionLabel>
                  <BulletList items={result.analyst.tools} accent="#4eb8a0" />
                </Card>
              </div>
            </div>
          )}

          {/* HCI Tab */}
          {activeTab === "hci" && (
            <div className="space-y-5">
              <Card>
                <SectionLabel>Human Factors Summary</SectionLabel>
                <p className="text-sm text-[#e8e0d4] leading-relaxed">{result.hci.summary}</p>
              </Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <SectionLabel>Human & Cognitive Challenges</SectionLabel>
                  <BulletList items={result.hci.challenges} accent="#e8854a" />
                </Card>
                <Card>
                  <SectionLabel>Design Questions</SectionLabel>
                  <BulletList items={result.hci.design_questions} accent="#e8854a" />
                </Card>
              </div>
            </div>
          )}

          {/* Reflect Tab */}
          {activeTab === "reflect" && (
            <div className="space-y-4">
              <p className="text-sm text-[#9d9080] leading-relaxed mb-2">
                Deepen your understanding by reflecting on these questions. Your answers are saved with the session.
              </p>
              {result.reflect.map((question, i) => (
                <Card key={i}>
                  <p className="text-sm text-[#e8e0d4] leading-relaxed mb-3">{question}</p>
                  <textarea
                    rows={3}
                    value={reflections[i] ?? ""}
                    onChange={(e) =>
                      setReflections((prev) => ({ ...prev, [i]: e.target.value }))
                    }
                    placeholder="Your thoughts…"
                    className="w-full bg-[#0f0e0d] border border-[#2a2520] rounded px-3 py-2 text-sm text-[#e8e0d4] placeholder-[#4a4540] outline-none focus:border-[#b07fd4] transition-colors resize-none"
                    style={{ fontFamily: "var(--font-body)" }}
                  />
                </Card>
              ))}
            </div>
          )}

          {/* Save session */}
          <div className="mt-8 pt-6 border-t border-[#2a2520] flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="px-5 py-2 rounded-lg text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                fontFamily: "var(--font-mono)",
                backgroundColor: saved ? "#4eb8a015" : "#161412",
                border: `1px solid ${saved ? "#4eb8a0" : "#2a2520"}`,
                color: saved ? "#4eb8a0" : "#9d9080",
              }}
            >
              {saving ? "Saving…" : saved ? "Session Saved ✓" : "Save Session"}
            </button>
            <span
              className="text-[10px] text-[#9d9080]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {saved
                ? "Saved to your notes"
                : "Save this session with your reflections to your notes"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
