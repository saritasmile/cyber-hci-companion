"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { patterns, patternCategories, getPatternsByCategory, type Pattern, type PatternCategory } from "@/lib/patterns";

// ── UI Primitives ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] uppercase tracking-[0.25em] mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
      {children}
    </p>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

function BulletList({ items, accent }: { items: string[]; accent: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "var(--text)" }}>
          <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: accent }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Category colour mapping ───────────────────────────────────────────────────

const CATEGORY_COLOR: Record<PatternCategory, { color: string; bg: string; bdr: string }> = {
  "Alert Design":       { color: "#0a7a68", bg: "#e8f5f2", bdr: "#b0dbd4" },
  "Automation UX":      { color: "#c04a0a", bg: "#fdf0e8", bdr: "#f0c4a0" },
  "Data Visualisation": { color: "#1a4e8a", bg: "#e8f0fa", bdr: "#a8c4e8" },
  "Access Control UX":  { color: "#8a5a1a", bg: "#faf0e0", bdr: "#d4a860" },
};

// ── Pattern card ──────────────────────────────────────────────────────────────

function PatternCard({ pattern, onSelect }: { pattern: Pattern; onSelect: (p: Pattern) => void }) {
  const c = CATEGORY_COLOR[pattern.category];
  return (
    <button
      onClick={() => onSelect(pattern)}
      className="w-full text-left card p-4 transition-all group"
      style={{ borderLeftColor: c.color, borderLeftWidth: "3px" }}
    >
      <p className="text-[9px] uppercase tracking-[0.2em] mb-1.5" style={{ fontFamily: "var(--font-mono)", color: c.color }}>
        {pattern.category}
      </p>
      <h3 className="text-sm font-semibold mb-1.5 leading-snug transition-colors" style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}>
        {pattern.name}
      </h3>
      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-dim)" }}>{pattern.tagline}</p>
    </button>
  );
}

// ── Detail view ───────────────────────────────────────────────────────────────

type DetailTab = "overview" | "tradeoffs" | "refs" | "annotate";

function PatternDetail({ pattern, onBack }: { pattern: Pattern; onBack: () => void }) {
  const c = CATEGORY_COLOR[pattern.category];
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [annotation, setAnnotation] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingAnnotation, setLoadingAnnotation] = useState(true);

  const TABS: { id: DetailTab; label: string }[] = [
    { id: "overview",  label: "Overview" },
    { id: "tradeoffs", label: "Trade-offs" },
    { id: "refs",      label: "References" },
    { id: "annotate",  label: "My Notes" },
  ];

  useEffect(() => {
    setActiveTab("overview"); setAnnotation(""); setSaved(false); setLoadingAnnotation(true);
    async function loadAnnotation() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("pattern_annotations").select("notes").eq("user_id", user.id).eq("pattern_id", pattern.id).maybeSingle();
        if (data?.notes) setAnnotation(data.notes);
      } catch { /* Non-critical */ } finally { setLoadingAnnotation(false); }
    }
    loadAnnotation();
  }, [pattern.id]);

  async function handleSaveAnnotation() {
    if (saving || saved) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: existing } = await supabase.from("pattern_annotations").select("id").eq("user_id", user.id).eq("pattern_id", pattern.id).maybeSingle();
      if (existing) {
        await supabase.from("pattern_annotations").update({ notes: annotation }).eq("id", existing.id);
      } else {
        await supabase.from("pattern_annotations").insert({ user_id: user.id, pattern_id: pattern.id, notes: annotation });
      }
      setSaved(true);
    } catch (err) { console.error("[patterns] Save annotation failed:", err); } finally { setSaving(false); }
  }

  return (
    <div>
      {/* Back */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] transition-colors"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}
        >
          ← Library
        </button>
        <span style={{ color: "var(--border-hi)" }}>/</span>
        <span className="text-[11px] uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-mono)", color: c.color }}>{pattern.category}</span>
      </div>

      {/* Pattern header */}
      <div className="mb-7">
        <p className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ fontFamily: "var(--font-mono)", color: c.color }}>Design Pattern</p>
        <h2 className="text-2xl font-bold mb-2 leading-tight" style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}>{pattern.name}</h2>
        <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "var(--text-mid)" }}>{pattern.tagline}</p>

        {pattern.relatedScenarios.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-[9px] uppercase tracking-[0.2em] self-center" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>See in:</span>
            {pattern.relatedScenarios.map((slug) => (
              <a key={slug} href={`/scenarios/${slug}`}
                className="inline-flex items-center px-2 py-0.5 text-[10px] tracking-[0.08em] transition-colors"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-mid)", backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "2px" }}>
                {slug.replace(/-/g, " ")}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 mb-6" style={{ borderBottom: "2px solid var(--border)", overflowX: "auto", scrollbarWidth: "none" } as React.CSSProperties}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="relative shrink-0 px-4 py-3 text-[11px] tracking-[0.12em] uppercase transition-colors"
              style={{ fontFamily: "var(--font-mono)", color: isActive ? c.color : "var(--text-dim)", borderBottom: isActive ? `3px solid ${c.color}` : "3px solid transparent", marginBottom: "-2px", backgroundColor: "transparent" }}
            >
              {isActive && <span className="absolute inset-0 rounded-t" style={{ backgroundColor: c.color + "12" }} />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          <Card><SectionLabel>Problem</SectionLabel><p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{pattern.problem}</p></Card>
          <Card><SectionLabel>HCI Principle</SectionLabel><p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{pattern.hciPrinciple}</p></Card>
          <Card><SectionLabel>Real Tool Examples</SectionLabel><BulletList items={pattern.realToolExamples} accent={c.color} /></Card>
          <Card><SectionLabel>Anti-patterns</SectionLabel><BulletList items={pattern.antiPatterns} accent="#c04a0a" /></Card>
        </div>
      )}

      {/* Trade-offs */}
      {activeTab === "tradeoffs" && (
        <div className="space-y-4">
          {pattern.tradeoffs.map((t, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card><SectionLabel>Benefit</SectionLabel><p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{t.pro}</p></Card>
              <Card><SectionLabel>Cost</SectionLabel><p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{t.con}</p></Card>
            </div>
          ))}
        </div>
      )}

      {/* References */}
      {activeTab === "refs" && (
        <div className="space-y-4">
          {pattern.academicRefs.map((ref, i) => (
            <Card key={i}>
              <p className="text-xs leading-relaxed mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{ref.citation}</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-mid)" }}>{ref.note}</p>
            </Card>
          ))}
        </div>
      )}

      {/* My Notes */}
      {activeTab === "annotate" && (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-mid)" }}>
            Add your own observations, examples from practice, or connections to other concepts. Notes are saved to your account.
          </p>
          {loadingAnnotation ? (
            <div className="card p-5 animate-pulse"><div className="h-24 rounded skeleton-line" /></div>
          ) : (
            <Card>
              <SectionLabel>Your annotation</SectionLabel>
              <textarea
                rows={8} value={annotation} onChange={(e) => { setAnnotation(e.target.value); setSaved(false); }}
                placeholder="e.g. Saw this anti-pattern in our SOAR rollout — analysts stopped reviewing alerts after week 2…"
                className="w-full px-3 py-2 text-sm outline-none transition-colors resize-none"
                style={{ fontFamily: "var(--font-body)", backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "2px", color: "var(--text)" }}
                onFocus={(e) => { e.target.style.borderColor = "#d4a860"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
              />
            </Card>
          )}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveAnnotation} disabled={saving || saved || !annotation.trim()}
              className="px-5 py-2 text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-mono)", backgroundColor: saved ? "#faf0e0" : "var(--bg-card)", border: `1px solid ${saved ? "#d4a860" : "var(--border)"}`, borderRadius: "2px", color: saved ? "#8a5a1a" : "var(--text-mid)" }}
            >
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save Note"}
            </button>
            {saved && <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Annotation saved</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pattern library ───────────────────────────────────────────────────────────

function PatternLibrary({ onSelect }: { onSelect: (p: Pattern) => void }) {
  return (
    <div>
      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 mb-8">
        {patternCategories.map((cat) => {
          const c = CATEGORY_COLOR[cat];
          const count = getPatternsByCategory(cat).length;
          return (
            <div key={cat} className="flex items-center gap-2 px-3 py-2 border" style={{ borderColor: c.bdr, backgroundColor: c.bg, borderRadius: "3px" }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
              <span className="text-[10px] uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-mono)", color: c.color }}>{cat}</span>
              <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Grouped by category */}
      <div className="space-y-8">
        {patternCategories.map((cat) => {
          const c = CATEGORY_COLOR[cat];
          const catPatterns = getPatternsByCategory(cat);
          return (
            <section key={cat}>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-1 h-4 rounded-full" style={{ backgroundColor: c.color }} />
                <h2 className="text-[11px] uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-mono)", color: c.color }}>{cat}</h2>
                <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>— {catPatterns.length} pattern{catPatterns.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {catPatterns.map((p) => <PatternCard key={p.id} pattern={p} onSelect={onSelect} />)}
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
    <div className="px-10 py-10 max-w-5xl responsive-padding">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Module</p>
        <h1 className="page-title mb-2" style={{ fontFamily: "var(--font-heading)" }}>Design Patterns</h1>
        <p className="text-sm max-w-xl leading-relaxed" style={{ color: "var(--text-mid)" }}>
          {selected
            ? "Pattern detail — problem, HCI principle, examples, and trade-offs."
            : `${patterns.length} HCI patterns across ${patternCategories.length} categories. Click any pattern to explore the detail view and add your own annotations.`}
        </p>
      </div>

      {selected ? (
        <PatternDetail pattern={selected} onBack={() => setSelected(null)} />
      ) : (
        <PatternLibrary onSelect={setSelected} />
      )}
    </div>
  );
}
