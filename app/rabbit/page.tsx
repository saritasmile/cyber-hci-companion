"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RabbitResult { summary: string; analyst_note: string; hci_note: string; related: string[]; rabbit: string; }
interface TrailEntry { keyword: string; result: RabbitResult; }
interface Bookmark { topic: string; type: "topic" | "related" | "surprising"; }
const MAX_TRAIL = 8;

// ── UI Primitives ─────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

function SectionLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="text-[9px] uppercase tracking-[0.25em] mb-2" style={{ fontFamily: "var(--font-mono)", color: color ?? "var(--text-dim)" }}>
      {children}
    </p>
  );
}

function StreamingIndicator({ accent }: { accent: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-2">
        <span className="inline-flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: accent, animationDelay: `${i * 0.15}s` }} />
          ))}
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Exploring…</span>
      </div>
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-5">
            <div className="h-2 w-16 rounded mb-3" style={{ backgroundColor: accent + "30" }} />
            <div className="space-y-2">
              <div className="h-3 rounded w-full skeleton-line" />
              <div className="h-3 rounded w-4/5 skeleton-line" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bookmark button ────────────────────────────────────────────────────────────

function BookmarkButton({
  saved,
  onToggle,
  size = "md",
}: {
  saved: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      title={saved ? "Remove bookmark" : "Bookmark"}
      className="shrink-0 transition-all hover:scale-110 active:scale-95"
      style={{
        fontSize: size === "sm" ? "11px" : "14px",
        color: saved ? "#d4a860" : "var(--text-dim)",
        lineHeight: 1,
      }}
    >
      {saved ? "★" : "☆"}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RabbitPage() {
  const [inputValue, setInputValue] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [trail, setTrail] = useState<TrailEntry[]>([]);
  const [current, setCurrent] = useState<TrailEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // ── Auth + load bookmarks ──────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        loadBookmarks(data.user.id);
      }
    });
  }, []);

  const loadBookmarks = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("rabbit_bookmarks")
      .select("topic, type")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (data) setBookmarks(data as Bookmark[]);
  }, []);

  const isBookmarked = (topic: string, type: "topic" | "related") =>
    bookmarks.some((b) => b.topic === topic && b.type === type);

  const toggleBookmark = useCallback(async (topic: string, type: "topic" | "related") => {
    if (!userId) return;
    if (isBookmarked(topic, type)) {
      setBookmarks((prev) => prev.filter((b) => !(b.topic === topic && b.type === type)));
      await supabase
        .from("rabbit_bookmarks")
        .delete()
        .eq("user_id", userId)
        .eq("topic", topic)
        .eq("type", type);
    } else {
      setBookmarks((prev) => [{ topic, type }, ...prev]);
      await supabase
        .from("rabbit_bookmarks")
        .insert({ user_id: userId, topic, type });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, bookmarks]);

  // ── Exploration ────────────────────────────────────────────────────────────

  async function explore(keyword: string) {
    if (!keyword.trim() || streaming) return;
    const kw = keyword.trim();
    setStreaming(true); setError(null);
    try {
      const res = await fetch("/api/rabbit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: kw }) });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let accumulated = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; accumulated += decoder.decode(value, { stream: true }); }
      const parsed = JSON.parse(accumulated.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()) as RabbitResult;
      const entry: TrailEntry = { keyword: kw, result: parsed };
      setCurrent(entry);
      setTrail((prev) => { const next = [...prev, entry]; return next.length > MAX_TRAIL ? next.slice(next.length - MAX_TRAIL) : next; });
      recordKnowledgeMapEntry(kw);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Exploration failed. Please try again.");
    } finally { setStreaming(false); }
  }

  async function recordKnowledgeMapEntry(keyword: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: existing } = await supabase.from("knowledge_map_entries").select("id, visit_count").eq("user_id", user.id).eq("topic", keyword).eq("module", "rabbit").maybeSingle();
      if (existing) {
        await supabase.from("knowledge_map_entries").update({ visit_count: existing.visit_count + 1, last_visited: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await supabase.from("knowledge_map_entries").insert({ user_id: user.id, topic: keyword, module: "rabbit", depth_level: "touched", visit_count: 1, last_visited: new Date().toISOString() });
      }
    } catch { /* Non-critical */ }
  }

  const topicBookmarks = bookmarks.filter((b) => b.type === "topic");
  const relatedBookmarks = bookmarks.filter((b) => b.type === "related");
  const surprisingBookmarks = bookmarks.filter((b) => b.type === "surprising");

  return (
    <div className="px-10 py-10 max-w-3xl responsive-padding">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Module</p>
        <h1 className="page-title mb-2" style={{ fontFamily: "var(--font-heading)" }}>Rabbit Hole</h1>
        <p className="text-sm max-w-xl leading-relaxed" style={{ color: "var(--text-mid)" }}>
          Enter a keyword to start exploring. Follow related concepts through clickable pills and discover surprising connections.
        </p>
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); explore(inputValue); setInputValue(""); }} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g. Supply chain attack, Nudge theory, Passkeys…"
            className="flex-1 px-4 py-3 text-sm outline-none transition-all"
            style={{ fontFamily: "var(--font-body)", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "2px", color: "var(--text)" }}
            onFocus={(e) => { e.target.style.borderColor = "#c8a8e8"; e.target.style.boxShadow = "0 0 0 3px rgba(106,58,154,0.06)"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
            disabled={streaming}
          />
          <button
            type="submit" disabled={!inputValue.trim() || streaming}
            className="px-5 py-2 text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            style={{ fontFamily: "var(--font-mono)", backgroundColor: "#f2ecfa", border: "1px solid #c8a8e8", borderRadius: "2px", color: "#6a3a9a" }}
          >
            {streaming ? "Exploring…" : "Explore →"}
          </button>
        </div>
      </form>

      {/* Session trail */}
      {trail.length > 0 && (
        <div className="mb-6">
          <p className="text-[9px] uppercase tracking-[0.25em] mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
            Trail {trail.length > 0 && `· ${trail.length}/${MAX_TRAIL}`}
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            {trail.map((entry, i) => {
              const isCurrent = current?.keyword === entry.keyword && i === trail.length - 1;
              return (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>→</span>}
                  <button
                    onClick={() => setCurrent(entry)}
                    className="text-[10px] px-2.5 py-1 rounded-full border transition-colors"
                    style={{
                      fontFamily: "var(--font-mono)",
                      borderColor: isCurrent ? "#c8a8e8" : "var(--border)",
                      backgroundColor: isCurrent ? "#f2ecfa" : "transparent",
                      color: isCurrent ? "#6a3a9a" : "var(--text-dim)",
                    }}
                  >
                    {entry.keyword}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Bookmarks panel */}
      {userId && bookmarks.length > 0 && (
        <div className="mb-6 card overflow-hidden">
          <button
            onClick={() => setBookmarksOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[var(--bg-subtle)]"
          >
            <div className="flex items-center gap-2">
              <span style={{ color: "#d4a860", fontSize: "13px" }}>★</span>
              <span className="text-[10px] uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>
                Bookmarks
              </span>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded"
                style={{ fontFamily: "var(--font-mono)", backgroundColor: "#faf0e0", color: "#8a5a1a", border: "1px solid #d4a860" }}
              >
                {bookmarks.length}
              </span>
            </div>
            <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)", transform: bookmarksOpen ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform 0.15s" }}>›</span>
          </button>

          {bookmarksOpen && (
            <div className="px-4 pb-4 space-y-4" style={{ borderTop: "1px solid var(--border)" }}>
              {topicBookmarks.length > 0 && (
                <div className="pt-3">
                  <p className="text-[9px] uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {topicBookmarks.map((b) => (
                      <div key={b.topic} className="flex items-center gap-1">
                        <button
                          onClick={() => explore(b.topic)}
                          disabled={streaming}
                          className="text-[11px] px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                          style={{ fontFamily: "var(--font-mono)", borderColor: "#d4a860", backgroundColor: "#faf0e0", color: "#6a4010" }}
                        >
                          {b.topic}
                        </button>
                        <BookmarkButton size="sm" saved onToggle={() => toggleBookmark(b.topic, "topic")} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedBookmarks.length > 0 && (
                <div className={topicBookmarks.length > 0 ? "pt-2" : "pt-3"}>
                  <p className="text-[9px] uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Related Concepts to Explore</p>
                  <div className="flex flex-wrap gap-2">
                    {relatedBookmarks.map((b) => (
                      <div key={b.topic} className="flex items-center gap-1">
                        <button
                          onClick={() => explore(b.topic)}
                          disabled={streaming}
                          className="text-[11px] px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                          style={{ fontFamily: "var(--font-mono)", borderColor: "#c8a8e8", backgroundColor: "#f2ecfa", color: "#4a1a7a" }}
                        >
                          {b.topic}
                        </button>
                        <BookmarkButton size="sm" saved onToggle={() => toggleBookmark(b.topic, "related")} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {surprisingBookmarks.length > 0 && (
                <div className={topicBookmarks.length > 0 || relatedBookmarks.length > 0 ? "pt-2" : "pt-3"}>
                  <p className="text-[9px] uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "var(--font-mono)", color: "#8a5a1a" }}>Surprising Connections</p>
                  <div className="space-y-2">
                    {surprisingBookmarks.map((b) => (
                      <div key={b.topic} className="flex items-start gap-2 p-3 rounded" style={{ backgroundColor: "#faf0e0", border: "1px solid #d4a860" }}>
                        <p className="flex-1 text-xs leading-relaxed" style={{ color: "var(--text)" }}>{b.topic}</p>
                        <BookmarkButton size="sm" saved onToggle={() => toggleBookmark(b.topic, "surprising")} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-5 mb-6" style={{ borderColor: "#f0c4a0" }}>
          <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ fontFamily: "var(--font-mono)", color: "#c04a0a" }}>Error</p>
          <p className="text-sm" style={{ color: "var(--text-mid)" }}>{error}</p>
        </div>
      )}

      {streaming && <StreamingIndicator accent="#6a3a9a" />}

      {/* Current result */}
      {current && !streaming && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}>{current.keyword}</h2>
            {userId && (
              <BookmarkButton
                saved={isBookmarked(current.keyword, "topic")}
                onToggle={() => toggleBookmark(current.keyword, "topic")}
              />
            )}
          </div>

          <Card>
            <SectionLabel>Overview</SectionLabel>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{current.result.summary}</p>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <SectionLabel color="#0a7a68">Analyst Note</SectionLabel>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{current.result.analyst_note}</p>
            </Card>
            <Card>
              <SectionLabel color="#c04a0a">HCI / UX Note</SectionLabel>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{current.result.hci_note}</p>
            </Card>
          </div>

          {/* Related concepts */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] mb-3" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Related Concepts</p>
            <div className="flex flex-wrap gap-2">
              {current.result.related.map((concept, i) => {
                const alreadyExplored = trail.some((t) => t.keyword === concept);
                const atLimit = trail.length >= MAX_TRAIL;
                const saved = isBookmarked(concept, "related");
                return (
                  <div key={i} className="flex items-center gap-1">
                    <button
                      onClick={() => { if (!streaming && !atLimit) explore(concept); }}
                      disabled={streaming || atLimit}
                      className="text-xs px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        fontFamily: "var(--font-mono)",
                        borderColor: alreadyExplored ? "#c8a8e8" : "var(--border)",
                        backgroundColor: alreadyExplored ? "#f2ecfa" : "var(--bg-card)",
                        color: alreadyExplored ? "#6a3a9a" : "var(--text-mid)",
                      }}
                      title={atLimit ? `Trail limit reached (${MAX_TRAIL})` : `Explore: ${concept}`}
                    >
                      {alreadyExplored && <span className="mr-1 opacity-60">✓</span>}
                      {concept}
                    </button>
                    {userId && (
                      <BookmarkButton
                        size="sm"
                        saved={saved}
                        onToggle={() => toggleBookmark(concept, "related")}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {trail.length >= MAX_TRAIL && (
              <p className="text-[10px] mt-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
                Trail limit reached ({MAX_TRAIL} concepts). Start a new search to continue.
              </p>
            )}
          </div>

          {/* Surprising connection */}
          <div className="p-5 border" style={{ borderColor: "#d4a860", backgroundColor: "#faf0e0", borderRadius: "3px" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] uppercase tracking-[0.25em]" style={{ fontFamily: "var(--font-mono)", color: "#8a5a1a" }}>Surprising Connection</p>
              {userId && (
                <BookmarkButton
                  saved={isBookmarked(current.result.rabbit, "surprising")}
                  onToggle={() => toggleBookmark(current.result.rabbit, "surprising")}
                />
              )}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{current.result.rabbit}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!current && !streaming && !error && (
        <div className="py-12 text-center">
          <p className="text-2xl mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--border-hi)" }}>⬢</p>
          <p className="text-[10px] uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Enter a keyword to begin exploring</p>
        </div>
      )}
    </div>
  );
}
