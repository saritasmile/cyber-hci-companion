"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { KnowledgeMapEntryRow, KnowledgeModule, DepthLevel } from "@/types/database";

// ── Constants ─────────────────────────────────────────────────────────────────

const MODULE_COLOR: Record<KnowledgeModule, string> = {
  scenario: "#e8854a",
  study: "#4eb8a0",
  rabbit: "#7b9fd4",
  patterns: "#b07fd4",
  scan: "#c9a96e",
};

const MODULE_LABEL: Record<KnowledgeModule, string> = {
  scenario: "Scenario",
  study: "Study",
  rabbit: "Rabbit Hole",
  patterns: "Patterns",
  scan: "Horizon Scan",
};

const DEPTH_SIZE: Record<DepthLevel, number> = {
  touched: 7,
  explored: 13,
  deep: 21,
};

const DEPTH_OPACITY: Record<DepthLevel, number> = {
  touched: 0.45,
  explored: 0.75,
  deep: 1.0,
};

const DEPTH_LABEL: Record<DepthLevel, string> = {
  touched: "Touched",
  explored: "Explored",
  deep: "Deep",
};

// ── Routing ───────────────────────────────────────────────────────────────────

function getTopicHref(entry: KnowledgeMapEntryRow): string {
  switch (entry.module) {
    case "study":
      return `/study?topic=${encodeURIComponent(entry.topic)}`;
    case "rabbit":
      return `/rabbit`;
    case "scenario":
      return `/scenarios/${entry.topic}`;
    case "patterns":
      return `/patterns`;
    case "scan":
      return `/scan`;
    default:
      return "/";
  }
}

// ── Phyllotaxis layout ────────────────────────────────────────────────────────
// Distributes nodes using the golden angle spiral — no overlaps, looks organic.

function phyllotaxisPosition(
  index: number,
  total: number,
  cx: number,
  cy: number,
  maxRadius: number
): { x: number; y: number } {
  if (total <= 1) return { x: cx, y: cy };
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ≈ 137.5°
  const angle = index * goldenAngle;
  const r = Math.sqrt(index / (total - 1)) * maxRadius;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function MapSkeleton() {
  return (
    <div className="bg-[#161412] border border-[#2a2520] rounded-lg animate-pulse" style={{ height: 480 }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <p
          className="text-[10px] uppercase tracking-[0.2em] text-[#4a4540]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Loading map…
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function KnowledgeMapPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<KnowledgeMapEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; entry: KnowledgeMapEntryRow } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    async function fetchEntries() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      const { data, error: dbErr } = await supabase
        .from("knowledge_map_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("last_visited", { ascending: false });

      if (dbErr) {
        setError(dbErr.message);
      } else {
        setEntries(data ?? []);
      }
      setLoading(false);
    }

    fetchEntries();
  }, []);

  // ── Computed stats ────────────────────────────────────────────────────────

  const totalTopics = entries.length;
  const modulesExplored = new Set(entries.map((e) => e.module)).size;
  const mostVisited = entries.reduce<KnowledgeMapEntryRow | null>(
    (best, e) => (!best || e.visit_count > best.visit_count ? e : best),
    null
  );

  // ── SVG dimensions ────────────────────────────────────────────────────────

  const svgW = 800;
  const svgH = 480;
  const cx = svgW / 2;
  const cy = svgH / 2;
  const maxR = Math.min(cx, cy) - 30;

  // Assign positions
  const positioned = entries.map((entry, i) => {
    const pos = phyllotaxisPosition(i, entries.length, cx, cy, maxR);
    return { ...entry, ...pos };
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="px-10 py-10 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <p
          className="text-[10px] uppercase tracking-[0.25em] text-[#9d9080] mb-1"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Overview
        </p>
        <h1
          className="text-3xl font-bold text-[#e8e0d4] mb-2 leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Knowledge Map
        </h1>
        <p className="text-sm text-[#9d9080] max-w-xl leading-relaxed">
          Every topic you&apos;ve explored, visualised by depth and module. Click a node to revisit.
        </p>
      </div>

      {/* Stats bar */}
      {isAuthenticated && !loading && (
        <div className="flex flex-wrap gap-4 mb-7">
          <StatPill label="Topics touched" value={totalTopics} color="#c9a96e" />
          <StatPill label="Modules active" value={modulesExplored} color="#7b9fd4" />
          {mostVisited && (
            <StatPill
              label="Most visited"
              value={mostVisited.topic.length > 20 ? mostVisited.topic.slice(0, 20) + "…" : mostVisited.topic}
              color={MODULE_COLOR[mostVisited.module]}
              mono
            />
          )}
        </div>
      )}

      {/* Map canvas */}
      {loading ? (
        <div className="relative">
          <MapSkeleton />
        </div>
      ) : !isAuthenticated ? (
        /* Unauthenticated state */
        <div
          className="bg-[#161412] border border-[#2a2520] rounded-lg flex flex-col items-center justify-center text-center gap-4"
          style={{ height: 340 }}
        >
          <p
            className="text-[#4a4540] text-3xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            ◉
          </p>
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.2em] text-[#9d9080] mb-2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Sign in to see your map
            </p>
            <p className="text-sm text-[#9d9080] max-w-xs mx-auto leading-relaxed">
              Your Knowledge Map builds as you explore topics across modules. Create a free account to track your progress.
            </p>
          </div>
          <button
            onClick={() => router.push("/auth?next=/knowledge-map")}
            className="px-5 py-2 rounded-lg text-xs tracking-[0.15em] uppercase transition-colors"
            style={{
              fontFamily: "var(--font-mono)",
              backgroundColor: "#c9a96e15",
              border: "1px solid #c9a96e",
              color: "#c9a96e",
            }}
          >
            Sign in →
          </button>
        </div>
      ) : error ? (
        /* Error state */
        <div className="bg-[#161412] border border-[#e8854a]/30 rounded-lg p-6">
          <p
            className="text-[10px] uppercase tracking-[0.2em] text-[#e8854a] mb-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Error
          </p>
          <p className="text-sm text-[#9d9080]">{error}</p>
        </div>
      ) : entries.length === 0 ? (
        /* Empty state */
        <div
          className="bg-[#161412] border border-[#2a2520] rounded-lg flex flex-col items-center justify-center text-center gap-4"
          style={{ height: 340 }}
        >
          <p
            className="text-[#4a4540] text-3xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            ◉
          </p>
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.2em] text-[#9d9080] mb-2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Your map is empty
            </p>
            <p className="text-sm text-[#9d9080] max-w-xs mx-auto leading-relaxed">
              Start exploring topics in any module — your map populates as you learn.
            </p>
          </div>
        </div>
      ) : (
        /* Map */
        <div
          className="relative bg-[#0d0c0b] border border-[#2a2520] rounded-lg overflow-hidden"
          style={{ height: svgH }}
        >
          {/* Subtle grid background */}
          <svg
            className="absolute inset-0 opacity-10"
            width="100%"
            height="100%"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2a2520" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Node canvas */}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {positioned.map((entry) => {
              const color = MODULE_COLOR[entry.module];
              const size = DEPTH_SIZE[entry.depth_level];
              const opacity = DEPTH_OPACITY[entry.depth_level];
              const isHovered = hoveredId === entry.id;

              return (
                <g key={entry.id}>
                  {/* Glow ring on hover */}
                  {isHovered && (
                    <circle
                      cx={entry.x}
                      cy={entry.y}
                      r={size + 6}
                      fill="none"
                      stroke={color}
                      strokeWidth="1"
                      opacity={0.3}
                    />
                  )}

                  {/* Node circle */}
                  <circle
                    cx={entry.x}
                    cy={entry.y}
                    r={isHovered ? size + 2 : size}
                    fill={color}
                    opacity={isHovered ? 1 : opacity}
                    style={{ cursor: "pointer", transition: "r 0.15s, opacity 0.15s" }}
                    onMouseEnter={(e) => {
                      setHoveredId(entry.id);
                      const svg = svgRef.current;
                      if (!svg) return;
                      const rect = svg.getBoundingClientRect();
                      const scaleX = rect.width / svgW;
                      const scaleY = rect.height / svgH;
                      setTooltip({
                        x: entry.x * scaleX,
                        y: entry.y * scaleY,
                        entry,
                      });
                    }}
                    onMouseLeave={() => {
                      setHoveredId(null);
                      setTooltip(null);
                    }}
                    onClick={() => router.push(getTopicHref(entry))}
                  />
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="pointer-events-none absolute z-10 px-3 py-2 rounded-lg border text-xs max-w-[180px]"
              style={{
                left: Math.min(tooltip.x + 14, (svgRef.current?.getBoundingClientRect().width ?? 800) - 200),
                top: Math.max(tooltip.y - 20, 8),
                backgroundColor: "#1a1816",
                borderColor: MODULE_COLOR[tooltip.entry.module] + "50",
                fontFamily: "var(--font-mono)",
              }}
            >
              <p className="text-[#e8e0d4] font-medium truncate mb-0.5">{tooltip.entry.topic}</p>
              <p style={{ color: MODULE_COLOR[tooltip.entry.module], fontSize: "9px" }} className="uppercase tracking-[0.15em]">
                {MODULE_LABEL[tooltip.entry.module]} · {DEPTH_LABEL[tooltip.entry.depth_level]}
              </p>
              <p className="text-[#9d9080]" style={{ fontSize: "9px" }}>
                {tooltip.entry.visit_count} visit{tooltip.entry.visit_count !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      {isAuthenticated && !loading && entries.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-6">
          {/* Module colours */}
          <div>
            <p
              className="text-[9px] uppercase tracking-[0.2em] text-[#9d9080] mb-2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Module
            </p>
            <div className="flex flex-wrap gap-3">
              {(Object.entries(MODULE_COLOR) as [KnowledgeModule, string][]).map(([mod, color]) => (
                <div key={mod} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span
                    className="text-[10px] text-[#9d9080]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {MODULE_LABEL[mod]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Depth sizes */}
          <div>
            <p
              className="text-[9px] uppercase tracking-[0.2em] text-[#9d9080] mb-2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Depth
            </p>
            <div className="flex items-center gap-4">
              {(Object.entries(DEPTH_SIZE) as [DepthLevel, number][]).map(([depth, size]) => (
                <div key={depth} className="flex items-center gap-1.5">
                  <span
                    className="rounded-full shrink-0"
                    style={{
                      width: size,
                      height: size,
                      backgroundColor: "#c9a96e",
                      opacity: DEPTH_OPACITY[depth],
                    }}
                  />
                  <span
                    className="text-[10px] text-[#9d9080]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {DEPTH_LABEL[depth]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Entry list (compact) */}
      {isAuthenticated && !loading && entries.length > 0 && (
        <div className="mt-8">
          <p
            className="text-[9px] uppercase tracking-[0.2em] text-[#9d9080] mb-3"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            All entries — {entries.length} topic{entries.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {entries.map((entry) => {
              const color = MODULE_COLOR[entry.module];
              return (
                <button
                  key={entry.id}
                  onClick={() => router.push(getTopicHref(entry))}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors hover:border-[#3a3530] group"
                  style={{
                    backgroundColor: "#161412",
                    borderColor: "#2a2520",
                  }}
                >
                  <span
                    className="shrink-0 rounded-full"
                    style={{
                      width: DEPTH_SIZE[entry.depth_level],
                      height: DEPTH_SIZE[entry.depth_level],
                      backgroundColor: color,
                      opacity: DEPTH_OPACITY[entry.depth_level],
                    }}
                  />
                  <span className="flex-1 min-w-0">
                    <span
                      className="block text-xs text-[#e8e0d4] truncate group-hover:text-white transition-colors"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {entry.topic}
                    </span>
                    <span
                      className="block text-[9px] uppercase tracking-[0.1em]"
                      style={{ color, fontFamily: "var(--font-mono)", opacity: 0.8 }}
                    >
                      {MODULE_LABEL[entry.module]}
                    </span>
                  </span>
                  <span
                    className="shrink-0 text-[9px] text-[#4a4540] group-hover:text-[#9d9080] transition-colors"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    ×{entry.visit_count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── StatPill ──────────────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  color,
  mono = false,
}: {
  label: string;
  value: string | number;
  color: string;
  mono?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg border"
      style={{ borderColor: color + "40", backgroundColor: color + "08" }}
    >
      <div>
        <p
          className="text-[9px] uppercase tracking-[0.2em] text-[#9d9080] mb-0.5"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {label}
        </p>
        <p
          className="text-lg font-bold leading-none"
          style={{ color, fontFamily: mono ? "var(--font-mono)" : "var(--font-heading)", fontSize: mono ? "12px" : undefined }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
