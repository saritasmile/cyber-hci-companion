"use client";

import Link from "next/link";
import { useState } from "react";
import type { SeverityLevel, LensTag } from "@/lib/scenarios";

// ── All colors driven by CSS variables from globals.css ───────────────────────

const SEVERITY_CONFIG = {
  critical: { label: "Critical", color: "var(--clay)",     bg: "var(--clay-bg)",   bdr: "var(--clay-bdr)"  },
  high:     { label: "High",     color: "var(--oak)",      bg: "var(--oak-bg)",    bdr: "var(--oak-bdr)"   },
  medium:   { label: "Medium",   color: "var(--text-dim)", bg: "var(--bg-subtle)", bdr: "var(--border)"    },
};

const LENS_CONFIG: Record<LensTag, { color: string; bg: string; bdr: string }> = {
  Analyst:   { color: "var(--leaf)", bg: "var(--leaf-bg)", bdr: "var(--leaf-bdr)" },
  Commander: { color: "var(--pool)", bg: "var(--pool-bg)", bdr: "var(--pool-bdr)" },
  HCI:       { color: "var(--clay)", bg: "var(--clay-bg)", bdr: "var(--clay-bdr)" },
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
          fontFamily: "var(--font-body)",
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

        {/* Summary — bumped to 13px, full --text for readability */}
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: "13px", color: "var(--text)",
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
              <span key={tag} style={{
                fontFamily: "var(--font-mono)", fontSize: "8px",
                letterSpacing: "0.14em", textTransform: "uppercase",
                padding: "2px 7px", border: `1px solid ${lens.bdr}`,
                color: lens.color, background: lens.bg,
              }}>
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
