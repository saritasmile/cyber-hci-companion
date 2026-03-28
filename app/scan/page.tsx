"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { FeedItemRow, FeedLens } from "@/types/database";

// ── UI Primitives ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] uppercase tracking-[0.25em] mb-1" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
      {children}
    </p>
  );
}

// ── Lens config ───────────────────────────────────────────────────────────────

const LENS_CONFIG = {
  analyst:   { label: "Analyst",   color: "var(--leaf)",  bg: "var(--leaf-bg)",  bdr: "var(--leaf-bdr)"  },
  hci:       { label: "HCI",       color: "var(--clay)",  bg: "var(--clay-bg)",  bdr: "var(--clay-bdr)"  },
  commander: { label: "Commander", color: "var(--pool)",  bg: "var(--pool-bg)",  bdr: "var(--pool-bdr)"  },
};

const EFFORT_CONFIG: Record<string, { label: string; color: string; bg: string; bdr: string }> = {
  "5min":  { label: "5 min",     color: "#8c7d74", bg: "#f2ede6", bdr: "#d8cfc4" },
  "15min": { label: "15 min",    color: "#8c7d74", bg: "#f2ede6", bdr: "#d8cfc4" },
  deep:    { label: "Deep read", color: "#6a3a9a", bg: "#f2ecfa", bdr: "#c8a8e8" },
};

// ── Tag chip ──────────────────────────────────────────────────────────────────

function Tag({ label, color, bg, bdr }: { label: string; color: string; bg: string; bdr: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase"
      style={{ fontFamily: "var(--font-mono)", color, backgroundColor: bg, border: `1px solid ${bdr}`, borderRadius: "2px" }}
    >
      {label}
    </span>
  );
}

// ── Feed Card ─────────────────────────────────────────────────────────────────

function FeedCard({ item, onGoDeep }: { item: FeedItemRow; onGoDeep: (topic: string) => void }) {
  const lens = LENS_CONFIG[item.lens];
  const effort = EFFORT_CONFIG[item.effort] ?? { label: item.effort, color: "#8c7d74", bg: "#f2ede6", bdr: "#d8cfc4" };
  const dateStr = new Date(item.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <article
      className="relative card p-5 flex flex-col gap-3 transition-all"
      style={item.is_featured ? { borderLeftColor: lens.color, borderLeftWidth: "3px" } : undefined}
    >
      {item.is_featured && (
        <span
          className="absolute top-4 right-4 text-[9px] uppercase tracking-[0.2em] px-2 py-0.5"
          style={{ fontFamily: "var(--font-mono)", color: lens.color, backgroundColor: lens.bg, borderRadius: "2px" }}
        >
          Featured
        </span>
      )}

      {/* Header */}
      <div>
        <SectionLabel>{item.source} · {dateStr}</SectionLabel>
        <h2 className="text-base font-semibold leading-snug pr-16" style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}>
          {item.title}
        </h2>
      </div>

      {/* Excerpt */}
      <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "var(--text-mid)" }}>{item.excerpt}</p>

      {/* Tags + action */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Tag label={lens.label} color={lens.color} bg={lens.bg} bdr={lens.bdr} />
        <Tag label={effort.label} color={effort.color} bg={effort.bg} bdr={effort.bdr} />
        <Tag label={item.topic} color="#8a5a1a" bg="#faf0e0" bdr="#d4a860" />
        <div className="ml-auto">
          <button
            onClick={() => onGoDeep(item.topic)}
            className="px-3 py-1.5 text-[11px] tracking-[0.12em] uppercase transition-colors"
            style={{ fontFamily: "var(--font-mono)", color: lens.color, backgroundColor: lens.bg, border: `1px solid ${lens.bdr}`, borderRadius: "2px" }}
          >
            Go deep →
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

type FilterKey = "all" | FeedLens;

const FILTERS = [
  { key: "all",       label: "All",       color: "var(--text-dim)", bg: "var(--bg-subtle)", bdr: "var(--border)"    },
  { key: "analyst",   label: "Analyst",   color: "var(--leaf)",     bg: "var(--leaf-bg)",   bdr: "var(--leaf-bdr)"  },
  { key: "hci",       label: "HCI",       color: "var(--clay)",     bg: "var(--clay-bg)",   bdr: "var(--clay-bdr)"  },
  { key: "commander", label: "Commander", color: "var(--pool)",     bg: "var(--pool-bg)",   bdr: "var(--pool-bdr)"  },
];

// ── Skeleton loader ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse space-y-3">
      <div className="h-2 w-32 rounded skeleton-line" />
      <div className="h-4 rounded w-3/4 skeleton-line" />
      <div className="space-y-2">
        <div className="h-3 rounded w-full skeleton-line" />
        <div className="h-3 rounded w-5/6 skeleton-line" />
        <div className="h-3 rounded w-4/5 skeleton-line" />
      </div>
      <div className="flex gap-2 pt-1">
        <div className="h-5 w-16 rounded skeleton-line" />
        <div className="h-5 w-16 rounded skeleton-line" />
        <div className="h-5 w-24 rounded skeleton-line" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ScanPage() {
  const router = useRouter();
  const [items, setItems] = useState<FeedItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    async function fetchFeed() {
      try {
        const { data, error: dbErr } = await supabase.from("feed_items").select("*").order("published_at", { ascending: false });
        if (dbErr) throw new Error(dbErr.message);
        setItems(data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load feed.");
      } finally {
        setLoading(false);
      }
    }
    fetchFeed();
  }, []);

  const visible = filter === "all" ? items : items.filter((item) => item.lens === filter);
  const counts: Record<FilterKey, number> = {
    all: items.length,
    analyst: items.filter((i) => i.lens === "analyst").length,
    hci: items.filter((i) => i.lens === "hci").length,
    commander: items.filter((i) => i.lens === "commander").length,
  };

  return (
    <div className="px-10 py-10 max-w-5xl responsive-padding">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Module</p>
        <h1 className="page-title mb-2" style={{ fontFamily: "var(--font-heading)" }}>Horizon Scan</h1>
        <p className="text-sm max-w-xl leading-relaxed" style={{ color: "var(--text-mid)" }}>
          Curated intelligence — advisories, academic papers, and incident analyses — filtered by the lens most relevant to your role.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-7">
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 border text-[11px] tracking-[0.1em] uppercase transition-colors"
              style={{
                fontFamily: "var(--font-mono)",
                borderRadius: "2px",
                color: isActive ? f.color : "var(--text-dim)",
                borderColor: isActive ? f.bdr : "var(--border)",
                backgroundColor: isActive ? f.bg : "var(--bg-card)",
              }}
            >
              {f.label}
              <span className="text-[10px] opacity-70">{counts[f.key]}</span>
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="card p-5 mb-6" style={{ borderColor: "#f0c4a0" }}>
          <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ fontFamily: "var(--font-mono)", color: "#c04a0a" }}>Error</p>
          <p className="text-sm" style={{ color: "var(--text-mid)" }}>{error}</p>
          <p className="text-xs mt-2" style={{ color: "var(--text-mid)" }}>
            Make sure the{" "}
            <code className="px-1" style={{ fontFamily: "var(--font-mono)", color: "#c04a0a", backgroundColor: "#fdf0e8", borderRadius: "2px" }}>feed_items</code>
            {" "}table is seeded — run{" "}
            <code className="px-1" style={{ fontFamily: "var(--font-mono)", color: "#c04a0a", backgroundColor: "#fdf0e8", borderRadius: "2px" }}>supabase/seed_feed_items.sql</code>
            {" "}in your Supabase SQL editor.
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>No items</p>
          <p className="text-sm" style={{ color: "var(--text-mid)" }}>
            {filter === "all" ? "No feed items found. Seed the database to get started." : `No items tagged with the ${filter} lens.`}
          </p>
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="space-y-4">
          {visible.map((item) => <FeedCard key={item.id} item={item} onGoDeep={(t) => router.push(`/study?topic=${encodeURIComponent(t)}`)} />)}
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <p className="mt-8 text-[10px] text-center" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
          {visible.length} item{visible.length !== 1 ? "s" : ""} · Click &ldquo;Go deep →&rdquo; to open a topic in Guided Study
        </p>
      )}
    </div>
  );
}
