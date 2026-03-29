"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { resources, RESOURCE_TYPE_CONFIG, RESOURCE_STATUS_CONFIG, COST_CONFIG } from "@/lib/resources";
import type { Resource, ResourceType, ResourceStatus, ResourceWithStatus } from "@/types";

interface Suggestion { id: string; reason: string; }

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] uppercase tracking-[0.25em] mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
      {children}
    </p>
  );
}

function TypeBadge({ type }: { type: ResourceType }) {
  const cfg = RESOURCE_TYPE_CONFIG[type];
  return (
    <span className="tracking-[0.15em] px-2 py-0.5 border"
      style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: cfg.color, borderColor: cfg.bdr, backgroundColor: cfg.bg, borderRadius: "2px" }}>
      {cfg.label.toUpperCase()}
    </span>
  );
}

function CostBadge({ cost }: { cost: Resource["cost"] }) {
  const cfg = COST_CONFIG[cost];
  return <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: cfg.color }}>{cfg.label}</span>;
}

const STATUS_OPTIONS: { value: ResourceStatus; label: string }[] = [
  { value: "saved",          label: "Saved" },
  { value: "in_progress",    label: "In Progress" },
  { value: "completed",      label: "Completed" },
  { value: "not_interested", label: "Not Interested" },
];

function StatusPicker({ resourceId, current, onUpdate }: { resourceId: string; current: ResourceStatus | null; onUpdate: (id: string, status: ResourceStatus | null) => void; }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSelect = async (status: ResourceStatus) => {
    setSaving(true); setOpen(false);
    const newStatus = current === status ? null : status;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (newStatus === null) {
        await supabase.from("resource_progress").delete().eq("user_id", user.id).eq("resource_id", resourceId);
      } else {
        await supabase.from("resource_progress").upsert({ user_id: user.id, resource_id: resourceId, status: newStatus, updated_at: new Date().toISOString() }, { onConflict: "user_id,resource_id" });
      }
      onUpdate(resourceId, newStatus);
    } catch (err) { console.error("Status update failed:", err); } finally { setSaving(false); }
  };

  const cfg = current ? RESOURCE_STATUS_CONFIG[current] : null;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} disabled={saving}
        className="tracking-[0.12em] uppercase px-2 py-1 border transition-colors"
        style={{ fontFamily: "var(--font-mono)", fontSize: "9px", borderRadius: "2px", color: cfg ? cfg.color : "var(--text-dim)", borderColor: cfg ? cfg.bdr : "var(--border)", backgroundColor: cfg ? cfg.bg : "transparent" }}>
        {saving ? "..." : (current ? RESOURCE_STATUS_CONFIG[current].label : "Track →")}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 card py-1 min-w-[140px]" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
            {STATUS_OPTIONS.map((opt) => {
              const optCfg = RESOURCE_STATUS_CONFIG[opt.value];
              const isActive = current === opt.value;
              return (
                <button key={opt.value} onClick={() => handleSelect(opt.value)}
                  className="w-full text-left px-3 py-2 tracking-[0.1em] transition-colors"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: isActive ? optCfg.color : "var(--text-mid)", backgroundColor: isActive ? optCfg.bg : "transparent" }}>
                  {isActive ? "✓ " : ""}{opt.label}
                </button>
              );
            })}
            {current && (
              <>
                <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />
                <button onClick={() => handleSelect(current)} className="w-full text-left px-3 py-2 tracking-[0.1em]"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)" }}>Clear</button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ResourceCard({ resource, status, onStatusUpdate, suggestionReason }: { resource: Resource; status: ResourceStatus | null; onStatusUpdate: (id: string, status: ResourceStatus | null) => void; suggestionReason?: string; }) {
  const typeCfg = RESOURCE_TYPE_CONFIG[resource.type];
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", opacity: status === "not_interested" ? 0.45 : 1 }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <TypeBadge type={resource.type} />
          {resource.platform && <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)" }}>{resource.platform}</span>}
          <CostBadge cost={resource.cost} />
        </div>
        <StatusPicker resourceId={resource.id} current={status} onUpdate={onStatusUpdate} />
      </div>

      <div>
        <a href={resource.url} target="_blank" rel="noopener noreferrer"
          className="leading-snug hover:underline transition-colors"
          style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500, color: "var(--text)", textDecorationColor: typeCfg.color }}>
          {resource.title}
        </a>
        {resource.author && <p className="mt-0.5" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)" }}>{resource.author}</p>}
      </div>

      <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text)", lineHeight: 1.65 }}>{resource.description}</p>

      {suggestionReason && (
        <div className="leading-relaxed px-3 py-2"
          style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--oak)", backgroundColor: "var(--oak-bg)", borderLeft: "2px solid var(--oak-bdr)" }}>
          {suggestionReason}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {resource.topics.map((t) => (
          <span key={t} className="tracking-[0.1em] px-1.5 py-0.5 border"
            style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--text-dim)", borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)", borderRadius: "2px" }}>
            {t}
          </span>
        ))}
      </div>

      {resource.type === "expert" && resource.socials && (
        <div className="flex gap-3">
          {Object.entries(resource.socials).map(([platform, url]) => (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
              className="tracking-[0.1em] transition-colors hover:underline"
              style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: typeCfg.color }}>
              {platform} →
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

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

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("resource_progress").select("resource_id, status").eq("user_id", user.id);
        if (data) {
          const map: Record<string, ResourceStatus> = {};
          data.forEach((row) => { map[row.resource_id] = row.status as ResourceStatus; });
          setStatusMap(map);
        }
      } finally { setLoadingProgress(false); }
    }
    load();
  }, []);

  const handleStatusUpdate = useCallback((id: string, status: ResourceStatus | null) => {
    setStatusMap((prev) => { const next = { ...prev }; if (status === null) delete next[id]; else next[id] = status; return next; });
  }, []);

  const loadSuggestions = useCallback(async () => {
    setLoadingSuggestions(true); setSuggestionsError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSuggestionsError("Sign in to get personalised suggestions."); return; }
      const res = await fetch("/api/resources/suggest", { headers: { Authorization: `Bearer ${user.id}` } });
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      const data = await res.json();
      if (data.reason === "no_history") {
        setSuggestionsError("Explore some scenarios first — suggestions are based on what you've studied.");
      } else {
        setSuggestions(data.suggestions ?? []);
        setExploredTopics(data.explored ?? []);
      }
    } catch { setSuggestionsError("Could not load suggestions. Please try again."); } finally { setLoadingSuggestions(false); }
  }, []);

  useEffect(() => {
    if (activeTab === "suggested" && suggestions.length === 0 && !suggestionsError) loadSuggestions();
  }, [activeTab, suggestions.length, suggestionsError, loadSuggestions]);

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

  const suggestedResources: (ResourceWithStatus & { reason: string })[] = suggestions
    .map((s) => { const r = resources.find((res) => res.id === s.id); if (!r) return null; return { ...r, status: statusMap[r.id] ?? null, reason: s.reason }; })
    .filter(Boolean) as (ResourceWithStatus & { reason: string })[];

  const completedCount = Object.values(statusMap).filter((s) => s === "completed").length;
  const inProgressCount = Object.values(statusMap).filter((s) => s === "in_progress").length;
  const savedCount = Object.values(statusMap).filter((s) => s === "saved").length;

  const TABS = [
    { id: "library" as const,   label: "Library",            color: "var(--leaf)" },
    { id: "suggested" as const, label: "Suggested for You",  color: "var(--oak)"  },
  ];

  const filterBtn = (active: boolean, color?: string, bg?: string, bdr?: string): React.CSSProperties => ({
    fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase" as const,
    padding: "4px 10px", cursor: "pointer",
    border: `1px solid ${active ? (bdr ?? "var(--border-hi)") : "var(--border)"}`,
    background: active ? (bg ?? "var(--bg-subtle)") : "transparent",
    color: active ? (color ?? "var(--text)") : "var(--text-dim)",
  });

  return (
    <div style={{ padding: "48px 56px 80px", maxWidth: "980px" }}>
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "10px" }}>Module 07 — Learning Resources</p>
        <h1 style={{ fontFamily: "var(--font-body)", fontSize: "26px", fontWeight: 500, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: "10px" }}>Learning Resources</h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-mid)", lineHeight: 1.7, maxWidth: "480px" }}>
          Courses, books, tools, YouTube channels, communities, and experts — curated for the security-minded UX practitioner.
        </p>
      </div>

      {/* Stats */}
      {!loadingProgress && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
          {[
            { label: "Completed",   value: completedCount,  color: "var(--leaf)" },
            { label: "In Progress", value: inProgressCount, color: "var(--oak)"  },
            { label: "Saved",       value: savedCount,      color: "var(--pool)" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "12px 18px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "22px", fontWeight: 500, color: stat.color, marginBottom: "2px" }}>{stat.value}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-dim)" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "20px" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ flexShrink: 0, padding: "10px 16px", fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: isActive ? tab.color : "var(--text-dim)", borderBottom: `2px solid ${isActive ? tab.color : "transparent"}`, marginBottom: "-1px", background: "transparent", border: "none", borderBottomStyle: "solid", borderBottomWidth: "2px", borderBottomColor: isActive ? tab.color : "transparent", cursor: "pointer" }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "library" && (
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px", alignItems: "center" }}>
            <button onClick={() => setFilterType("all")} style={filterBtn(filterType === "all")}>All Types</button>
            {ALL_TYPES.map((t) => {
              const cfg = RESOURCE_TYPE_CONFIG[t];
              const isActive = filterType === t;
              return <button key={t} onClick={() => setFilterType(isActive ? "all" : t)} style={filterBtn(isActive, cfg.color, cfg.bg, cfg.bdr)}>{cfg.icon} {cfg.label}</button>;
            })}
            <div style={{ width: "1px", height: "18px", background: "var(--border)" }} />
            {(["all", "free", "freemium", "paid"] as const).map((c) => (
              <button key={c} onClick={() => setFilterCost(c)} style={filterBtn(filterCost === c)}>
                {c === "all" ? "Any Cost" : COST_CONFIG[c].label}
              </button>
            ))}
            <div style={{ width: "1px", height: "18px", background: "var(--border)" }} />
            {([{ value: "all", label: "All" }, { value: "saved", label: "Saved" }, { value: "in_progress", label: "In Progress" }, { value: "completed", label: "Completed" }] as const).map((s) => (
              <button key={s.value} onClick={() => setFilterStatus(s.value)} style={filterBtn(filterStatus === s.value)}>{s.label}</button>
            ))}
          </div>

          <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)", marginBottom: "14px" }}>
            {filteredResources.length} resource{filteredResources.length !== 1 ? "s" : ""}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "var(--border)" }}>
            {filteredResources.map((r) => <ResourceCard key={r.id} resource={r} status={statusMap[r.id] ?? null} onStatusUpdate={handleStatusUpdate} />)}
          </div>

          {filteredResources.length === 0 && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "32px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-dim)" }}>No resources match these filters.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "suggested" && (
        <div>
          {loadingSuggestions ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "20px" }}>
                  <div className="h-2 w-24 mb-4" style={{ backgroundColor: "var(--bg-subtle)" }} />
                  <div className="space-y-2">
                    <div className="h-3 rounded w-full skeleton-line" />
                    <div className="h-3 rounded w-5/6 skeleton-line" />
                  </div>
                </div>
              ))}
              <p className="text-center pt-2" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)" }}>Analysing your scenario history…</p>
            </div>
          ) : suggestionsError ? (
            <div className="card p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>No suggestions yet</p>
              <p className="mb-4" style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-mid)" }}>{suggestionsError}</p>
              <button onClick={loadSuggestions} className="tracking-[0.15em] uppercase" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--leaf)" }}>Try Again →</button>
            </div>
          ) : (
            <div>
              {exploredTopics.length > 0 && (
                <div className="mb-6 card p-4">
                  <SectionLabel>Based on your explored scenarios</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {exploredTopics.map((t) => (
                      <span key={t} className="tracking-[0.12em] uppercase px-2 py-0.5 border"
                        style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--pool)", borderColor: "var(--pool-bdr)", backgroundColor: "var(--pool-bg)", borderRadius: "2px" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {suggestedResources.map((r) => <ResourceCard key={r.id} resource={r} status={r.status} onStatusUpdate={handleStatusUpdate} suggestionReason={r.reason} />)}
              </div>
              <button onClick={loadSuggestions} className="mt-6 tracking-[0.15em] uppercase" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--oak)" }}>Refresh Suggestions →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
