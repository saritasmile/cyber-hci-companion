"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { scenarios } from "@/lib/scenarios";
import { supabase } from "@/lib/supabase";
import type { ScenarioAnalysis, TimelineEvent, IncidentStage, CIAImpact } from "@/lib/scenarios";

// ── Tab definitions ───────────────────────────────────────────────────────────

interface TabDef {
  id: keyof ScenarioAnalysis;
  label: string;
  accent: string;
  shortLabel: string;
}

const TABS: TabDef[] = [
  { id: "overview",          label: "Overview",          shortLabel: "Overview",   accent: "#8a5a1a" },
  { id: "analyst",           label: "Analyst View",      shortLabel: "Analyst",    accent: "#0a7a68" },
  { id: "commander",         label: "Commander View",    shortLabel: "Commander",  accent: "#1a4e8a" },
  { id: "hci",               label: "HCI / UX",          shortLabel: "HCI",        accent: "#c04a0a" },
  { id: "design_lessons",    label: "Design Lessons",    shortLabel: "Lessons",    accent: "#6a3a9a" },
  { id: "incident_timeline", label: "Incident Timeline", shortLabel: "Timeline",   accent: "#1a6a5a" },
];

// ── UI primitives ─────────────────────────────────────────────────────────────

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
        <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "var(--text)" }}>
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

// ── CIA badge ─────────────────────────────────────────────────────────────────

const CIA_CONFIG: Record<CIAImpact, { label: string; color: string; bg: string; bdr: string; abbr: string }> = {
  availability:   { label: "Availability",   abbr: "A", color: "#c04a0a", bg: "#fdf0e8", bdr: "#f0c4a0" },
  confidentiality:{ label: "Confidentiality",abbr: "C", color: "#1a4e8a", bg: "#e8f0fa", bdr: "#a8c4e8" },
  integrity:      { label: "Integrity",       abbr: "I", color: "#0a7a68", bg: "#e8f5f2", bdr: "#b0dbd4" },
};

function CIABadge({ impact }: { impact: CIAImpact }) {
  const cfg = CIA_CONFIG[impact];
  return (
    <span
      className="text-[9px] tracking-[0.15em] px-2 py-0.5 border"
      style={{
        fontFamily: "var(--font-mono)",
        color: cfg.color,
        borderColor: cfg.bdr,
        backgroundColor: cfg.bg,
        borderRadius: "2px",
      }}
      title={cfg.label}
    >
      {cfg.label.toUpperCase()}
    </span>
  );
}

// ── Incident Timeline Tab ─────────────────────────────────────────────────────

function IncidentTimelineTab({
  data,
  accent,
}: {
  data: ScenarioAnalysis["incident_timeline"];
  accent: string;
}) {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <Card>
        <SectionLabel>Incident Arc</SectionLabel>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
          {data.summary}
        </p>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical spine */}
        <div
          className="absolute left-[18px] top-0 bottom-0 w-px"
          style={{ backgroundColor: "var(--border)" }}
        />

        <div className="space-y-3">
          {data.stages.map((stage, i) => {
            const isExpanded = expanded === i;
            const isFirst = i === 0;

            // Determine dominant CIA colour for the node dot
            const dominantCIA = stage.cia_impacts[0]
              ? CIA_CONFIG[stage.cia_impacts[0]]
              : null;

            return (
              <div key={i} className="relative pl-11">
                {/* Node dot */}
                <div
                  className="absolute left-0 top-3 w-[38px] flex items-center justify-center"
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{
                      borderColor: dominantCIA ? dominantCIA.color : accent,
                      backgroundColor: dominantCIA ? dominantCIA.bg : "var(--bg)",
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: dominantCIA ? dominantCIA.color : accent }}
                    />
                  </div>
                </div>

                {/* Card */}
                <div
                  className="card overflow-hidden transition-all"
                  style={{
                    borderColor: isExpanded ? (dominantCIA ? dominantCIA.bdr : "var(--border)") : "var(--border)",
                  }}
                >
                  {/* Header row — always visible, click to expand */}
                  <button
                    className="w-full text-left px-4 py-3 flex items-center gap-3"
                    onClick={() => setExpanded(isExpanded ? null : i)}
                  >
                    {/* Stage index + elapsed */}
                    <div className="shrink-0 flex flex-col items-center gap-0.5 w-14">
                      <span
                        className="text-[8px] uppercase tracking-[0.2em]"
                        style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}
                      >
                        {isFirst ? "T+0" : stage.elapsed}
                      </span>
                    </div>

                    {/* Stage name */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold tracking-[0.05em]"
                        style={{ fontFamily: "var(--font-mono)", color: isExpanded ? accent : "var(--text)" }}
                      >
                        {stage.stage.toUpperCase()}
                      </p>
                      <p
                        className="text-[10px] truncate"
                        style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}
                      >
                        {stage.timestamp}
                      </p>
                    </div>

                    {/* CIA badges */}
                    <div className="hidden sm:flex gap-1 shrink-0">
                      {stage.cia_impacts.map((impact) => (
                        <CIABadge key={impact} impact={impact} />
                      ))}
                    </div>

                    {/* Expand chevron */}
                    <span
                      className="shrink-0 text-[10px] transition-transform ml-1"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-dim)",
                        display: "inline-block",
                        transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                      }}
                    >
                      ›
                    </span>
                  </button>

                  {/* Expanded body */}
                  {isExpanded && (
                    <div
                      className="px-4 pb-4 space-y-4"
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      {/* Description */}
                      <div className="pt-4">
                        <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                          {stage.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Who was involved */}
                        <div>
                          <SectionLabel>Who was involved</SectionLabel>
                          <ul className="space-y-1.5">
                            {stage.who_involved.map((who, j) => (
                              <li
                                key={j}
                                className="flex gap-2 text-xs leading-relaxed"
                                style={{ color: "var(--text)" }}
                              >
                                <span
                                  className="mt-1 shrink-0 w-1 h-1 rounded-full"
                                  style={{ backgroundColor: accent }}
                                />
                                {who}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Key action */}
                        <div>
                          <SectionLabel>Key action</SectionLabel>
                          <p
                            className="text-xs leading-relaxed px-3 py-2 rounded"
                            style={{
                              color: "var(--text)",
                              backgroundColor: accent + "10",
                              borderLeft: `2px solid ${accent}`,
                            }}
                          >
                            {stage.key_action}
                          </p>
                        </div>
                      </div>

                      {/* How awareness spread */}
                      <div>
                        <SectionLabel>How awareness spread</SectionLabel>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-mid)" }}>
                          {stage.how_spread}
                        </p>
                      </div>

                      {/* CIA impact */}
                      <div>
                        <SectionLabel>CIA impact at this stage</SectionLabel>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {stage.cia_impacts.map((impact) => (
                            <CIABadge key={impact} impact={impact} />
                          ))}
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-mid)" }}>
                          {stage.cia_rationale}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CIA legend */}
      <div className="card p-4">
        <SectionLabel>CIA Triad Legend</SectionLabel>
        <div className="flex flex-wrap gap-3">
          {(Object.entries(CIA_CONFIG) as [CIAImpact, typeof CIA_CONFIG[CIAImpact]][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2">
              <CIABadge impact={key} />
              <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                — {key === "availability" ? "systems/services disrupted"
                  : key === "confidentiality" ? "data accessed or exfiltrated"
                  : "data or systems altered"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab renderers ─────────────────────────────────────────────────────────────

function OverviewTab({ data, accent }: { data: ScenarioAnalysis["overview"]; accent: string }) {
  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>What happened</SectionLabel>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{data.what_happened}</p>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card><SectionLabel>Scale & Impact</SectionLabel><p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{data.scale}</p></Card>
        <Card><SectionLabel>Attribution</SectionLabel><p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{data.attribution}</p></Card>
      </div>
      <Card>
        <SectionLabel>Timeline</SectionLabel>
        <div className="space-y-0">
          {data.timeline.map((ev: TimelineEvent, i: number) => (
            <div key={i} className="flex gap-4 py-2.5 last:border-0" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="shrink-0 text-[10px] w-28 pt-0.5" style={{ fontFamily: "var(--font-mono)", color: accent }}>{ev.date}</span>
              <span className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{ev.event}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AnalystTab({ data, accent }: { data: ScenarioAnalysis["analyst"]; accent: string }) {
  return (
    <div className="space-y-5">
      <Card><SectionLabel>Technical Summary</SectionLabel><p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{data.summary}</p></Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card><SectionLabel>Detection Methods</SectionLabel><BulletList items={data.detection} accent={accent} /></Card>
        <Card><SectionLabel>Indicators of Compromise</SectionLabel><BulletList items={data.iocs} accent={accent} /></Card>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card><SectionLabel>Response Gaps</SectionLabel><BulletList items={data.response_gaps} accent={accent} /></Card>
        <Card><SectionLabel>Tools & Systems Implicated</SectionLabel><BulletList items={data.tools_implicated} accent={accent} /></Card>
      </div>
    </div>
  );
}

function CommanderTab({ data, accent }: { data: ScenarioAnalysis["commander"]; accent: string }) {
  return (
    <div className="space-y-5">
      <Card><SectionLabel>Executive Summary</SectionLabel><p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{data.summary}</p></Card>
      <Card><SectionLabel>Critical Decision Points</SectionLabel><BulletList items={data.decisions} accent={accent} /></Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card><SectionLabel>Risk Framing</SectionLabel><p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{data.risk_framing}</p></Card>
        <Card><SectionLabel>Disclosure</SectionLabel><p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{data.disclosure}</p></Card>
      </div>
      <Card><SectionLabel>Policy Impact</SectionLabel><p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{data.policy_impact}</p></Card>
    </div>
  );
}

function HCITab({ data, accent }: { data: ScenarioAnalysis["hci"]; accent: string }) {
  return (
    <div className="space-y-5">
      <Card><SectionLabel>Human Factors Summary</SectionLabel><p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{data.summary}</p></Card>
      <Card><SectionLabel>Cognitive Load Analysis</SectionLabel><p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{data.cognitive_load}</p></Card>
      <Card><SectionLabel>Interface & UX Failures</SectionLabel><BulletList items={data.failures} accent={accent} /></Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card><SectionLabel>Design Questions</SectionLabel><BulletList items={data.design_questions} accent={accent} /></Card>
        <Card><SectionLabel>Research Angles</SectionLabel><BulletList items={data.research_angles} accent={accent} /></Card>
      </div>
    </div>
  );
}

function DesignLessonsTab({ data, accent }: { data: ScenarioAnalysis["design_lessons"]; accent: string }) {
  return (
    <div className="space-y-5">
      <Card><SectionLabel>Summary</SectionLabel><p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{data.summary}</p></Card>
      <Card><SectionLabel>Actionable Design Lessons</SectionLabel><BulletList items={data.lessons} accent={accent} /></Card>
      <Card><SectionLabel>Pattern Connections</SectionLabel><BulletList items={data.pattern_connections} accent={accent} /></Card>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton({ accent }: { accent: string }) {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-5">
          <div className="h-2 w-24 rounded mb-4" style={{ backgroundColor: accent + "30" }} />
          <div className="space-y-2">
            <div className="h-3 rounded w-full skeleton-line" />
            <div className="h-3 rounded w-5/6 skeleton-line" />
            <div className="h-3 rounded w-4/6 skeleton-line" />
          </div>
        </div>
      ))}
      <p className="text-center text-[10px] pt-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
        Generating analysis — this may take 10–20 seconds…
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ScenarioDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : params.slug?.[0] ?? "";
  const scenario = scenarios.find((s) => s.slug === slug);

  const [analysis, setAnalysis] = useState<ScenarioAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<keyof ScenarioAnalysis>("overview");

  const fetchAnalysis = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/scenarios/${slug}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setAnalysis(await res.json() as ScenarioAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const recordKnowledgeMapEntry = useCallback(async () => {
    if (!slug) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: existing } = await supabase
        .from("knowledge_map_entries").select("id, visit_count")
        .eq("user_id", user.id).eq("topic", slug).eq("module", "scenario").maybeSingle();
      if (existing) {
        await supabase.from("knowledge_map_entries")
          .update({ visit_count: existing.visit_count + 1, last_visited: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("knowledge_map_entries").insert({
          user_id: user.id, topic: slug, module: "scenario",
          depth_level: "touched", visit_count: 1, last_visited: new Date().toISOString(),
        });
      }
    } catch { /* Non-critical */ }
  }, [slug]);

  useEffect(() => {
    fetchAnalysis();
    recordKnowledgeMapEntry();
  }, [fetchAnalysis, recordKnowledgeMapEntry]);

  const activeTabDef = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  if (!scenario) {
    return (
      <div className="px-10 py-10">
        <p className="text-sm" style={{ color: "var(--text-dim)" }}>Scenario not found.</p>
        <Link href="/scenarios" className="text-sm" style={{ fontFamily: "var(--font-mono)", color: "#0a7a68" }}>← Back to library</Link>
      </div>
    );
  }

  const tagColorMap: Record<string, { color: string; bg: string; bdr: string }> = {
    Analyst:   { color: "#0a7a68", bg: "#e8f5f2", bdr: "#b0dbd4" },
    Commander: { color: "#1a4e8a", bg: "#e8f0fa", bdr: "#a8c4e8" },
    HCI:       { color: "#c04a0a", bg: "#fdf0e8", bdr: "#f0c4a0" },
  };

  return (
    <div className="px-10 py-10 max-w-4xl responsive-padding">
      {/* Breadcrumb */}
      <Link
        href="/scenarios"
        className="text-[10px] tracking-[0.2em] uppercase mb-6 inline-block transition-colors"
        style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}
      >
        ← Scenario Library
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className="text-[9px] tracking-[0.2em] px-2 py-0.5 border"
            style={{ fontFamily: "var(--font-mono)", color: "#c04a0a", borderColor: "#f0c4a0", backgroundColor: "#fdf0e8", borderRadius: "2px" }}
          >
            {scenario.severity.toUpperCase()}
          </span>
          <span className="text-[9px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
            {scenario.type} &middot; {scenario.sector} &middot; {scenario.date}
          </span>
        </div>
        <h1 className="page-title mb-3" style={{ fontFamily: "var(--font-heading)" }}>{scenario.name}</h1>
        <p className="text-sm max-w-2xl leading-relaxed" style={{ color: "var(--text-mid)" }}>{scenario.summary}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {scenario.tags.map((tag) => {
            const t = tagColorMap[tag] ?? { color: "var(--text-dim)", bg: "var(--bg-subtle)", bdr: "var(--border)" };
            return (
              <span key={tag} className="text-[9px] tracking-[0.15em] px-2 py-0.5 border"
                style={{ fontFamily: "var(--font-mono)", color: t.color, borderColor: t.bdr, backgroundColor: t.bg, borderRadius: "2px" }}>
                {tag.toUpperCase()}
              </span>
            );
          })}
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-0 mb-6 overflow-x-auto"
        style={{ borderBottom: "2px solid var(--border)", scrollbarWidth: "none" } as React.CSSProperties}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative shrink-0 px-4 py-3 text-[11px] tracking-[0.12em] uppercase transition-colors"
              style={{
                fontFamily: "var(--font-mono)",
                color: isActive ? tab.accent : "var(--text-dim)",
                borderBottom: isActive ? `3px solid ${tab.accent}` : "3px solid transparent",
                marginBottom: "-2px",
                backgroundColor: "transparent",
              }}
            >
              {isActive && <span className="absolute inset-0 rounded-t" style={{ backgroundColor: tab.accent + "12" }} />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton accent={activeTabDef.accent} />
      ) : error ? (
        <div className="card p-6" style={{ borderColor: "#f0c4a0" }}>
          <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "var(--font-mono)", color: "#c04a0a" }}>Error</p>
          <p className="text-sm mb-4" style={{ color: "var(--text-mid)" }}>{error}</p>
          <button onClick={fetchAnalysis} className="text-[10px] tracking-[0.15em] uppercase" style={{ fontFamily: "var(--font-mono)", color: "#0a7a68" }}>Retry →</button>
        </div>
      ) : analysis ? (
        <div>
          {activeTab === "overview"          && <OverviewTab          data={analysis.overview}          accent={activeTabDef.accent} />}
          {activeTab === "analyst"           && <AnalystTab           data={analysis.analyst}           accent={activeTabDef.accent} />}
          {activeTab === "commander"         && <CommanderTab         data={analysis.commander}         accent={activeTabDef.accent} />}
          {activeTab === "hci"               && <HCITab               data={analysis.hci}               accent={activeTabDef.accent} />}
          {activeTab === "design_lessons"    && <DesignLessonsTab     data={analysis.design_lessons}    accent={activeTabDef.accent} />}
          {activeTab === "incident_timeline" && (
            analysis.incident_timeline ? (
              <IncidentTimelineTab data={analysis.incident_timeline} accent={activeTabDef.accent} />
            ) : (
              <div className="card p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
                  Timeline not available
                </p>
                <p className="text-sm mb-4" style={{ color: "var(--text-mid)" }}>
                  This scenario was cached before the timeline feature was added. Regenerate the analysis to include it.
                </p>
                <button
                  onClick={fetchAnalysis}
                  className="text-[10px] tracking-[0.15em] uppercase"
                  style={{ fontFamily: "var(--font-mono)", color: "#0a7a68" }}
                >
                  Regenerate →
                </button>
              </div>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}
