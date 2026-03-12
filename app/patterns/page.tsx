"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  patterns,
  patternCategories,
  getPatternsByCategory,
  type Pattern,
  type PatternCategory,
} from "@/lib/patterns";

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

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#161412] border border-[#2a2520] rounded-lg p-5 ${className}`}>
      {children}
    </div>
  );
}

function BulletList({ items, accent }: { items: string[]; accent: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm text-[#e8e0d4] leading-relaxed">
          <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: accent }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Category colour mapping ───────────────────────────────────────────────────

const CATEGORY_COLOR: Record<PatternCategory, string> = {
  "Alert Design": "#4eb8a0",
  "Automation UX": "#e8854a",
  "Data Visualisation": "#7b9fd4",
  "Access Control UX": "#c9a96e",
};

// ── Pattern overview card ─────────────────────────────────────────────────────

function PatternCard({
  pattern,
  onSelect,
}: {
  pattern: Pattern;
  onSelect: (p: Pattern) => void;
}) {
  const color = CATEGORY_COLOR[pattern.category];
  return (
    <button
      onClick={() => onSelect(pattern)}
      className="w-full text-left bg-[#161412] border border-[#2a2520] rounded-lg p-4 transition-colors hover:border-[#3a3530] group"
      style={{ borderLeftColor: color, borderLeftWidth: "3px" }}
    >
      <p
        className="text-[9px] uppercase tracking-[0.2em] mb-1.5"
        style={{ fontFamily: "var(--font-mono)", color }}
      >
        {pattern.category}
      </p>
      <h3
        className="text-sm font-semibold text-[#e8e0d4] mb-1.5 leading-snug group-hover:text-white transition-colors"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {pattern.name}
      </h3>
      <p className="text-xs text-[#9d9080] leading-relaxed line-clamp-2">{pattern.tagline}</p>
    </button>
  );
}

// ── Detail view ───────────────────────────────────────────────────────────────

type DetailTab = "overview" | "tradeoffs" | "refs" | "annotate";

function PatternDetail({
  pattern,
  onBack,
}: {
  pattern: Pattern;
  onBack: () => void;
}) {
  const color = CATEGORY_COLOR[pattern.category];
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [annotation, setAnnotation] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingAnnotation, setLoadingAnnotation] = useState(true);

  const TABS: { id: DetailTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "tradeoffs", label: "Trade-offs" },
    { id: "refs", label: "References" },
    { id: "annotate", label: "My Notes" },
  ];

  // Load existing annotation
  useEffect(() => {
    setActiveTab("overview");
    setAnnotation("");
    setSaved(false);
    setLoadingAnnotation(true);

    async function loadAnnotation() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("pattern_annotations")
          .select("notes")
          .eq("user_id", user.id)
          .eq("pattern_id", pattern.id)
          .maybeSingle();

        if (data?.notes) {
          setAnnotation(data.notes);
        }
      } catch {
        // Non-critical
      } finally {
        setLoadingAnnotation(false);
      }
    }

    loadAnnotation();
  }, [pattern.id]);

  async function handleSaveAnnotation() {
    if (saving || saved) return;
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upsert — insert or update
      const { data: existing } = await supabase
        .from("pattern_annotations")
        .select("id")
        .eq("user_id", user.id)
        .eq("pattern_id", pattern.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("pattern_annotations")
          .update({ notes: annotation })
          .eq("id", existing.id);
      } else {
        await supabase.from("pattern_annotations").insert({
          user_id: user.id,
          pattern_id: pattern.id,
          notes: annotation,
        });
      }

      setSaved(true);
    } catch (err) {
      console.error("[patterns] Save annotation failed:", err);
    } finally {
      setSaving(false);
    }
  }

  // Reset saved state when annotation changes after save
  function handleAnnotationChange(val: string) {
    setAnnotation(val);
    setSaved(false);
  }

  return (
    <div>
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-[#9d9080] hover:text-[#e8e0d4] transition-colors"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          ← Library
        </button>
        <span className="text-[#2a2520]">/</span>
        <span
          className="text-[11px] uppercase tracking-[0.15em]"
          style={{ fontFamily: "var(--font-mono)", color }}
        >
          {pattern.category}
        </span>
      </div>

      {/* Pattern header */}
      <div className="mb-7">
        <p
          className="text-[10px] uppercase tracking-[0.25em] mb-1"
          style={{ fontFamily: "var(--font-mono)", color }}
        >
          Design Pattern
        </p>
        <h2
          className="text-2xl font-bold text-[#e8e0d4] mb-2 leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {pattern.name}
        </h2>
        <p className="text-sm text-[#9d9080] leading-relaxed max-w-2xl">{pattern.tagline}</p>

        {/* Related scenarios */}
        {pattern.relatedScenarios.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            <span
              className="text-[9px] uppercase tracking-[0.2em] text-[#9d9080] self-center"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              See in:
            </span>
            {pattern.relatedScenarios.map((slug) => (
              <a
                key={slug}
                href={`/scenarios/${slug}`}
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] tracking-[0.08em] transition-colors"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "#9d9080",
                  backgroundColor: "#2a252080",
                  border: "1px solid #2a2520",
                }}
              >
                {slug.replace(/-/g, " ")}
              </a>
            ))}
          </div>
        )}
      </div>

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
                color: isActive ? color : "#9d9080",
                borderBottom: isActive ? `2px solid ${color}` : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {isActive && (
                <span
                  className="absolute inset-0 opacity-5 rounded-t"
                  style={{ backgroundColor: color }}
                />
              )}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          <Card>
            <SectionLabel>Problem</SectionLabel>
            <p className="text-sm text-[#e8e0d4] leading-relaxed">{pattern.problem}</p>
          </Card>

          <Card>
            <SectionLabel>HCI Principle</SectionLabel>
            <p className="text-sm text-[#e8e0d4] leading-relaxed">{pattern.hciPrinciple}</p>
          </Card>

          <Card>
            <SectionLabel>Real Tool Examples</SectionLabel>
            <BulletList items={pattern.realToolExamples} accent={color} />
          </Card>

          <Card>
            <SectionLabel>Anti-patterns</SectionLabel>
            <BulletList items={pattern.antiPatterns} accent="#e8854a" />
          </Card>
        </div>
      )}

      {/* Tab: Trade-offs */}
      {activeTab === "tradeoffs" && (
        <div className="space-y-4">
          {pattern.tradeoffs.map((t, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card>
                <SectionLabel>Benefit</SectionLabel>
                <p className="text-sm text-[#e8e0d4] leading-relaxed">{t.pro}</p>
              </Card>
              <Card>
                <SectionLabel>Cost</SectionLabel>
                <p className="text-sm text-[#e8e0d4] leading-relaxed">{t.con}</p>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Tab: References */}
      {activeTab === "refs" && (
        <div className="space-y-4">
          {pattern.academicRefs.map((ref, i) => (
            <Card key={i}>
              <p
                className="text-xs text-[#e8e0d4] leading-relaxed mb-2"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {ref.citation}
              </p>
              <p className="text-sm text-[#9d9080] leading-relaxed">{ref.note}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Tab: My Notes */}
      {activeTab === "annotate" && (
        <div className="space-y-4">
          <p className="text-sm text-[#9d9080] leading-relaxed">
            Add your own observations, examples from practice, or connections to other concepts.
            Notes are saved to your account.
          </p>

          {loadingAnnotation ? (
            <div className="bg-[#161412] border border-[#2a2520] rounded-lg p-5 animate-pulse">
              <div className="h-24 bg-[#2a2520] rounded" />
            </div>
          ) : (
            <Card>
              <SectionLabel>Your annotation</SectionLabel>
              <textarea
                rows={8}
                value={annotation}
                onChange={(e) => handleAnnotationChange(e.target.value)}
                placeholder="e.g. Saw this anti-pattern in our SOAR rollout — analysts stopped reviewing alerts after week 2…"
                className="w-full bg-[#0f0e0d] border border-[#2a2520] rounded px-3 py-2 text-sm text-[#e8e0d4] placeholder-[#4a4540] outline-none focus:border-[#c9a96e] transition-colors resize-none"
                style={{ fontFamily: "var(--font-body)" }}
              />
            </Card>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveAnnotation}
              disabled={saving || saved || !annotation.trim()}
              className="px-5 py-2 rounded-lg text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                fontFamily: "var(--font-mono)",
                backgroundColor: saved ? "#c9a96e15" : "#161412",
                border: `1px solid ${saved ? "#c9a96e" : "#2a2520"}`,
                color: saved ? "#c9a96e" : "#9d9080",
              }}
            >
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save Note"}
            </button>
            {saved && (
              <span
                className="text-[10px] text-[#9d9080]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Annotation saved
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pattern library overview ──────────────────────────────────────────────────

function PatternLibrary({ onSelect }: { onSelect: (p: Pattern) => void }) {
  return (
    <div>
      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 mb-8">
        {patternCategories.map((cat) => {
          const color = CATEGORY_COLOR[cat];
          const count = getPatternsByCategory(cat).length;
          return (
            <div
              key={cat}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border"
              style={{ borderColor: color + "40", backgroundColor: color + "08" }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span
                className="text-[10px] uppercase tracking-[0.15em]"
                style={{ fontFamily: "var(--font-mono)", color }}
              >
                {cat}
              </span>
              <span
                className="text-[10px] text-[#9d9080]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Grouped by category */}
      <div className="space-y-8">
        {patternCategories.map((cat) => {
          const color = CATEGORY_COLOR[cat];
          const catPatterns = getPatternsByCategory(cat);
          return (
            <section key={cat}>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-1 h-4 rounded-full" style={{ backgroundColor: color }} />
                <h2
                  className="text-[11px] uppercase tracking-[0.2em]"
                  style={{ fontFamily: "var(--font-mono)", color }}
                >
                  {cat}
                </h2>
                <span
                  className="text-[10px] text-[#9d9080]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  — {catPatterns.length} pattern{catPatterns.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {catPatterns.map((p) => (
                  <PatternCard key={p.id} pattern={p} onSelect={onSelect} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PatternsPage() {
  const [selected, setSelected] = useState<Pattern | null>(null);

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
          Design Patterns
        </h1>
        <p className="text-sm text-[#9d9080] max-w-xl leading-relaxed">
          {selected
            ? "Pattern detail — problem, HCI principle, examples, and trade-offs."
            : `${patterns.length} HCI patterns across ${patternCategories.length} categories. Click any pattern to explore the detail view and add your own annotations.`}
        </p>
      </div>

      {/* Content: library or detail */}
      {selected ? (
        <PatternDetail pattern={selected} onBack={() => setSelected(null)} />
      ) : (
        <PatternLibrary onSelect={setSelected} />
      )}
    </div>
  );
}
