"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { scenarios } from "@/lib/scenarios";
import { resources } from "@/lib/resources";
import type { ResourceStatus } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RecentEntry {
  topic: string;
  module: string;
  visit_count: number;
  last_visited: string;
}

interface FeedItem {
  id: string;
  title: string;
  source: string;
  effort: string;
  url?: string;
  lens: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function topicHref(entry: RecentEntry): string {
  if (entry.module === "scenario") return `/scenarios/${entry.topic}`;
  return "#";
}

function topicLabel(entry: RecentEntry): string {
  if (entry.module === "scenario") {
    const s = scenarios.find((sc) => sc.slug === entry.topic);
    return s?.name ?? entry.topic;
  }
  return entry.topic;
}

function moduleLabel(module: string): string {
  const map: Record<string, string> = {
    scenario: "Scenario Intelligence",
    "rabbit-hole": "Rabbit Hole",
    patterns: "Design Patterns",
    "knowledge-map": "Knowledge Map",
  };
  return map[module] ?? module;
}

const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning.";
  if (h < 17) return "Good afternoon.";
  return "Good evening.";
};

const todayLabel = (): string => {
  const d = new Date();
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${days[d.getDay()]} · ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

// ── Dot colors by lens ────────────────────────────────────────────────────────

const LENS_DOT: Record<string, string> = {
  analyst:   "var(--leaf)",
  commander: "var(--pool)",
  hci:       "var(--clay)",
  default:   "var(--oak)",
};

// ── Pulse strip ───────────────────────────────────────────────────────────────

function PulseStrip() {
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    supabase
      .from("feed_items")
      .select("id, title, source, effort, url, lens")
      .order("published_at", { ascending: false })
      .limit(4)
      .then(({ data }) => { if (data) setItems(data as FeedItem[]); });
  }, []);

  // Fallback if feed is empty
  const display: FeedItem[] = items.length > 0 ? items : [
    { id: "1", title: "CISA warns of actively exploited Ivanti zero-days — federal agencies directed to patch immediately", source: "CISA", effort: "2 min", lens: "analyst" },
    { id: "2", title: "New research on MFA fatigue attacks — tooling now automates push notification floods", source: "Krebs", effort: "5 min", lens: "commander" },
    { id: "3", title: "NIST updates password guidelines — removes complexity rules, recommends length and breach-checking", source: "NIST", effort: "3 min", lens: "default" },
  ];

  return (
    <div style={{ marginBottom: "44px" }}>
      <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        Pulse
        <span style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
      </p>
      <div style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
        {display.map((item, i) => {
          const dot = LENS_DOT[item.lens] ?? LENS_DOT.default;
          return (
            <a
              key={item.id}
              href={item.url ?? "#"}
              target={item.url ? "_blank" : undefined}
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "12px 18px",
                borderBottom: i < display.length - 1 ? "1px solid var(--border)" : "none",
                textDecoration: "none", transition: "background 0.1s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ width: "4px", height: "4px", backgroundColor: dot, flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: "var(--text)", flex: 1, lineHeight: 1.45 }}>
                {item.title}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)", flexShrink: 0, marginRight: "8px" }}>
                {item.source}
              </span>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "8px", padding: "2px 7px",
                border: `1px solid ${dot}`, color: dot, flexShrink: 0,
                backgroundColor: "transparent",
              }}>
                {item.effort}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ── Session cards ─────────────────────────────────────────────────────────────

function SessionCards({ recentTopics }: { recentTopics: string[] }) {
  const sessionTitle = recentTopics.length > 0
    ? `After ${topicLabel({ topic: recentTopics[0], module: "scenario", visit_count: 1, last_visited: "" })} — what to read next`
    : "Your AI-assembled session for today";

  return (
    <div style={{ marginBottom: "1px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--border)" }}>
        {/* AI session */}
        <Link href="/sessions" style={{ textDecoration: "none" }}>
          <div
            style={{
              background: "var(--bg-hover)", padding: "24px 26px",
              cursor: "pointer", position: "relative", transition: "background 0.12s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#ede3d4")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-hover)")}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "var(--oak)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--oak)" }}>AI · 15 min</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--text-dim)" }}>3 items</span>
            </div>
            <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)", lineHeight: 1.3, marginBottom: "8px", letterSpacing: "-0.01em" }}>
              {sessionTitle}
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-mid)", lineHeight: 1.65, marginBottom: "16px" }}>
              Assembled from your recent scenario history. Covers ransomware response, pipeline security, and one UX angle you haven't seen yet.
            </p>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--oak)" }}>
              Start session →
            </span>
          </div>
        </Link>

        {/* Curated session */}
        <Link href="/sessions" style={{ textDecoration: "none" }}>
          <div
            style={{
              background: "var(--bg-card)", padding: "24px 26px",
              cursor: "pointer", position: "relative", transition: "background 0.12s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-card)")}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "var(--border)", transition: "background 0.15s" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-dim)" }}>Curated · 1 hour</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--text-dim)" }}>5 items</span>
            </div>
            <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)", lineHeight: 1.3, marginBottom: "8px", letterSpacing: "-0.01em" }}>
              Understanding supply chain attacks
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-mid)", lineHeight: 1.65, marginBottom: "16px" }}>
              A deep curated playlist on supply chain compromise — from SolarWinds to XZ Utils. Mix of videos, articles, and one expert to follow.
            </p>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--pool)" }}>
              Start session →
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

// ── Session generator ─────────────────────────────────────────────────────────

function SessionGenerator() {
  const [query, setQuery] = useState("");
  const [time, setTime] = useState<"15" | "60" | null>(null);
  const [focused, setFocused] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ title: string; meta: string; items: { label: string; type: string; duration: string }[] } | null>(null);

  const isReady = query.trim().length > 3 && time !== null;

  const handleGenerate = useCallback(async () => {
    if (!isReady) return;
    setGenerating(true);
    setResult(null);
    // Simulate generation — in production this would call /api/sessions/generate
    await new Promise(r => setTimeout(r, 1600));
    setResult({
      title: query,
      meta: `3 items · ~17 min · ${time === "15" ? "15-min" : "1-hour"} session`,
      items: [
        { label: "Overview and key concepts", type: "Article", duration: "5 min" },
        { label: "Deep-dive video explainer", type: "Video", duration: "10 min" },
        { label: "Related design pattern", type: "Pattern", duration: "4 min" },
      ],
    });
    setGenerating(false);
  }, [isReady, query, time]);

  const prompts = [
    "how zero trust architecture works",
    "ransomware negotiation and incident response",
    "why users bypass security controls",
    "designing better authentication UX",
  ];

  const seam = "var(--border)";
  const oak = "var(--oak)";

  return (
    <div style={{
      border: `1px solid ${focused ? "var(--oak-bdr)" : seam}`,
      background: focused ? "var(--bg-hover)" : "var(--bg-card)",
      transition: "border-color 0.15s, background 0.15s",
    }}>
      {/* Input row */}
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", borderRight: `1px solid ${seam}` }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: oak, flexShrink: 0 }}>✦</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => { if (e.key === "Enter") handleGenerate(); }}
            placeholder="What do you want to learn today?"
            style={{
              flex: 1, border: "none", background: "transparent",
              fontFamily: "var(--font-ui)", fontSize: "13px",
              color: "var(--text)", outline: "none",
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "stretch", flexShrink: 0 }}>
          {(["15", "60"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTime(time === t ? null : t)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "0 18px", border: "none",
                borderRight: `1px solid ${seam}`, cursor: "pointer", minWidth: "82px",
                background: time === t ? "var(--bg-hover)" : "transparent",
                transition: "background 0.1s",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 500, color: time === t ? "var(--text)" : "var(--text-mid)" }}>
                {t === "15" ? "15 min" : "1 hour"}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--text-dim)", marginTop: "2px" }}>
                {t === "15" ? "Quick" : "Deep"}
              </span>
            </button>
          ))}
          <button
            onClick={handleGenerate}
            disabled={!isReady}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 22px", border: "none", cursor: isReady ? "pointer" : "default",
              minWidth: "110px", background: "transparent",
              fontFamily: "var(--font-mono)", fontSize: "9px",
              letterSpacing: "0.16em", textTransform: "uppercase",
              color: isReady ? oak : "var(--text-dim)",
              opacity: isReady ? 1 : 0.4, transition: "all 0.12s",
            }}
          >
            Generate →
          </button>
        </div>
      </div>

      {/* Prompt suggestions */}
      {!generating && !result && (
        <div style={{ borderTop: `1px solid ${seam}`, padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-dim)", flexShrink: 0 }}>Try</span>
          {prompts.map(p => (
            <button
              key={p}
              onClick={() => setQuery(p)}
              style={{
                fontFamily: "var(--font-mono)", fontSize: "9px", padding: "3px 10px",
                border: `1px solid ${seam}`, background: "transparent",
                color: "var(--text-mid)", cursor: "pointer", transition: "all 0.1s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--pool-bdr)"; e.currentTarget.style.color = "var(--pool)"; e.currentTarget.style.background = "var(--pool-bg)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = seam; e.currentTarget.style.color = "var(--text-mid)"; e.currentTarget.style.background = "transparent"; }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Generating */}
      {generating && (
        <div style={{ borderTop: `1px solid ${seam}`, padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{
            width: "12px", height: "12px", border: `1px solid var(--border-hi)`,
            borderTopColor: oak, borderRadius: "50%",
            animation: "spin 0.9s linear infinite", flexShrink: 0,
            display: "inline-block",
          }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)" }}>
            Assembling session — <em style={{ color: "var(--text-mid)" }}>&ldquo;{query}&rdquo;</em>
          </span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ borderTop: `1px solid ${seam}`, padding: "22px" }}>
          <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)", marginBottom: "4px" }}>{result.title}</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)", marginBottom: "16px" }}>{result.meta}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)", marginBottom: "18px" }}>
            {result.items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "var(--bg-hover)" }}>
                <span style={{ width: "2px", height: "16px", background: oak, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: "12px", color: "var(--text)" }}>{item.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--text-dim)" }}>{item.type} · {item.duration}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link href="/sessions" style={{
              padding: "9px 22px", background: "var(--text)", color: "var(--bg)",
              fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em",
              textTransform: "uppercase", textDecoration: "none",
            }}>
              Start session →
            </Link>
            <button
              onClick={() => { setResult(null); setGenerating(false); }}
              style={{ padding: "9px 14px", background: "transparent", border: `1px solid ${seam}`, fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-mid)", cursor: "pointer" }}
            >
              Regenerate
            </button>
            <button
              onClick={() => { setResult(null); setQuery(""); setTime(null); }}
              style={{ padding: "9px 14px", background: "transparent", border: `1px solid ${seam}`, fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-mid)", cursor: "pointer" }}
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Progress zone ─────────────────────────────────────────────────────────────

function ProgressZone() {
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [saved, setSaved] = useState<{ id: string; title: string; type: string; status: ResourceStatus }[]>([]);
  const [inProgress, setInProgress] = useState<{ id: string; title: string; type: string }[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Recent scenarios
      const { data: recentData } = await supabase
        .from("knowledge_map_entries")
        .select("topic, module, visit_count, last_visited")
        .eq("user_id", user.id)
        .order("last_visited", { ascending: false })
        .limit(3);
      if (recentData) setRecent(recentData as RecentEntry[]);

      // Saved + in-progress resources
      const { data: progressData } = await supabase
        .from("resource_progress")
        .select("resource_id, status")
        .eq("user_id", user.id)
        .in("status", ["saved", "in_progress"]);
      if (progressData) {
        const mapped = progressData.map(row => {
          const r = resources.find(res => res.id === row.resource_id);
          return r ? { id: r.id, title: r.title, type: r.type, status: row.status as ResourceStatus } : null;
        }).filter(Boolean) as { id: string; title: string; type: string; status: ResourceStatus }[];
        setSaved(mapped.filter(r => r.status === "saved").slice(0, 2));
        setInProgress(mapped.filter(r => r.status === "in_progress").slice(0, 2));
      }
    }
    load();
  }, []);

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p style={{
      fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.22em",
      textTransform: "uppercase", color: "var(--text-dim)",
      paddingBottom: "10px", borderBottom: "1px solid var(--border)", marginBottom: "0",
    }}>
      {children}
    </p>
  );

  const ProgressCard = ({ href, module, title, meta, statusLabel, statusColor, statusBorder }: {
    href: string; module: string; title: string; meta: string;
    statusLabel: string; statusColor: string; statusBorder: string;
  }) => (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          padding: "14px 16px", background: "var(--bg-card)",
          border: "1px solid var(--border)", cursor: "pointer",
          transition: "border-color 0.15s, background 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--oak-bdr)"; e.currentTarget.style.background = "var(--bg-hover)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-card)"; }}
      >
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--text-dim)", marginBottom: "5px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{module}</p>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", lineHeight: 1.35, marginBottom: "8px" }}>{title}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--text-dim)" }}>{meta}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", padding: "2px 7px", border: `1px solid ${statusBorder}`, color: statusColor }}>{statusLabel}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div style={{ marginBottom: "44px" }}>
      <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        Your progress
        <span style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>

        {/* Continue */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <SectionLabel>Continue</SectionLabel>
          {inProgress.length > 0 ? inProgress.map(r => (
            <ProgressCard key={r.id} href="/resources" module={r.type} title={r.title} meta={r.type} statusLabel="In progress" statusColor="var(--oak)" statusBorder="var(--oak-bdr)" />
          )) : (
            <ProgressCard href="/sessions" module="Session" title="Start your first session" meta="Pick a topic above" statusLabel="New" statusColor="var(--pool)" statusBorder="var(--pool-bdr)" />
          )}
        </div>

        {/* Saved */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <SectionLabel>On your list</SectionLabel>
          {saved.length > 0 ? saved.map(r => (
            <ProgressCard key={r.id} href="/resources" module={r.type} title={r.title} meta={r.type} statusLabel="Saved" statusColor="var(--pool)" statusBorder="var(--pool-bdr)" />
          )) : (
            <ProgressCard href="/resources" module="Learning Resources" title="Browse the resource library" meta="Save items to track them here" statusLabel="Explore" statusColor="var(--pool)" statusBorder="var(--pool-bdr)" />
          )}
        </div>

        {/* Recently explored */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <SectionLabel>Recently explored</SectionLabel>
          {recent.length > 0 ? recent.map(entry => (
            <ProgressCard
              key={`${entry.module}-${entry.topic}`}
              href={topicHref(entry)}
              module={moduleLabel(entry.module)}
              title={topicLabel(entry)}
              meta={timeAgo(entry.last_visited)}
              statusLabel={`×${entry.visit_count}`}
              statusColor="var(--leaf)"
              statusBorder="var(--leaf-bdr)"
            />
          )) : (
            <ProgressCard href="/scenarios" module="Scenario Intelligence" title="Explore your first scenario" meta="Nothing explored yet" statusLabel="Start" statusColor="var(--leaf)" statusBorder="var(--leaf-bdr)" />
          )}
        </div>

      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [recentTopics, setRecentTopics] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("knowledge_map_entries")
        .select("topic")
        .eq("user_id", user.id)
        .eq("module", "scenario")
        .order("last_visited", { ascending: false })
        .limit(3);
      if (data) setRecentTopics(data.map((d: { topic: string }) => d.topic));
    });
  }, []);

  return (
    <div style={{ padding: "48px 56px 80px", maxWidth: "980px" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        marginBottom: "40px", paddingBottom: "22px", borderBottom: "1px solid var(--border)",
      }}>
        <h1 style={{ fontSize: "26px", fontWeight: 300, color: "var(--text)", letterSpacing: "-0.02em" }}>
          {greeting().replace(".", "")} <strong style={{ fontWeight: 600 }}>
            {greeting().split(" ").slice(-1)[0].replace(".", "")}.
          </strong>
        </h1>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-dim)" }}>
          {todayLabel()}
        </span>
      </div>

      {/* Pulse */}
      <PulseStrip />

      {/* Sessions */}
      <div style={{ marginBottom: "44px" }}>
        <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          Today's sessions
          <span style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
        </p>
        <SessionCards recentTopics={recentTopics} />
        <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "20px" }}>
          Build your own
          <span style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
        </p>
        <SessionGenerator />
      </div>

      {/* Progress */}
      <ProgressZone />

      {/* Keyframe for spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
