import Link from "next/link";
import { scenarios } from "@/lib/scenarios";
import type { SeverityLevel, LensTag } from "@/lib/scenarios";

// ── Clark palette tokens ──────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<SeverityLevel, { label: string; color: string; bg: string; bdr: string }> = {
  critical: { label: "Critical", color: "#7a3828", bg: "#f5ecea", bdr: "#d4aca4" },
  high:     { label: "High",     color: "#c8924a", bg: "#f5ede0", bdr: "#d8c4a4" },
  medium:   { label: "Medium",   color: "#6b6560", bg: "#e8e5e1", bdr: "#b8b4ac" },
};

const LENS_CONFIG: Record<LensTag, { color: string; bg: string; bdr: string }> = {
  Analyst:   { color: "#5a7c3a", bg: "#edf4e4", bdr: "#b0cc90" },
  Commander: { color: "#3d7a8a", bg: "#e8f2f5", bdr: "#a8ccd8" },
  HCI:       { color: "#7a3828", bg: "#f5ecea", bdr: "#d4aca4" },
};

export default function ScenariosPage() {
  return (
    <div style={{ padding: "48px 56px 80px", maxWidth: "980px" }}>

      {/* Header */}
      <div style={{ marginBottom: "40px", paddingBottom: "22px", borderBottom: "1px solid var(--border)" }}>
        <p style={{
          fontFamily: "var(--font-mono)", fontSize: "8px",
          letterSpacing: "0.28em", textTransform: "uppercase",
          color: "var(--text-dim)", marginBottom: "10px",
        }}>
          Module 01 — Scenario Intelligence
        </p>
        <h1 style={{
          fontSize: "26px", fontWeight: 600, color: "var(--text)",
          letterSpacing: "-0.02em", marginBottom: "10px",
        }}>
          Incident Library
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-mid)", lineHeight: 1.65, maxWidth: "480px" }}>
          Six landmark cyber incidents analysed through the Analyst, Commander,
          and HCI/UX lenses. Select a scenario to generate a full AI-powered breakdown.
        </p>
      </div>

      {/* Scenario grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1px",
        background: "var(--border)",
      }}>
        {scenarios.map((scenario) => {
          const severity = SEVERITY_CONFIG[scenario.severity];
          return (
            <Link
              key={scenario.slug}
              href={`/scenarios/${scenario.slug}`}
              style={{ textDecoration: "none", display: "block" }}
            >
              <div
                style={{
                  background: "var(--bg-card)",
                  padding: "22px 24px",
                  height: "100%",
                  cursor: "pointer",
                  transition: "background 0.12s",
                  position: "relative",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-card)")}
              >
                {/* Top row: severity + date */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "8px",
                    letterSpacing: "0.18em", textTransform: "uppercase",
                    padding: "2px 7px", border: `1px solid ${severity.bdr}`,
                    color: severity.color, background: severity.bg,
                  }}>
                    {severity.label}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)" }}>
                    {scenario.date}
                  </span>
                </div>

                {/* Name */}
                <h2 style={{
                  fontSize: "15px", fontWeight: 500, color: "var(--text)",
                  marginBottom: "4px", lineHeight: 1.3, letterSpacing: "-0.01em",
                }}>
                  {scenario.name}
                </h2>

                {/* Type + sector */}
                <p style={{
                  fontFamily: "var(--font-mono)", fontSize: "9px",
                  color: "var(--text-dim)", marginBottom: "12px", letterSpacing: "0.04em",
                }}>
                  {scenario.type} · {scenario.sector}
                </p>

                {/* Summary */}
                <p style={{
                  fontSize: "12px", color: "var(--text-mid)",
                  lineHeight: 1.65, marginBottom: "16px",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                  {scenario.summary}
                </p>

                {/* Lens tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "14px" }}>
                  {scenario.tags.map((tag) => {
                    const lens = LENS_CONFIG[tag];
                    return (
                      <span
                        key={tag}
                        style={{
                          fontFamily: "var(--font-mono)", fontSize: "8px",
                          letterSpacing: "0.14em", textTransform: "uppercase",
                          padding: "2px 7px", border: `1px solid ${lens.bdr}`,
                          color: lens.color, background: lens.bg,
                        }}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>

                {/* Hover caret */}
                <p style={{
                  fontFamily: "var(--font-mono)", fontSize: "9px",
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  color: "var(--oak)", opacity: 0, transition: "opacity 0.12s",
                }}
                  className="scenario-caret"
                >
                  Analyse →
                </p>

                {/* Oak inlay on hover — via CSS */}
                <style>{`
                  a:hover .scenario-caret { opacity: 1 !important; }
                `}</style>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer note */}
      <p style={{
        marginTop: "20px", fontFamily: "var(--font-mono)", fontSize: "9px",
        color: "var(--text-dim)",
      }}>
        Analyses are AI-generated and cached for 7 days. First load may take a few seconds.
      </p>
    </div>
  );
}
