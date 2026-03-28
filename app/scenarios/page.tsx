import Link from "next/link";
import { scenarios } from "@/lib/scenarios";
import type { SeverityLevel, LensTag } from "@/lib/scenarios";

// ── Design-token constants ─────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<
  SeverityLevel,
  { label: string; color: string }
> = {
  critical: { label: "CRITICAL", color: "#e8854a" },
  high: { label: "HIGH", color: "#c9a96e" },
  medium: { label: "MEDIUM", color: "#9d9080" },
};

const LENS_CONFIG: Record<LensTag, { color: string }> = {
  Analyst: { color: "#4eb8a0" },
  Commander: { color: "#7b9fd4" },
  HCI: { color: "#e8854a" },
};

export default function ScenariosPage() {
  return (
    <div className="px-10 py-10 max-w-5xl">
      {/* Page header */}
      <div className="mb-10">
        <p
          className="text-[10px] uppercase tracking-[0.3em] text-[#9d9080] mb-3"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Module 01 — Scenario Intelligence
        </p>
        <h1
          className="text-4xl font-bold text-[#e8e0d4] mb-3 leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Incident Library
        </h1>
        <p className="text-[#9d9080] text-sm max-w-xl leading-relaxed">
          Six landmark cyber incidents analysed through the Analyst, Commander,
          and HCI/UX lenses. Select a scenario to generate a full AI‑powered
          breakdown.
        </p>
      </div>

      {/* Scenario grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((scenario) => {
          const severity = SEVERITY_CONFIG[scenario.severity];
          return (
            <Link
              key={scenario.slug}
              href={`/scenarios/${scenario.slug}`}
              className="group block bg-[#161412] border border-[#2a2520] rounded-lg p-5 hover:border-[#4eb8a0]/40 transition-all hover:shadow-[0_0_24px_rgba(78,184,160,0.06)]"
            >
              {/* Top row: severity + type */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-[9px] uppercase tracking-[0.25em] px-2 py-0.5 rounded-sm border"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: severity.color,
                    borderColor: severity.color + "50",
                    backgroundColor: severity.color + "12",
                  }}
                >
                  {severity.label}
                </span>
                <span
                  className="text-[9px] text-[#9d9080]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {scenario.date}
                </span>
              </div>

              {/* Name */}
              <h2
                className="text-base font-semibold text-[#e8e0d4] mb-1 group-hover:text-white transition-colors"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {scenario.name}
              </h2>

              {/* Type + sector */}
              <p
                className="text-[10px] text-[#9d9080] mb-3"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {scenario.type} &middot; {scenario.sector}
              </p>

              {/* Summary */}
              <p className="text-xs text-[#9d9080] leading-relaxed line-clamp-3 mb-4">
                {scenario.summary}
              </p>

              {/* Lens tags */}
              <div className="flex flex-wrap gap-1.5">
                {scenario.tags.map((tag) => {
                  const lens = LENS_CONFIG[tag];
                  return (
                    <span
                      key={tag}
                      className="text-[9px] tracking-[0.15em] px-2 py-0.5 rounded-sm border"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: lens.color,
                        borderColor: lens.color + "40",
                        backgroundColor: lens.color + "10",
                      }}
                    >
                      {tag.toUpperCase()}
                    </span>
                  );
                })}
              </div>

              {/* Hover caret */}
              <div
                className="mt-4 text-[10px] tracking-[0.15em] text-[#4eb8a0] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                ANALYSE →
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer note */}
      <p
        className="mt-8 text-[10px] text-[#9d9080]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Analyses are AI-generated and cached for 7 days. First load may take a
        few seconds.
      </p>
    </div>
  );
}
