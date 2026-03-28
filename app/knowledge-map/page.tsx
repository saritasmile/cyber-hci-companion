"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { KnowledgeMapEntryRow, KnowledgeModule, DepthLevel } from "@/types/database";

// ── Constants ─────────────────────────────────────────────────────────────────

const MODULE_COLOR: Record<KnowledgeModule, string> = {
  scenario: "#c04a0a",
  study:    "#0a7a68",
  rabbit:   "#1a4e8a",
  patterns: "#6a3a9a",
  scan:     "#8a5a1a",
};

const MODULE_LABEL: Record<KnowledgeModule, string> = {
  scenario: "Scenario",
  study:    "Study",
  rabbit:   "Rabbit Hole",
  patterns: "Patterns",
  scan:     "Horizon Scan",
};

const DEPTH_SIZE: Record<DepthLevel, number> = { touched: 7, explored: 13, deep: 21 };
const DEPTH_OPACITY: Record<DepthLevel, number> = { touched: 0.45, explored: 0.75, deep: 1.0 };
const DEPTH_LABEL: Record<DepthLevel, string> = { touched: "Touched", explored: "Explored", deep: "Deep" };

// ── Routing ───────────────────────────────────────────────────────────────────

function getTopicHref(entry: KnowledgeMapEntryRow): string {
  switch (entry.module) {
    case "study":    return `/study?topic=${encodeURIComponent(entry.topic)}`;
    case "rabbit":   return `/rabbit`;
    case "scenario": return `/scenarios/${entry.topic}`;
    case "patterns": return `/patterns`;
    case "scan":     return `/scan`;
    default:         return "/";
  }
}

// ── Phyllotaxis layout ────────────────────────────────────────────────────────

function phyllotaxisPosition(index: number, total: number, cx: number, cy: number, maxRadius: number): { x: number; y: number } {
  if (total <= 1) return { x: cx, y: cy };
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const angle = index * goldenAngle;
  const r = Math.sqrt(index / (total - 1)) * maxRadius;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function MapSkeleton() {
  return (
    <div className="card animate-pulse" style={{ height: 480 }}>
      <div className="flex items-center justify-center h-full">
        <p className="text-[10px] uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Loading map…</p>
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsAuthenticated(false); setLoading(false); return; }
      setIsAuthenticated(true);
      const { data, error: dbErr } = await supabase.from("knowledge_map_entries").select("*").eq("user_id", user.id).order("last_visited", { ascending: false });
      if (dbErr) { setError(dbErr.message); } else { setEntries(data ?? []); }
      setLoading(false);
    }
    fetchEntries();
  }, []);

  const totalTopics = entries.length;
  const modulesExplored = new Set(entries.map((e) => e.module)).size;
  const mostVisited = entries.reduce<KnowledgeMapEntryRow | null>((best, e) => (!best || e.visit_count > best.visit_count ? e : best), null);

  const svgW = 800, svgH = 480, cx = svgW / 2, cy = svgH / 2, maxR = Math.min(cx, cy) - 30;
  const positioned = entries.map((entry, i) => ({ ...entry, ...phyllotaxisPosition(i, entries.length, cx, cy, maxR) }));

  return (
    <div className="px-10 py-10 max-w-5xl responsive-padding">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Overview</p>
        <h1 className="page-title mb-2" style={{ fontFamily: "var(--font-heading)" }}>Knowledge Map</h1>
        <p className="text-sm max-w-xl leading-relaxed" style={{ color: "var(--text-mid)" }}>
          Every topic you&apos;ve explored, visualised by depth and module. Click a node to revisit.
        </p>
      </div>

      {/* Stats bar */}
      {isAuthenticated && !loading && (
        <div className="flex flex-wrap gap-4 mb-7">
          <StatPill label="Topics touched" value={totalTopics} color="#8a5a1a" />
          <StatPill label="Modules active" value={modulesExplored} color="#1a4e8a" />
          {mostVisited && (
            <StatPill label="Most visited" value={mostVisited.topic.length > 20 ? mostVisited.topic.slice(0, 20) + "…" : mostVisited.topic} color={MODULE_COLOR[mostVisited.module]} mono />
          )}
        </div>
      )}

      {/* Map canvas */}
      {loading ? (
        <MapSkeleton />
      ) : !isAuthenticated ? (
        <div className="card flex flex-col items-center justify-center text-center gap-4" style={{ height: 340 }}>
          <p className="text-3xl" style={{ fontFamily: "var(--font-heading)", color: "var(--border-hi)" }}>◉</p>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Sign in to see your map</p>
            <p className="text-sm max-w-xs mx-auto leading-relaxed" style={{ color: "var(--text-mid)" }}>Your Knowledge Map builds as you explore topics across modules. Create a free account to track your progress.</p>
          </div>
          <button
            onClick={() => router.push("/auth?next=/knowledge-map")}
            className="px-5 py-2 text-xs tracking-[0.15em] uppercase transition-colors"
            style={{ fontFamily: "var(--font-mono)", backgroundColor: "#faf0e0", border: "1px solid #d4a860", borderRadius: "2px", color: "#8a5a1a" }}
          >
            Sign in →
          </button>
        </div>
      ) : error ? (
        <div className="card p-6" style={{ borderColor: "#f0c4a0" }}>
          <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "var(--font-mono)", color: "#c04a0a" }}>Error</p>
          <p className="text-sm" style={{ color: "var(--text-mid)" }}>{error}</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="card flex flex-col items-center justify-center text-center gap-4" style={{ height: 340 }}>
          <p className="text-3xl" style={{ fontFamily: "var(--font-heading)", color: "var(--border-hi)" }}>◉</p>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Your map is empty</p>
            <p className="text-sm max-w-xs mx-auto leading-relaxed" style={{ color: "var(--text-mid)" }}>Start exploring topics in any module — your map populates as you learn.</p>
          </div>
        </div>
      ) : (
        /* Map */
        <div className="relative border overflow-hidden" style={{ height: svgH, backgroundColor: "var(--bg-subtle)", borderColor: "var(--border)", borderRadius: "3px" }}>
          {/* Grid background */}
          <svg className="absolute inset-0 opacity-40" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Node canvas */}
          <svg ref={svgRef} viewBox={`0 0 ${svgW} ${svgH}`} className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {positioned.map((entry) => {
              const color = MODULE_COLOR[entry.module];
              const size = DEPTH_SIZE[entry.depth_level];
              const opacity = DEPTH_OPACITY[entry.depth_level];
              const isHovered = hoveredId === entry.id;
              return (
                <g key={entry.id}>
                  {isHovered && (
                    <circle cx={entry.x} cy={entry.y} r={size + 6} fill="none" stroke={color} strokeWidth="1.5" opacity={0.4} />
                  )}
                  <circle
                    cx={entry.x} cy={entry.y} r={isHovered ? size + 2 : size}
                    fill={color} opacity={isHovered ? 1 : opacity}
                    style={{ cursor: "pointer", transition: "r 0.15s, opacity 0.15s" }}
                    onMouseEnter={(e) => {
                      setHoveredId(entry.id);
                      const svg = svgRef.current;
                      if (!svg) return;
                      const rect = svg.getBoundingClientRect();
                      setTooltip({ x: entry.x * (rect.width / svgW), y: entry.y * (rect.height / svgH), entry });
                    }}
                    onMouseLeave={() => { setHoveredId(null); setTooltip(null); }}
                    onClick={() => router.push(getTopicHref(entry))}
                  />
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="pointer-events-none absolute z-10 px-3 py-2 border text-xs max-w-[180px]"
              style={{
                left: Math.min(tooltip.x + 14, (svgRef.current?.getBoundingClientRect().width ?? 800) - 200),
                top: Math.max(tooltip.y - 20, 8),
                backgroundColor: "var(--bg-card)",
                borderColor: MODULE_COLOR[tooltip.entry.module] + "60",
                borderRadius: "3px",
                boxShadow: "0 3px 12px rgba(0,0,0,0.12)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <p className="font-medium truncate mb-0.5" style={{ color: "var(--text)" }}>{tooltip.entry.topic}</p>
              <p style={{ color: MODULE_COLOR[tooltip.entry.module], fontSize: "9px" }} className="uppercase tracking-[0.15em]">
                {MODULE_LABEL[tooltip.entry.module]} · {DEPTH_LABEL[tooltip.entry.depth_level]}
              </p>
              <p style={{ fontSize: "9px", color: "var(--text-dim)" }}>
                {tooltip.entry.visit_count} visit{tooltip.entry.visit_count !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      {isAuthenticated && !loading && entries.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-6">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Module</p>
            <div className="flex flex-wrap gap-3">
              {(Object.entries(MODULE_COLOR) as [KnowledgeModule, string][]).map(([mod, color]) => (
                <div key={mod} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-mid)" }}>{MODULE_LABEL[mod]}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Depth</p>
            <div className="flex items-center gap-4">
              {(Object.entries(DEPTH_SIZE) as [DepthLevel, number][]).map(([depth, size]) => (
                <div key={depth} className="flex items-center gap-1.5">
                  <span className="rounded-full shrink-0" style={{ width: size, height: size, backgroundColor: "#8a5a1a", opacity: DEPTH_OPACITY[depth] }} />
                  <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-mid)" }}>{DEPTH_LABEL[depth]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Entry list */}
      {isAuthenticated && !loading && entries.length > 0 && (
        <div className="mt-8">
          <p className="text-[9px] uppercase tracking-[0.2em] mb-3" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
            All entries — {entries.length} topic{entries.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {entries.map((entry) => {
              const color = MODULE_COLOR[entry.module];
              return (
                <button
                  key={entry.id}
                  onClick={() => router.push(getTopicHref(entry))}
                  className="flex items-center gap-3 px-3 py-2.5 border text-left transition-all group card"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
                >
                  <span className="shrink-0 rounded-full" style={{ width: DEPTH_SIZE[entry.depth_level], height: DEPTH_SIZE[entry.depth_level], backgroundColor: color, opacity: DEPTH_OPACITY[entry.depth_level] }} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs truncate transition-colors" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{entry.topic}</span>
                    <span className="block text-[9px] uppercase tracking-[0.1em]" style={{ color, fontFamily: "var(--font-mono)", opacity: 0.8 }}>{MODULE_LABEL[entry.module]}</span>
                  </span>
                  <span className="shrink-0 text-[9px] transition-colors" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>×{entry.visit_count}</span>
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

function StatPill({ label, value, color, mono = false }: { label: string; value: string | number; color: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border" style={{ borderColor: color + "40", backgroundColor: color + "10", borderRadius: "3px" }}>
      <div>
        <p className="text-[9px] uppercase tracking-[0.2em] mb-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>{label}</p>
        <p className="text-lg font-bold leading-none" style={{ color, fontFamily: mono ? "var(--font-mono)" : "var(--font-heading)", fontSize: mono ? "12px" : undefined }}>{value}</p>
      </div>
    </div>
  );
}
