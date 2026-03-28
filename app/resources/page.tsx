"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { resources, RESOURCE_TYPE_CONFIG, RESOURCE_STATUS_CONFIG, COST_CONFIG } from "@/lib/resources";
import type { Resource, ResourceType, ResourceStatus, ResourceWithStatus } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Suggestion {
  id: string;
  reason: string;
}

// ── UI primitives ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] uppercase tracking-[0.25em] mb-2"
      style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
      {children}
    </p>
  );
}

function TypeBadge({ type }: { type: ResourceType }) {
  const cfg = RESOURCE_TYPE_CONFIG[type];
  return (
    <span className="text-[9px] tracking-[0.15em] px-2 py-0.5 border"
      style={{ fontFamily: "var(--font-mono)", color: cfg.color, borderColor: cfg.bdr, backgroundColor: cfg.bg, borderRadius: "2px" }}>
      {cfg.label.toUpperCase()}
    </span>
  );
}

function CostBadge({ cost }: { cost: Resource["cost"] }) {
  const cfg = COST_CONFIG[cost];
  return (
    <span className="text-[9px]" style={{ fontFamily: "var(--font-mono)", color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ── Status picker ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ResourceStatus; label: string }[] = [
  { value: "saved",          label: "Saved" },
  { value: "in_progress",    label: "In Progress" },
  { value: "completed",      label: "Completed" },
  { value: "not_interested", label: "Not Interested" },
];

function StatusPicker({
  resourceId,
  current,
  onUpdate,
}: {
  resourceId: string;
  current: ResourceStatus | null;
  onUpdate: (id: string, status: ResourceStatus | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSelect = async (status: ResourceStatus) => {
    setSaving(true);
    setOpen(false);
    const newStatus = current === status ? null : status;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (newStatus === null) {
        await supabase.from("resource_progress")
          .delete()
          .eq("user_id", user.id)
          .eq("resource_id", resourceId);
      } else {
        await supabase.from("resource_progress")
          .upsert({ user_id: user.id, resource_id: resourceId, status: newStatus, updated_at: new Date().toISOString() },
            { onConflict: "user_id,resource_id" });
      }
      onUpdate(resourceId, newStatus);
    } catch (err) {
      console.error("Status update failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const cfg = current ? RESOURCE_STATUS_CONFIG[current] : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={saving}
        className="text-[9px] tracking-[0.12em] uppercase px-2 py-1 border transition-colors"
        style={{
          fontFamily: "var(--font-mono)",
          borderRadius: "2px",
          color: cfg ? cfg.color : "var(--text-dim)",
          borderColor: cfg ? cfg.bdr : "var(--border)",
          backgroundColor: cfg ? cfg.bg : "transparent",
        }}
      >
        {saving ? "..." : (current ? RESOURCE_STATUS_CONFIG[current].label : "Track →")}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 card py-1 min-w-[140px]"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
            {STATUS_OPTIONS.map((opt) => {
              const optCfg = RESOURCE_STATUS_CONFIG[opt.value];
              const isActive = current === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className="w-full text-left px-3 py-2 text-[10px] tracking-[0.1em] transition-colors"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: isActive ? optCfg.color : "var(--text-mid)",
                    backgroundColor: isActive ? optCfg.bg : "transparent",
                  }}
                >
                  {isActive ? "✓ " : ""}{opt.label}
                </button>
              );
            })}
            {current && (
              <>
                <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />
                <button
                  onClick={() => handleSelect(current)}
                  className="w-full text-left px-3 py-2 text-[10px] tracking-[0.1em]"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Resource card ─────────────────────────────────────────────────────────────

function ResourceCard({
  resource,
  status,
  onStatusUpdate,
  suggestionReason,
}: {
  resource: Resource;
  status: ResourceStatus | null;
  onStatusUpdate: (id: string, status: ResourceStatus | null) => void;
  suggestionReason?: string;
}) {
  const typeCfg = RESOURCE_TYPE_CONFIG[resource.type];

  return (
    <div className="card p-5 flex flex-col gap-3" style={{ opacity: status === "not_interested" ? 0.45 : 1 }}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <TypeBadge type={resource.type} />
          {resource.platform && (
            <span className="text-[9px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
              {resource.platform}
            </span>
          )}
          <CostBadge cost={resource.cost} />
        </div>
        <StatusPicker resourceId={resource.id} current={status} onUpdate={onStatusUpdate} />
      </div>

      {/* Title + author */}
      <div>
        <a href={resource.url} target="_blank" rel="noopener noreferrer"
          className="text-sm font-semibold leading-snug hover:underline transition-colors"
          style={{ fontFamily: "var(--font-heading)", color: "var(--text)", textDecorationColor: typeCfg.color }}>
          {resource.title}
        </a>
        {resource.author && (
          <p className="text-[10px] mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
            {resource.author}
          </p>
        )}
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-mid)" }}>
        {resource.description}
      </p>

      {/* Suggestion reason */}
      {suggestionReason && (
        <div className="text-[10px] leading-relaxed px-3 py-2"
          style={{ fontFamily: "var(--font-mono)", color: "#6a3a9a", backgroundColor: "#f2ecfa", borderLeft: "2px solid #c8a8e8", borderRadius: "0 2px 2px 0" }}>
          {suggestionReason}
        </div>
      )}

      {/* Topics */}
      <div className="flex flex-wrap gap-1.5">
        {resource.topics.map((t) => (
          <span key={t} className="text-[8px] tracking-[0.1em] px-1.5 py-0.5 border"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)", borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)", borderRadius: "2px" }}>
            {t}
          </span>
        ))}
      </div>

      {/* Expert socials */}
      {resource.type === "expert" && resource.socials && (
        <div className="flex gap-3">
          {Object.entries(resource.socials).map(([platform, url]) => (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
              className="text-[9px] tracking-[0.1em] transition-colors hover:underline"
              style={{ fontFamily: "var(--font-mono)", color: typeCfg.color }}>
              {platform} →
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const ALL_TYPES: ResourceType[] = ["course", "book", "tool", "youtube", "reddit", "expert"];

export default function ResourcesPage() {
  const [statusMap, setStatusMap] = useState<Record<string, ResourceStatus>>({});
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [activeTab, setActiveTab] = useState<"library" | "suggested">("library");
  const [filterType, setFilterType] = useState<ResourceType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<ResourceStatus | "all">("all");
  const [filterCost, setFilterCost] = useState<Resource["cost"] | "all">("all");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [exploredTopics, setExploredTopics] = useState<string[]>([]);

  // Load user's progress
  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("resource_progress")
          .select("resource_id, status").eq("user_id", user.id);
        if (data) {
          const map: Record<string, ResourceStatus> = {};
          data.forEach((row) => { map[row.resource_id] = row.status as ResourceStatus; });
          setStatusMap(map);
        }
      } finally {
        setLoadingProgress(false);
      }
    }
    load();
  }, []);

  const handleStatusUpdate = useCallback((id: string, status: ResourceStatus | null) => {
    setStatusMap((prev) => {
      const next = { ...prev };
      if (status === null) delete next[id];
      else next[id] = status;
      return next;
    });
  }, []);

  // Load AI suggestions
  const loadSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    setSuggestionsError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSuggestionsError("Sign in to get personalised suggestions."); return; }
      const res = await fetch("/api/resources/suggest", {
        headers: { Authorization: `Bearer ${user.id}` },
      });
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      const data = await res.json();
      if (data.reason === "no_history") {
        setSuggestionsError("Explore some scenarios first — suggestions are based on what you've studied.");
      } else {
        setSuggestions(data.suggestions ?? []);
        setExploredTopics(data.explored ?? []);
      }
    } catch {
      setSuggestionsError("Could not load suggestions. Please try again.");
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "suggested" && suggestions.length === 0 && !suggestionsError) {
      loadSuggestions();
    }
  }, [activeTab, suggestions.length, suggestionsError, loadSuggestions]);

  // Filtered library
  const filteredResources = resources.filter((r) => {
    if (filterType !== "all" && r.type !== filterType) return false;
    if (filterCost !== "all" && r.cost !== filterCost) return false;
    if (filterStatus !== "all") {
      const s = statusMap[r.id] ?? null;
      if (filterStatus === "saved" && s !== "saved") return false;
      if (filterStatus === "in_progress" && s !== "in_progress") return false;
      if (filterStatus === "completed" && s !== "completed") return false;
    }
    return true;
  });

  // Suggested resources merged with reasons
  const suggestedResources: (ResourceWithStatus & { reason: string })[] = suggestions
    .map((s) => {
      const r = resources.find((res) => res.id === s.id);
      if (!r) return null;
      return { ...r, status: statusMap[r.id] ?? null, reason: s.reason };
    })
    .filter(Boolean) as (ResourceWithStatus & { reason: string })[];

  // Stats
  const completedCount = Object.values(statusMap).filter((s) => s === "completed").length;
  const inProgressCount = Object.values(statusMap).filter((s) => s === "in_progress").length;
  const savedCount = Object.values(statusMap).filter((s) => s === "saved").length;

  const TABS = [
    { id: "library" as const, label: "Library", accent: "#0a7a68" },
    { id: "suggested" as const, label: "Suggested for You", accent: "#6a3a9a" },
  ];

  return (
    <div className="px-10 py-10 max-w-5xl responsive-padding">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.3em] mb-3"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
          Module 07 — Learning Resources
        </p>
        <h1 className="page-title mb-3" style={{ fontFamily: "var(--font-heading)" }}>
          Learning Resources
        </h1>
        <p className="text-sm max-w-xl leading-relaxed" style={{ color: "var(--text-mid)" }}>
          Courses, books, tools, YouTube channels, communities, and experts — curated for the security-minded UX practitioner. Track what you're exploring and get AI-powered suggestions based on your scenario history.
        </p>
      </div>

      {/* Progress stats */}
      {!loadingProgress && (
        <div className="grid grid-cols-3 gap-3 mb-8 max-w-sm">
          {[
            { label: "Completed", value: completedCount, color: "#0a7a68" },
            { label: "In Progress", value: inProgressCount, color: "#8a5a1a" },
            { label: "Saved", value: savedCount, color: "#1a4e8a" },
          ].map((stat) => (
            <div key={stat.label} className="card p-3 text-center">
              <p className="text-xl font-bold mb-0.5" style={{ fontFamily: "var(--font-heading)", color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-[8px] uppercase tracking-[0.15em]"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-0 mb-6 overflow-x-auto"
        style={{ borderBottom: "2px solid var(--border)", scrollbarWidth: "none" } as React.CSSProperties}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="relative shrink-0 px-4 py-3 text-[11px] tracking-[0.12em] uppercase transition-colors"
              style={{
                fontFamily: "var(--font-mono)",
                color: isActive ? tab.accent : "var(--text-dim)",
                borderBottom: isActive ? `3px solid ${tab.accent}` : "3px solid transparent",
                marginBottom: "-2px",
                backgroundColor: "transparent",
              }}>
              {isActive && <span className="absolute inset-0 rounded-t" style={{ backgroundColor: tab.accent + "12" }} />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Library tab */}
      {activeTab === "library" && (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6 items-center">
            {/* Type filter */}
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setFilterType("all")}
                className="text-[9px] tracking-[0.12em] uppercase px-2 py-1 border transition-colors"
                style={{
                  fontFamily: "var(--font-mono)", borderRadius: "2px",
                  color: filterType === "all" ? "var(--text)" : "var(--text-dim)",
                  borderColor: filterType === "all" ? "var(--border-hi)" : "var(--border)",
                  backgroundColor: filterType === "all" ? "var(--bg-subtle)" : "transparent",
                }}>
                All Types
              </button>
              {ALL_TYPES.map((t) => {
                const cfg = RESOURCE_TYPE_CONFIG[t];
                const isActive = filterType === t;
                return (
                  <button key={t} onClick={() => setFilterType(isActive ? "all" : t)}
                    className="text-[9px] tracking-[0.12em] uppercase px-2 py-1 border transition-colors"
                    style={{
                      fontFamily: "var(--font-mono)", borderRadius: "2px",
                      color: isActive ? cfg.color : "var(--text-dim)",
                      borderColor: isActive ? cfg.bdr : "var(--border)",
                      backgroundColor: isActive ? cfg.bg : "transparent",
                    }}>
                    {cfg.icon} {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ width: "1px", height: "20px", backgroundColor: "var(--border)" }} />

            {/* Cost filter */}
            {(["all", "free", "freemium", "paid"] as const).map((c) => (
              <button key={c} onClick={() => setFilterCost(c)}
                className="text-[9px] tracking-[0.12em] uppercase px-2 py-1 border transition-colors"
                style={{
                  fontFamily: "var(--font-mono)", borderRadius: "2px",
                  color: filterCost === c ? "var(--text)" : "var(--text-dim)",
                  borderColor: filterCost === c ? "var(--border-hi)" : "var(--border)",
                  backgroundColor: filterCost === c ? "var(--bg-subtle)" : "transparent",
                }}>
                {c === "all" ? "Any Cost" : COST_CONFIG[c].label}
              </button>
            ))}

            {/* Divider */}
            <div style={{ width: "1px", height: "20px", backgroundColor: "var(--border)" }} />

            {/* Status filter */}
            {([
              { value: "all", label: "All" },
              { value: "saved", label: "Saved" },
              { value: "in_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
            ] as const).map((s) => (
              <button key={s.value} onClick={() => setFilterStatus(s.value)}
                className="text-[9px] tracking-[0.12em] uppercase px-2 py-1 border transition-colors"
                style={{
                  fontFamily: "var(--font-mono)", borderRadius: "2px",
                  color: filterStatus === s.value ? "var(--text)" : "var(--text-dim)",
                  borderColor: filterStatus === s.value ? "var(--border-hi)" : "var(--border)",
                  backgroundColor: filterStatus === s.value ? "var(--bg-subtle)" : "transparent",
                }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Result count */}
          <p className="text-[10px] mb-4" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
            {filteredResources.length} resource{filteredResources.length !== 1 ? "s" : ""}
          </p>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                status={statusMap[r.id] ?? null}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>

          {filteredResources.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-sm" style={{ color: "var(--text-dim)" }}>No resources match these filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Suggested tab */}
      {activeTab === "suggested" && (
        <div>
          {loadingSuggestions ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-5">
                  <div className="h-2 w-24 rounded mb-4" style={{ backgroundColor: "#6a3a9a30" }} />
                  <div className="space-y-2">
                    <div className="h-3 rounded w-full skeleton-line" />
                    <div className="h-3 rounded w-5/6 skeleton-line" />
                  </div>
                </div>
              ))}
              <p className="text-center text-[10px] pt-2"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
                Analysing your scenario history…
              </p>
            </div>
          ) : suggestionsError ? (
            <div className="card p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] mb-2"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
                No suggestions yet
              </p>
              <p className="text-sm mb-4" style={{ color: "var(--text-mid)" }}>{suggestionsError}</p>
              <button onClick={loadSuggestions}
                className="text-[10px] tracking-[0.15em] uppercase"
                style={{ fontFamily: "var(--font-mono)", color: "#0a7a68" }}>
                Try Again →
              </button>
            </div>
          ) : (
            <div>
              {exploredTopics.length > 0 && (
                <div className="mb-6 card p-4">
                  <SectionLabel>Based on your explored scenarios</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {exploredTopics.map((t) => (
                      <span key={t} className="text-[9px] tracking-[0.12em] uppercase px-2 py-0.5 border"
                        style={{ fontFamily: "var(--font-mono)", color: "#6a3a9a", borderColor: "#c8a8e8", backgroundColor: "#f2ecfa", borderRadius: "2px" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {suggestedResources.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    status={r.status}
                    onStatusUpdate={handleStatusUpdate}
                    suggestionReason={r.reason}
                  />
                ))}
              </div>
              <button onClick={loadSuggestions}
                className="mt-6 text-[10px] tracking-[0.15em] uppercase"
                style={{ fontFamily: "var(--font-mono)", color: "#6a3a9a" }}>
                Refresh Suggestions →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
