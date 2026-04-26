"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { scenarios } from "@/lib/scenarios";
import { supabase } from "@/lib/supabase";
import type { ScenarioAnalysis, TimelineEvent, IncidentStage, CIAImpact } from "@/lib/scenarios";
import { JargonText } from "@/components/glossary/JargonText";

// ── Color config — all CSS variables ─────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: { label: "Critical", color: "var(--clay)",     bg: "var(--clay-bg)",   bdr: "var(--clay-bdr)"  },
  high:     { label: "High",     color: "var(--oak)",      bg: "var(--oak-bg)",    bdr: "var(--oak-bdr)"   },
  medium:   { label: "Medium",   color: "var(--text-dim)", bg: "var(--bg-subtle)", bdr: "var(--border)"    },
};

const TAG_CONFIG: Record<string, { color: string; bg: string; bdr: string }> = {
  Analyst:   { color: "var(--leaf)", bg: "var(--leaf-bg)", bdr: "var(--leaf-bdr)" },
  Commander: { color: "var(--pool)", bg: "var(--pool-bg)", bdr: "var(--pool-bdr)" },
  HCI:       { color: "var(--clay)", bg: "var(--clay-bg)", bdr: "var(--clay-bdr)" },
};

interface TabDef { id: keyof ScenarioAnalysis; label: string; accent: string; }

const TABS: TabDef[] = [
  { id: "overview",          label: "Overview",          accent: "var(--oak)"  },
  { id: "analyst",           label: "Analyst View",      accent: "var(--leaf)" },
  { id: "commander",         label: "Commander View",    accent: "var(--pool)" },
  { id: "hci",               label: "HCI / UX",          accent: "var(--clay)" },
  { id: "design_lessons",    label: "Design Lessons",    accent: "var(--oak)"  },
  { id: "incident_timeline", label: "Incident Timeline", accent: "var(--pool)" },
];

// ── CIA config — CSS variables ────────────────────────────────────────────────

const CIA_CONFIG: Record<CIAImpact, { label: string; color: string; bg: string; bdr: string }> = {
  availability:    { label: "Availability",    color: "var(--clay)", bg: "var(--clay-bg)", bdr: "var(--clay-bdr)" },
  confidentiality: { label: "Confidentiality", color: "var(--pool)", bg: "var(--pool-bg)", bdr: "var(--pool-bdr)" },
  integrity:       { label: "Integrity",       color: "var(--leaf)", bg: "var(--leaf-bg)", bdr: "var(--leaf-bdr)" },
};

// ── UI primitives ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "8px" }}>
      {children}
    </p>
  );
}

function BulletList({ items, accent, slug }: { items: string[]; accent: string; slug: string }) {
  return (
    <ul style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: "12px", fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: 1.7, color: "var(--text)" }}>
          <span style={{ marginTop: "7px", flexShrink: 0, width: "4px", height: "4px", background: accent }} />
          <JargonText text={item} sourceScenario={slug} />
        </li>
      ))}
    </ul>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "18px 20px", ...style }}>{children}</div>;
}

function CIABadge({ impact }: { impact: CIAImpact }) {
  const cfg = CIA_CONFIG[impact];
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "2px 7px", border: `1px solid ${cfg.bdr}`, color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

// ── Tab renderers ─────────────────────────────────────────────────────────────

function OverviewTab({ data, accent, slug }: { data: ScenarioAnalysis["overview"]; accent: string; slug: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card>
        <SectionLabel>What happened</SectionLabel>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: 1.75, color: "var(--text)" }}>
          <JargonText text={data.what_happened} sourceScenario={slug} />
        </p>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Card>
          <SectionLabel>Scale & Impact</SectionLabel>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: 1.7, color: "var(--text)" }}>
            <JargonText text={data.scale} sourceScenario={slug} />
          </p>
        </Card>
        <Card>
          <SectionLabel>Attribution</SectionLabel>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: 1.7, color: "var(--text)" }}>
            <JargonText text={data.attribution} sourceScenario={slug} />
          </p>
        </Card>
      </div>
      <Card>
        <SectionLabel>Timeline</SectionLabel>
        <div>
          {data.timeline.map((ev: TimelineEvent, i: number) => (
            <div key={i} style={{ display: "flex", gap: "16px", padding: "10px 0", borderBottom: i < data.timeline.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", width: "110px", flexShrink: 0, paddingTop: "2px", color: accent }}>{ev.date}</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: 1.65, color: "var(--text)" }}>
                <JargonText text={ev.event} sourceScenario={slug} />
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AnalystTab({ data, accent, slug }: { data: ScenarioAnalysis["analyst"]; accent: string; slug: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card>
        <SectionLabel>Technical Summary</SectionLabel>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: 1.75, color: "var(--text)" }}>
          <JargonText text={data.summary} sourceScenario={slug} />
        </p>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Card><SectionLabel>Detection Methods</SectionLabel><BulletList items={data.detection} accent={accent} slug={slug} /></Card>
        <Card><SectionLabel>Indicators of Compromise</SectionLabel><BulletList items={data.iocs} accent={accent} slug={slug} /></Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Card><SectionLabel>Response Gaps</SectionLabel><BulletList items={data.response_gaps} accent={accent} slug={slug} /></Card>
        <Card><SectionLabel>Tools & Systems Implicated</SectionLabel><BulletList items={data.tools_implicated} accent={accent} slug={slug} /></Card>
      </div>
    </div>
  );
}

function CommanderTab({ data, accent, slug }: { data: ScenarioAnalysis["commander"]; accent: string; slug: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card>
        <SectionLabel>Executive Summary</SectionLabel>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: 1.75, color: "var(--text)" }}>
          <JargonText text={data.summary} sourceScenario={slug} />
        </p>
      </Card>
      <Card><SectionLabel>Critical Decision Points</SectionLabel><BulletList items={data.decisions} accent={accent} slug={slug} /></Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Card>
          <SectionLabel>Risk Framing</SectionLabel>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: 1.7, color: "var(--text)" }}>
            <JargonText text={data.risk_framing} sourceScenario={slug} />
          </p>
        </Card>
        <Card>
          <SectionLabel>Disclosure</SectionLabel>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: 1.7, color: "var(--text)" }}>
            <JargonText text={data.disclosure} sourceScenario={slug} />
          </p>
        </Card>
      </div>
      <Card>
        <SectionLabel>Policy Impact</SectionLabel>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: 1.75, color: "var(--text)" }}>
          <JargonText text={data.policy_impact} sourceScenario={slug} />
        </p>
      </Card>
    </div>
  );
}

function HCITab({ data, accent, slug }: { data: ScenarioAnalysis["hci"]; accent: string; slug: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card>
        <SectionLabel>Human Factors Summary</SectionLabel>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: 1.75, color: "var(--text)" }}>
          <JargonText text={data.summary} sourceScenario={slug} />
        </p>
      </Card>
      <Card>
        <SectionLabel>Cognitive Load Analysis</SectionLabel>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: 1.75, color: "var(--text)" }}>
          <JargonText text={data.cognitive_load} sourceScenario={slug} />
        </p>
      </Card>
      <Card><SectionLabel>Interface & UX Failures</SectionLabel><BulletList items={data.failures} accent={accent} slug={slug} /></Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Card><SectionLabel>Design Questions</SectionLabel><BulletList items={data.design_questions} accent={accent} slug={slug} /></Card>
        <Card><SectionLabel>Research Angles</SectionLabel><BulletList items={data.research_angles} accent={accent} slug={slug} /></Card>
      </div>
    </div>
  );
}

function DesignLessonsTab({ data, accent, slug }: { data: ScenarioAnalysis["design_lessons"]; accent: string; slug: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card>
        <SectionLabel>Summary</SectionLabel>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: 1.75, color: "var(--text)" }}>
          <JargonText text={data.summary} sourceScenario={slug} />
        </p>
      </Card>
      <Card><SectionLabel>Actionable Design Lessons</SectionLabel><BulletList items={data.lessons} accent={accent} slug={slug} /></Card>
      <Card><SectionLabel>Pattern Connections</SectionLabel><BulletList items={data.pattern_connections} accent={accent} slug={slug} /></Card>
    </div>
  );
}

function IncidentTimelineTab({ data, accent, slug }: { data: ScenarioAnalysis["incident_timeline"]; accent: string; slug: string }) {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card>
        <SectionLabel>Incident Arc</SectionLabel>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: 1.75, color: "var(--text)" }}>
          <JargonText text={data.summary} sourceScenario={slug} />
        </p>
      </Card>

      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: "18px", top: 0, bottom: 0, width: "1px", background: "var(--border)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {data.stages.map((stage: IncidentStage, i: number) => {
            const isExpanded = expanded === i;
            const dominantCIA = stage.cia_impacts[0] ? CIA_CONFIG[stage.cia_impacts[0]] : null;
            return (
              <div key={i} style={{ paddingLeft: "44px", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: "12px", width: "38px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "16px", height: "16px", border: `2px solid ${dominantCIA ? dominantCIA.color : accent}`, background: dominantCIA ? dominantCIA.bg : "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "6px", height: "6px", background: dominantCIA ? dominantCIA.color : accent }} />
                  </div>
                </div>

                <div style={{ background: "var(--bg-card)", border: `1px solid ${isExpanded ? (dominantCIA ? dominantCIA.bdr : "var(--border)") : "var(--border)"}` }}>
                  <button style={{ width: "100%", textAlign: "left", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px", background: "transparent", border: "none", cursor: "pointer" }}
                    onClick={() => setExpanded(isExpanded ? null : i)}>
                    <div style={{ flexShrink: 0, width: "56px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--text-dim)" }}>{i === 0 ? "T+0" : stage.elapsed}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: isExpanded ? accent : "var(--text)", fontWeight: 500 }}>{stage.stage}</p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)" }}>{stage.timestamp}</p>
                    </div>
                    <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                      {stage.cia_impacts.map((impact: CIAImpact) => <CIABadge key={impact} impact={impact} />)}
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-dim)", transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>
                  </button>

                  {isExpanded && (
                    <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--border)" }}>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: 1.75, color: "var(--text)", marginTop: "14px", marginBottom: "14px" }}>
                        <JargonText text={stage.description} sourceScenario={slug} />
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "14px" }}>
                        <div>
                          <SectionLabel>Who was involved</SectionLabel>
                          <ul style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                            {stage.who_involved.map((who: string, j: number) => (
                              <li key={j} style={{ display: "flex", gap: "8px", fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text)" }}>
                                <span style={{ marginTop: "6px", width: "4px", height: "4px", background: accent, flexShrink: 0 }} />{who}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <SectionLabel>Key action</SectionLabel>
                          <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", lineHeight: 1.65, color: "var(--text)", padding: "8px 12px", background: `${accent}10`, borderLeft: `2px solid ${accent}` }}>
                            <JargonText text={stage.key_action} sourceScenario={slug} />
                          </p>
                        </div>
                      </div>
                      <div style={{ marginBottom: "14px" }}>
                        <SectionLabel>How awareness spread</SectionLabel>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", lineHeight: 1.65, color: "var(--text)" }}>
                          <JargonText text={stage.how_spread} sourceScenario={slug} />
                        </p>
                      </div>
                      <div>
                        <SectionLabel>CIA impact at this stage</SectionLabel>
                        <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                          {stage.cia_impacts.map((impact: CIAImpact) => <CIABadge key={impact} impact={impact} />)}
                        </div>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", lineHeight: 1.65, color: "var(--text-dim)" }}>{stage.cia_rationale}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Card>
        <SectionLabel>CIA Triad Legend</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          {(Object.entries(CIA_CONFIG) as [CIAImpact, typeof CIA_CONFIG[CIAImpact]][]).map(([key, cfg]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CIABadge impact={key} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-dim)" }}>
                {key === "availability" ? "systems/services disrupted" : key === "confidentiality" ? "data accessed or exfiltrated" : "data or systems altered"}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function LoadingSkeleton({ accent }: { accent: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "20px" }}>
          <div style={{ height: "8px", width: "80px", background: accent + "30", marginBottom: "16px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ height: "12px", background: "var(--bg-subtle)", width: "100%" }} />
            <div style={{ height: "12px", background: "var(--bg-subtle)", width: "83%" }} />
            <div style={{ height: "12px", background: "var(--bg-subtle)", width: "66%" }} />
          </div>
        </div>
      ))}
      <p style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)" }}>
        Generating analysis — this may take 10–20 seconds…
      </p>
    </div>
  );
}

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
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/scenarios/${slug}`);
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error ?? `HTTP ${res.status}`); }
      setAnalysis(await res.json() as ScenarioAnalysis);
    } catch (err) { setError(err instanceof Error ? err.message : "Unknown error"); } finally { setLoading(false); }
  }, [slug]);

  const recordKnowledgeMapEntry = useCallback(async () => {
    if (!slug) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: existing } = await supabase.from("knowledge_map_entries").select("id, visit_count").eq("user_id", user.id).eq("topic", slug).eq("module", "scenario").maybeSingle();
      if (existing) {
        await supabase.from("knowledge_map_entries").update({ visit_count: existing.visit_count + 1, last_visited: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await supabase.from("knowledge_map_entries").insert({ user_id: user.id, topic: slug, module: "scenario", depth_level: "touched", visit_count: 1, last_visited: new Date().toISOString() });
      }
    } catch { /* Non-critical */ }
  }, [slug]);

  useEffect(() => { fetchAnalysis(); recordKnowledgeMapEntry(); }, [fetchAnalysis, recordKnowledgeMapEntry]);

  const activeTabDef = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  if (!scenario) return (
    <div style={{ padding: "48px 56px" }}>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-dim)", marginBottom: "8px" }}>Scenario not found.</p>
      <Link href="/scenarios" style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--pool)" }}>← Back to library</Link>
    </div>
  );

  const severity = SEVERITY_CONFIG[scenario.severity] ?? SEVERITY_CONFIG.medium;

  return (
    <div style={{ padding: "48px 56px 80px", maxWidth: "900px" }}>
      <Link href="/scenarios" style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-dim)", textDecoration: "none", display: "inline-block", marginBottom: "24px", transition: "color 0.12s" }}>
        ← Scenario Library
      </Link>

      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", padding: "2px 7px", border: `1px solid ${severity.bdr}`, color: severity.color, background: severity.bg }}>
            {severity.label}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)" }}>{scenario.type} · {scenario.sector} · {scenario.date}</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-body)", fontSize: "26px", fontWeight: 500, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: "10px" }}>{scenario.name}</h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text)", lineHeight: 1.7, maxWidth: "640px", marginBottom: "14px" }}>{scenario.summary}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {scenario.tags.map((tag) => {
            const t = TAG_CONFIG[tag] ?? { color: "var(--text-dim)", bg: "var(--bg-subtle)", bdr: "var(--border)" };
            return (
              <span key={tag} style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "2px 7px", border: `1px solid ${t.bdr}`, color: t.color, background: t.bg }}>
                {tag}
              </span>
            );
          })}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "24px", overflowX: "auto" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ flexShrink: 0, padding: "10px 16px", fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: isActive ? tab.accent : "var(--text-dim)", borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: `2px solid ${isActive ? tab.accent : "transparent"}`, marginBottom: "-1px", background: "transparent", cursor: "pointer", transition: "color 0.12s" }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSkeleton accent={activeTabDef.accent} />
      ) : error ? (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--clay-bdr)", padding: "24px" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--clay)", marginBottom: "8px" }}>Error</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-mid)", marginBottom: "16px" }}>{error}</p>
          <button onClick={fetchAnalysis} style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--pool)", background: "none", border: "none", cursor: "pointer" }}>Retry →</button>
        </div>
      ) : analysis ? (
        <div>
          {activeTab === "overview"          && <OverviewTab         data={analysis.overview}          accent={activeTabDef.accent} slug={slug} />}
          {activeTab === "analyst"           && <AnalystTab          data={analysis.analyst}           accent={activeTabDef.accent} slug={slug} />}
          {activeTab === "commander"         && <CommanderTab        data={analysis.commander}         accent={activeTabDef.accent} slug={slug} />}
          {activeTab === "hci"               && <HCITab              data={analysis.hci}               accent={activeTabDef.accent} slug={slug} />}
          {activeTab === "design_lessons"    && <DesignLessonsTab    data={analysis.design_lessons}    accent={activeTabDef.accent} slug={slug} />}
          {activeTab === "incident_timeline" && (
            analysis.incident_timeline ? (
              <IncidentTimelineTab data={analysis.incident_timeline} accent={activeTabDef.accent} slug={slug} />
            ) : (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "24px" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "8px" }}>Timeline not available</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-mid)", marginBottom: "16px" }}>This scenario was cached before the timeline feature was added. Regenerate the analysis to include it.</p>
                <button onClick={fetchAnalysis} style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--pool)", background: "none", border: "none", cursor: "pointer" }}>Regenerate →</button>
              </div>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}
