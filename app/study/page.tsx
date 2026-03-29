"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface StudyAnalyst { summary: string; concepts: string[]; tools: string[]; }
interface StudyHCI { summary: string; challenges: string[]; design_questions: string[]; }
interface StudyResult { analyst: StudyAnalyst; hci: StudyHCI; reflect: string[]; }
type DepthKey = "overview" | "working_knowledge" | "deep_dive";
type TabKey = "analyst" | "hci" | "reflect";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] uppercase tracking-[0.25em] mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
      {children}
    </p>
  );
}

function BulletList({ items, accent }: { items: string[]; accent: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 leading-relaxed" style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text)" }}>
          <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: accent }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

function StreamingIndicator({ accent }: { accent: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-3">
        <span className="inline-flex gap-1" aria-label="Generating">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: accent, animationDelay: `${i * 0.15}s` }} />
          ))}
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Generating…</span>
      </div>
      <div className="animate-pulse space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="card p-5">
            <div className="h-2 w-20 rounded mb-4" style={{ backgroundColor: accent + "30" }} />
            <div className="space-y-2">
              <div className="h-3 rounded w-full skeleton-line" />
              <div className="h-3 rounded w-5/6 skeleton-line" />
              <div className="h-3 rounded w-3/4 skeleton-line" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DEPTH_OPTIONS: { value: DepthKey; label: string; description: string }[] = [
  { value: "overview",          label: "Overview",          description: "High-level concepts and context" },
  { value: "working_knowledge", label: "Working Knowledge", description: "Practitioner-level understanding" },
  { value: "deep_dive",         label: "Deep Dive",         description: "Expert depth with technical nuance" },
];

// ── Tab config — all CSS variables ────────────────────────────────────────────
const TABS: { id: TabKey; label: string; accent: string }[] = [
  { id: "analyst", label: "Analyst View",  accent: "var(--leaf)" },
  { id: "hci",     label: "HCI / UX View", accent: "var(--clay)" },
  { id: "reflect", label: "Reflect",       accent: "var(--oak)"  },
];

function StudyPageInner() {
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

  useEffect(() => {
    const prefill = searchParams.get("topic");
    if (prefill) setTopic(decodeURIComponent(prefill));
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || streaming) return;
    const trimmedTopic = topic.trim();
    currentTopicRef.current = trimmedTopic;
    setStreaming(true); setResult(null); setError(null); setReflections({}); setSaved(false); setActiveTab("analyst");
    try {
      const res = await fetch("/api/study", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: trimmedTopic, depth }) });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let accumulated = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; accumulated += decoder.decode(value, { stream: true }); }
      const jsonText = accumulated.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      setResult(JSON.parse(jsonText) as StudyResult);
      recordKnowledgeMapEntry(trimmedTopic, depth);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally { setStreaming(false); }
  }

  async function recordKnowledgeMapEntry(topicName: string, depthKey: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const depthLevel = depthKey === "deep_dive" ? "deep" : depthKey === "working_knowledge" ? "explored" : "touched";
      const { data: existing } = await supabase.from("knowledge_map_entries").select("id, visit_count").eq("user_id", user.id).eq("topic", topicName).eq("module", "study").maybeSingle();
      if (existing) {
        await supabase.from("knowledge_map_entries").update({ visit_count: existing.visit_count + 1, last_visited: new Date().toISOString(), depth_level: depthLevel }).eq("id", existing.id);
      } else {
        await supabase.from("knowledge_map_entries").insert({ user_id: user.id, topic: topicName, module: "study", depth_level: depthLevel, visit_count: 1, last_visited: new Date().toISOString() });
      }
    } catch { /* Non-critical */ }
  }

  async function handleSave() {
    if (!result || saving || saved) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      await supabase.from("saved_notes").insert({ user_id: user.id, topic: currentTopicRef.current, depth, analyst_content: result.analyst, hci_content: result.hci, reflections: result.reflect.map((q, i) => ({ question: q, answer: reflections[i] ?? "" })) });
      setSaved(true);
    } catch (err) { console.error("[study] Save failed:", err); } finally { setSaving(false); }
  }

  const activeAccent = TABS.find(t => t.id === activeTab)?.accent ?? "var(--leaf)";

  return (
    <div className="px-10 py-10 max-w-5xl responsive-padding">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Module</p>
        <h1 className="page-title mb-2" style={{ fontFamily: "var(--font-body)" }}>Guided Study</h1>
        <p className="max-w-xl" style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-mid)", lineHeight: 1.7 }}>
          Enter a cybersecurity or HCI topic. Choose a depth level, then explore the analyst and UX perspectives side by side.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="topic" className="block text-[9px] uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Topic</label>
            <input
              id="topic" type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Phishing-resistant MFA, Zero Trust Architecture, Alert Fatigue…"
              className="w-full px-4 py-3 outline-none transition-all"
              style={{ fontFamily: "var(--font-body)", fontSize: "14px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "2px", color: "var(--text)" }}
              onFocus={(e) => { e.target.style.borderColor = "var(--border-strong)"; e.target.style.boxShadow = "0 0 0 3px rgba(26,22,20,0.06)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
              disabled={streaming}
            />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Depth</p>
            <div className="flex flex-wrap gap-2">
              {DEPTH_OPTIONS.map((opt) => {
                const isSelected = depth === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => setDepth(opt.value)}
                    className="px-4 py-2 border transition-colors text-left"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "12px", borderRadius: "2px", borderColor: isSelected ? "var(--leaf-bdr)" : "var(--border)", backgroundColor: isSelected ? "var(--leaf-bg)" : "var(--bg-card)", color: isSelected ? "var(--leaf)" : "var(--text-mid)" }}
                    disabled={streaming}>
                    <span className="block font-medium">{opt.label}</span>
                    <span className="block text-[10px] opacity-70 mt-0.5">{opt.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <button type="submit" disabled={!topic.trim() || streaming}
              className="px-6 py-2.5 uppercase tracking-[0.15em] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-mono)", fontSize: "9px", backgroundColor: "var(--leaf-bg)", border: "1px solid var(--leaf-bdr)", borderRadius: "2px", color: "var(--leaf)" }}>
              {streaming ? "Generating…" : "Study →"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="card p-5 mb-6" style={{ borderColor: "var(--clay-bdr)" }}>
          <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ fontFamily: "var(--font-mono)", color: "var(--clay)" }}>Error</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-mid)" }}>{error}</p>
        </div>
      )}

      {streaming && <StreamingIndicator accent={activeAccent} />}

      {result && !streaming && (
        <div>
          <div className="flex gap-0 mb-6" style={{ borderBottom: "2px solid var(--border)", overflowX: "auto", scrollbarWidth: "none" } as React.CSSProperties}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="relative shrink-0 px-4 py-3 uppercase tracking-[0.12em] transition-colors"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: isActive ? tab.accent : "var(--text-dim)", borderBottom: isActive ? `3px solid ${tab.accent}` : "3px solid transparent", marginBottom: "-2px", backgroundColor: "transparent" }}>
                  {isActive && <span className="absolute inset-0 rounded-t" style={{ backgroundColor: tab.accent + "12" }} />}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "analyst" && (
            <div className="space-y-5">
              <Card><SectionLabel>Summary</SectionLabel><p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text)", lineHeight: 1.7 }}>{result.analyst.summary}</p></Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card><SectionLabel>Key Concepts</SectionLabel><BulletList items={result.analyst.concepts} accent="var(--leaf)" /></Card>
                <Card><SectionLabel>Tools & Resources</SectionLabel><BulletList items={result.analyst.tools} accent="var(--leaf)" /></Card>
              </div>
            </div>
          )}

          {activeTab === "hci" && (
            <div className="space-y-5">
              <Card><SectionLabel>Human Factors Summary</SectionLabel><p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text)", lineHeight: 1.7 }}>{result.hci.summary}</p></Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card><SectionLabel>Human & Cognitive Challenges</SectionLabel><BulletList items={result.hci.challenges} accent="var(--clay)" /></Card>
                <Card><SectionLabel>Design Questions</SectionLabel><BulletList items={result.hci.design_questions} accent="var(--clay)" /></Card>
              </div>
            </div>
          )}

          {activeTab === "reflect" && (
            <div className="space-y-4">
              <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-mid)", lineHeight: 1.7, marginBottom: "8px" }}>
                Deepen your understanding by reflecting on these questions. Your answers are saved with the session.
              </p>
              {result.reflect.map((question, i) => (
                <Card key={i}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text)", lineHeight: 1.7, marginBottom: "12px" }}>{question}</p>
                  <textarea rows={3} value={reflections[i] ?? ""} onChange={(e) => setReflections((prev) => ({ ...prev, [i]: e.target.value }))}
                    placeholder="Your thoughts…"
                    className="w-full px-3 py-2 outline-none transition-colors resize-none"
                    style={{ fontFamily: "var(--font-body)", fontSize: "13px", backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "2px", color: "var(--text)" }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--oak-bdr-hi)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
                  />
                </Card>
              ))}
            </div>
          )}

          <div className="mt-8 pt-6 flex items-center gap-4" style={{ borderTop: "1px solid var(--border)" }}>
            <button onClick={handleSave} disabled={saving || saved}
              className="px-5 py-2 uppercase tracking-[0.15em] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-mono)", fontSize: "9px", backgroundColor: saved ? "var(--leaf-bg)" : "var(--bg-card)", border: `1px solid ${saved ? "var(--leaf-bdr)" : "var(--border)"}`, borderRadius: "2px", color: saved ? "var(--leaf)" : "var(--text-mid)" }}>
              {saving ? "Saving…" : saved ? "Session Saved ✓" : "Save Session"}
            </button>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)" }}>
              {saved ? "Saved to your notes" : "Save this session with your reflections"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudyPage() {
  return <Suspense><StudyPageInner /></Suspense>;
}
