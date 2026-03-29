"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { FeedItemRow, FeedLens } from "@/types/database";

// ── UI Primitives ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] uppercase tracking-[0.25em] mb-1"
      style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
      {children}
    </p>
  );
}

// ── Lens config — all CSS variables ──────────────────────────────────────────

const LENS_CONFIG = {
  analyst:   { label: "Analyst",   color: "var(--leaf)", bg: "var(--leaf-bg)", bdr: "var(--leaf-bdr)" },
  hci:       { label: "HCI",       color: "var(--clay)", bg: "var(--clay-bg)", bdr: "var(--clay-bdr)" },
  commander: { label: "Commander", color: "var(--pool)", bg: "var(--pool-bg)", bdr: "var(--pool-bdr)" },
};

const EFFORT_CONFIG: Record<string, { label: string; color: string; bg: string; bdr: string }> = {
  "5min":  { label: "5 min",     color: "var(--text-dim)", bg: "var(--bg-subtle)", bdr: "var(--border)" },
  "15min": { label: "15 min",    color: "var(--text-dim)", bg: "var(--bg-subtle)", bdr: "var(--border)" },
  deep:    { label: "Deep read", color: "var(--pool)",     bg: "var(--pool-bg)",   bdr: "var(--pool-bdr)" },
};

// ── Tag chip ──────────────────────────────────────────────────────────────────

function Tag({ label, color, bg, bdr }: { label: string; color: string; bg: string; bdr: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 uppercase tracking-[0.1em]"
      style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color, backgroundColor: bg, border: `1px solid ${bdr}`, borderRadius: "2px" }}
    >
      {label}
    </span>
  );
}

// ── Feed Card ─────────────────────────────────────────────────────────────────

function FeedCard({ item, onGoDeep }: { item: FeedItemRow; onGoDeep: (topic: string) => void }) {
  const lens = LENS_CONFIG[item.lens];
  const effort = EFFORT_CONFIG[item.effort] ?? { label: item.effort, color: "var(--text-dim)", bg: "var(--bg-subtle)", bdr: "var(--border)" };
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
        <h2 className="pr-16 leading-snug"
          style={{ fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 500, color: "var(--text)" }}>
          {item.title}
        </h2>
      </div>

      {/* Excerpt */}
      <p className="line-clamp-3"
        style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text)", lineHeight: 1.65 }}>
        {item.excerpt}
      </p>

      {/* Tags + action */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Tag label={lens.label} color={lens.color} bg={lens.bg} bdr={lens.bdr} />
        <Tag label={effort.label} color={effort.color} bg={effort.bg} bdr={effort.bdr} />
        <Tag label={item.topic} color="var(--oak)" bg="var(--oak-bg)" bdr="var(--oak-bdr)" />
        <div className="ml-auto">
          <button
            onClick={() => onGoDeep(item.topic)}
            className="px-3 py-1.5 uppercase tracking-[0.12em] transition-colors"
            style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: lens.color, backgroundColor: lens.bg, border: `1px solid ${lens.bdr}`, borderRadius: "2px" }}
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
  { key: "all",       label: "All",       color: "var(--text-dim)", bg: "var(--bg-subtle)", bdr: "var(--border)"   },
  { key: "analyst",   label: "Analyst",   color: "var(--leaf)",     bg: "var(--leaf-bg)",   bdr: "var(--leaf-bdr)" },
  { key: "hci",       label: "HCI",       color: "var(--clay)",     bg: "var(--clay-bg)",   bdr: "var(--clay-bdr)" },
  { key: "commander", label: "Commander", color: "var(--pool)",     bg: "var(--pool-bg)",   bdr: "var(--pool-bdr)" },
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
        <p className="text-[10px] uppercase tracking-[0.25em] mb-1"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Module</p>
        <h1 className="page-title mb-2" style={{ fontFamily: "var(--font-body)" }}>Horizon Scan</h1>
        <p className="max-w-xl"
          style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-mid)", lineHeight: 1.7 }}>
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
              onClick={() => setFilter(f.key as FilterKey)}
              className="flex items-center gap-1.5 px-3 py-1.5 border uppercase tracking-[0.1em] transition-colors"
              style={{
                fontFamily: "var(--font-mono)", fontSize: "11px",
                borderRadius: "2px",
                color: isActive ? f.color : "var(--text-dim)",
                borderColor: isActive ? f.bdr : "var(--border)",
                backgroundColor: isActive ? f.bg : "var(--bg-card)",
              }}
            >
              {f.label}
              <span className="opacity-70" style={{ fontSize: "10px" }}>{counts[f.key as FilterKey]}</span>
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="card p-5 mb-6" style={{ borderColor: "var(--clay-bdr)" }}>
          <p className="text-[10px] uppercase tracking-[0.2em] mb-1"
            style={{ fontFamily: "var(--font-mono)", color: "var(--clay)" }}>Error</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-mid)" }}>{error}</p>
          <p className="mt-2" style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-mid)" }}>
            Make sure the{" "}
            <code style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--clay)", backgroundColor: "var(--clay-bg)", borderRadius: "2px", padding: "0 4px" }}>feed_items</code>
            {" "}table is seeded.
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
          <p className="text-[10px] uppercase tracking-[0.2em] mb-2"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>No items</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-mid)" }}>
            {filter === "all" ? "No feed items found. Seed the database to get started." : `No items tagged with the ${filter} lens.`}
          </p>
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="space-y-4">
          {visible.map((item) => (
            <FeedCard key={item.id} item={item} onGoDeep={(t) => router.push(`/study?topic=${encodeURIComponent(t)}`)} />
          ))}
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <p className="mt-8 text-center"
          style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)" }}>
          {visible.length} item{visible.length !== 1 ? "s" : ""} · Click &ldquo;Go deep →&rdquo; to open a topic in Guided Study
        </p>
      )}
    </div>
  );
}
