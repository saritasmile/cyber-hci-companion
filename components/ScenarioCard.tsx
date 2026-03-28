"use client";

import Link from "next/link";
import { useState } from "react";
import type { SeverityLevel, LensTag } from "@/lib/scenarios";

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

interface ScenarioCardProps {
  slug: string;
  severity: SeverityLevel;
  date: string;
  name: string;
  type: string;
  sector: string;
  summary: string;
  tags: LensTag[];
}

export default function ScenarioCard({
  slug, severity, date, name, type, sector, summary, tags,
}: ScenarioCardProps) {
  const [hovered, setHovered] = useState(false);
  const sev = SEVERITY_CONFIG[severity];

  return (
    <Link href={`/scenarios/${slug}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          background: hovered ? "var(--bg-hover)" : "var(--bg-card)",
          padding: "22px 24px",
          height: "100%",
          cursor: "pointer",
          transition: "background 0.12s",
          position: "relative",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Top row: severity + date */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: "8px",
            letterSpacing: "0.18em", textTransform: "uppercase",
            padding: "2px 7px", border: `1px solid ${sev.bdr}`,
            color: sev.color, background: sev.bg,
          }}>
            {sev.label}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)" }}>
            {date}
          </span>
        </div>

        {/* Name */}
        <h2 style={{
          fontSize: "15px", fontWeight: 500, color: "var(--text)",
          marginBottom: "4px", lineHeight: 1.3, letterSpacing: "-0.01em",
        }}>
          {name}
        </h2>

        {/* Type + sector */}
        <p style={{
          fontFamily: "var(--font-mono)", fontSize: "9px",
          color: "var(--text-dim)", marginBottom: "12px", letterSpacing: "0.04em",
        }}>
          {type} · {sector}
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
          {summary}
        </p>

        {/* Lens tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "14px" }}>
          {tags.map((tag) => {
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

        {/* Analyse caret */}
        <p style={{
          fontFamily: "var(--font-mono)", fontSize: "9px",
          letterSpacing: "0.14em", textTransform: "uppercase",
          color: "var(--oak)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.12s",
        }}>
          Analyse →
        </p>
      </div>
    </Link>
  );
}
