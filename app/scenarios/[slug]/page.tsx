"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { scenarios } from "@/lib/scenarios";
import { supabase } from "@/lib/supabase";
import type { ScenarioAnalysis, TimelineEvent } from "@/lib/scenarios";

// ── Tab definitions — one colour per lens ────────────────────────────────────

interface TabDef {
  id: keyof ScenarioAnalysis;
  label: string;
  accent: string;
  shortLabel: string;
}

const TABS: TabDef[] = [
  {
    id: "overview",
    label: "Overview",
    shortLabel: "Overview",
    accent: "#c9a96e",
  },
  {
    id: "analyst",
    label: "Analyst View",
    shortLabel: "Analyst",
    accent: "#4eb8a0",
  },
  {
    id: "commander",
    label: "Commander View",
    shortLabel: "Commander",
    accent: "#7b9fd4",
  },
  {
    id: "hci",
    label: "HCI / UX",
    shortLabel: "HCI",
    accent: "#e8854a",
  },
  {
    id: "design_lessons",
    label: "Design Lessons",
    shortLabel: "Lessons",
    accent: "#b07fd4",
  },
];

// ── Small UI primitives ───────────────────────────────────────────────────────

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

function BulletList({
  items,
  accent,
}: {
  items: string[];
  accent: string;
}) {
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

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#161412] border border-[#2a2520] rounded-lg p-5 ${className}`}>
      {children}
    </div>
  );
}

// ── Tab content renderers ─────────────────────────────────────────────────────

function OverviewTab({ data, accent }: { data: ScenarioAnalysis["overview"]; accent: string }) {
  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>What happened</SectionLabel>
        <p className="text-sm text-[#e8e0d4] leading-relaxed">{data.what_happened}</p>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <SectionLabel>Scale & Impact</SectionLabel>
          <p className="text-sm text-[#e8e0d4] leading-relaxed">{data.scale}</p>
        </Card>
        <Card>
          <SectionLabel>Attribution</SectionLabel>
          <p className="text-sm text-[#e8e0d4] leading-relaxed">{data.attribution}</p>
        </Card>
      </div>

      <Card>
        <SectionLabel>Timeline</SectionLabel>
        <div className="space-y-0">
          {data.timeline.map((ev: TimelineEvent, i: number) => (
            <div key={i} className="flex gap-4 py-2.5 border-b border-[#2a2520] last:border-0">
              <span
                className="shrink-0 text-[10px] w-28 pt-0.5"
                style={{ fontFamily: "var(--font-mono)", color: accent }}
              >
                {ev.date}
              </span>
              <span className="text-sm text-[#e8e0d4] leading-relaxed">{ev.event}</span>
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
      <Card>
        <SectionLabel>Technical Summary</SectionLabel>
        <p className="text-sm text-[#e8e0d4] leading-relaxed">{data.summary}</p>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <SectionLabel>Detection Methods</SectionLabel>
          <BulletList items={data.detection} accent={accent} />
        </Card>
        <Card>
          <SectionLabel>Indicators of Compromise</SectionLabel>
          <BulletList items={data.iocs} accent={accent} />
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <SectionLabel>Response Gaps</SectionLabel>
          <BulletList items={data.response_gaps} accent={accent} />
        </Card>
        <Card>
          <SectionLabel>Tools & Systems Implicated</SectionLabel>
          <BulletList items={data.tools_implicated} accent={accent} />
        </Card>
      </div>
    </div>
  );
}

function CommanderTab({ data, accent }: { data: ScenarioAnalysis["commander"]; accent: string }) {
  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>Executive Summary</SectionLabel>
        <p className="text-sm text-[#e8e0d4] leading-relaxed">{data.summary}</p>
      </Card>

      <Card>
        <SectionLabel>Critical Decision Points</SectionLabel>
        <BulletList items={data.decisions} accent={accent} />
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <SectionLabel>Risk Framing</SectionLabel>
          <p className="text-sm text-[#e8e0d4] leading-relaxed">{data.risk_framing}</p>
        </Card>
        <Card>
          <SectionLabel>Disclosure</SectionLabel>
          <p className="text-sm text-[#e8e0d4] leading-relaxed">{data.disclosure}</p>
        </Card>
      </div>

      <Card>
        <SectionLabel>Policy Impact</SectionLabel>
        <p className="text-sm text-[#e8e0d4] leading-relaxed">{data.policy_impact}</p>
      </Card>
    </div>
  );
}

function HCITab({ data, accent }: { data: ScenarioAnalysis["hci"]; accent: string }) {
  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>Human Factors Summary</SectionLabel>
        <p className="text-sm text-[#e8e0d4] leading-relaxed">{data.summary}</p>
      </Card>

      <Card>
        <SectionLabel>Cognitive Load Analysis</SectionLabel>
        <p className="text-sm text-[#e8e0d4] leading-relaxed">{data.cognitive_load}</p>
      </Card>

      <Card>
        <SectionLabel>Interface & UX Failures</SectionLabel>
        <BulletList items={data.failures} accent={accent} />
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <SectionLabel>Design Questions</SectionLabel>
          <BulletList items={data.design_questions} accent={accent} />
        </Card>
        <Card>
          <SectionLabel>Research Angles</SectionLabel>
          <BulletList items={data.research_angles} accent={accent} />
        </Card>
      </div>
    </div>
  );
}

function DesignLessonsTab({
  data,
  accent,
}: {
  data: ScenarioAnalysis["design_lessons"];
  accent: string;
}) {
  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>Summary</SectionLabel>
        <p className="text-sm text-[#e8e0d4] leading-relaxed">{data.summary}</p>
      </Card>

      <Card>
        <SectionLabel>Actionable Design Lessons</SectionLabel>
        <BulletList items={data.lessons} accent={accent} />
      </Card>

      <Card>
        <SectionLabel>Pattern Connections</SectionLabel>
        <BulletList items={data.pattern_connections} accent={accent} />
      </Card>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton({ accent }: { accent: string }) {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-[#161412] border border-[#2a2520] rounded-lg p-5"
        >
          <div
            className="h-2 w-24 rounded mb-4"
            style={{ backgroundColor: accent + "30" }}
          />
          <div className="space-y-2">
            <div className="h-3 bg-[#2a2520] rounded w-full" />
            <div className="h-3 bg-[#2a2520] rounded w-5/6" />
            <div className="h-3 bg-[#2a2520] rounded w-4/6" />
          </div>
        </div>
      ))}
      <p
        className="text-center text-[10px] text-[#9d9080] pt-2"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Generating analysis — this may take 10–20 seconds…
      </p>
    </div>
  );
}

// ── Main page component ───────────────────────────────────────────────────────

export default function ScenarioDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : params.slug?.[0] ?? "";

  const scenario = scenarios.find((s) => s.slug === slug);

  const [analysis, setAnalysis] = useState<ScenarioAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<keyof ScenarioAnalysis>("overview");

  // Fetch analysis from API (checks cache server-side)
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
      const data = await res.json();
      setAnalysis(data as ScenarioAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Record knowledge map entry (fire-and-forget)
  const recordKnowledgeMapEntry = useCallback(async () => {
    if (!slug) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Try to fetch existing entry first to increment visit_count
      const { data: existing } = await supabase
        .from("knowledge_map_entries")
        .select("id, visit_count")
        .eq("user_id", user.id)
        .eq("topic", slug)
        .eq("module", "scenario")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("knowledge_map_entries")
          .update({
            visit_count: existing.visit_count + 1,
            last_visited: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("knowledge_map_entries").insert({
          user_id: user.id,
          topic: slug,
          module: "scenario",
          depth_level: "touched",
          visit_count: 1,
          last_visited: new Date().toISOString(),
        });
      }
    } catch {
      // Non-critical — silently ignore failures
    }
  }, [slug]);

  useEffect(() => {
    fetchAnalysis();
    recordKnowledgeMapEntry();
  }, [fetchAnalysis, recordKnowledgeMapEntry]);

  const activeTabDef = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  if (!scenario) {
    return (
      <div className="px-10 py-10">
        <p className="text-[#9d9080] text-sm">Scenario not found.</p>
        <Link
          href="/scenarios"
          className="text-[#4eb8a0] text-sm"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          ← Back to library
        </Link>
      </div>
    );
  }

  return (
    <div className="px-10 py-10 max-w-4xl">
      {/* Breadcrumb */}
      <Link
        href="/scenarios"
        className="text-[#9d9080] hover:text-[#4eb8a0] transition-colors text-[10px] tracking-[0.2em] uppercase mb-6 inline-block"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        ← Scenario Library
      </Link>

      {/* Scenario header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className="text-[9px] tracking-[0.2em] px-2 py-0.5 rounded-sm border"
            style={{
              fontFamily: "var(--font-mono)",
              color: "#e8854a",
              borderColor: "#e8854a50",
              backgroundColor: "#e8854a12",
            }}
          >
            {scenario.severity.toUpperCase()}
          </span>
          <span
            className="text-[9px] text-[#9d9080]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {scenario.type} &middot; {scenario.sector} &middot; {scenario.date}
          </span>
        </div>

        <h1
          className="text-3xl font-bold text-[#e8e0d4] mb-3 leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {scenario.name}
        </h1>
        <p className="text-[#9d9080] text-sm max-w-2xl leading-relaxed">
          {scenario.summary}
        </p>

        {/* Lens tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {scenario.tags.map((tag) => {
            const colorMap: Record<string, string> = {
              Analyst: "#4eb8a0",
              Commander: "#7b9fd4",
              HCI: "#e8854a",
            };
            const color = colorMap[tag];
            return (
              <span
                key={tag}
                className="text-[9px] tracking-[0.15em] px-2 py-0.5 rounded-sm border"
                style={{
                  fontFamily: "var(--font-mono)",
                  color,
                  borderColor: color + "40",
                  backgroundColor: color + "10",
                }}
              >
                {tag.toUpperCase()}
              </span>
            );
          })}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-[#2a2520] mb-6 overflow-x-auto">
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
                borderBottom: isActive
                  ? `2px solid ${tab.accent}`
                  : "2px solid transparent",
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

      {/* Tab content */}
      {loading ? (
        <LoadingSkeleton accent={activeTabDef.accent} />
      ) : error ? (
        <div className="bg-[#161412] border border-[#e8854a]/30 rounded-lg p-6">
          <p
            className="text-[10px] uppercase tracking-[0.2em] text-[#e8854a] mb-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Error
          </p>
          <p className="text-sm text-[#9d9080] mb-4">{error}</p>
          <button
            onClick={fetchAnalysis}
            className="text-[10px] tracking-[0.15em] uppercase text-[#4eb8a0] hover:text-white transition-colors"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Retry →
          </button>
        </div>
      ) : analysis ? (
        <div>
          {activeTab === "overview" && (
            <OverviewTab data={analysis.overview} accent={activeTabDef.accent} />
          )}
          {activeTab === "analyst" && (
            <AnalystTab data={analysis.analyst} accent={activeTabDef.accent} />
          )}
          {activeTab === "commander" && (
            <CommanderTab data={analysis.commander} accent={activeTabDef.accent} />
          )}
          {activeTab === "hci" && (
            <HCITab data={analysis.hci} accent={activeTabDef.accent} />
          )}
          {activeTab === "design_lessons" && (
            <DesignLessonsTab
              data={analysis.design_lessons}
              accent={activeTabDef.accent}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
