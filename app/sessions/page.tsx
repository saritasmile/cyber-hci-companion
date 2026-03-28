"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { resources } from "@/lib/resources";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SessionItem {
  id: string;
  type: string;
  title: string;
  author?: string;
  description: string;
  url: string;
  duration: string;
  reason?: string;
}

interface Session {
  id: string;
  title: string;
  description: string;
  type: "ai" | "curated";
  duration: string;
  item_count: number;
  items: SessionItem[];
  saved?: boolean;
}

type Reaction = "like" | "dislike" | "skip" | null;

// ── Curated sessions library ──────────────────────────────────────────────────

const CURATED_SESSIONS: Session[] = [
  {
    id: "supply-chain",
    title: "Understanding supply chain attacks",
    description: "From SolarWinds to XZ Utils — how attackers compromise software before it reaches you, and what defenders and designers can do about it.",
    type: "curated",
    duration: "~54 min",
    item_count: 4,
    items: [
      { id: "sc1", type: "book", title: "Sandworm — supply chain chapter", author: "Andy Greenberg", description: "The definitive account of Russia's most destructive cyber operations.", url: "https://www.penguinrandomhouse.com/books/597684/sandworm-by-andy-greenberg/", duration: "12 min" },
      { id: "sc2", type: "youtube", title: "LiveOverflow — supply chain deep dive", author: "LiveOverflow", description: "Technical but accessible breakdown of how supply chain attacks are constructed.", url: "https://www.youtube.com/@LiveOverflow", duration: "18 min" },
      { id: "sc3", type: "expert", title: "The Grugq on software supply chain OPSEC", author: "@thegrugq", description: "Practical attacker tradecraft applied to supply chain risk.", url: "https://twitter.com/thegrugq", duration: "8 min" },
      { id: "sc4", type: "course", title: "MITRE ATT&CK — supply chain techniques", author: "MITRE", description: "Structured taxonomy of supply chain attack techniques and mitigations.", url: "https://attack.mitre.org", duration: "16 min" },
    ],
  },
  {
    id: "mfa-design",
    title: "The UX of authentication — why it keeps failing",
    description: "MFA fatigue, push floods, and the design decisions that made Uber 2022 possible. What better authentication UX actually looks like.",
    type: "curated",
    duration: "~30 min",
    item_count: 3,
    items: [
      { id: "mfa1", type: "course", title: "Usable Security — authentication module", author: "University of Maryland", description: "The only academic course at the HCI × security intersection.", url: "https://www.coursera.org/learn/usable-security", duration: "20 min" },
      { id: "mfa2", type: "reddit", title: "r/netsec — MFA fatigue discussion threads", author: "r/netsec", description: "Practitioner discussion of real MFA fatigue incidents and defenses.", url: "https://www.reddit.com/r/netsec/", duration: "6 min" },
      { id: "mfa3", type: "expert", title: "SwiftOnSecurity on authentication design", author: "@SwiftOnSecurity", description: "Sharp takes on detection engineering and enterprise authentication failures.", url: "https://twitter.com/SwiftOnSecurity", duration: "4 min" },
    ],
  },
  {
    id: "incident-response-ux",
    title: "Incident response through a human factors lens",
    description: "What happens to decision-making under crisis conditions. How interface design shapes incident outcomes — for better and worse.",
    type: "curated",
    duration: "~38 min",
    item_count: 3,
    items: [
      { id: "ir1", type: "book", title: "Security Engineering — Chapter 2: Usability", author: "Ross Anderson", description: "The canonical text on why security fails at the human and organizational level.", url: "https://www.cl.cam.ac.uk/~rja14/book.html", duration: "18 min" },
      { id: "ir2", type: "youtube", title: "Darknet Diaries — Colonial Pipeline episode", author: "Jack Rhysider", description: "Narrative account of the decisions made during the Colonial Pipeline incident.", url: "https://www.youtube.com/@darknetdiaries", duration: "12 min" },
      { id: "ir3", type: "expert", title: "Lesley Carhart on ICS incident response", author: "hacks4pancakes", description: "ICS/SCADA security expert on defender workflows under crisis conditions.", url: "https://twitter.com/hacks4pancakes", duration: "8 min" },
    ],
  },
];

// ── Player state ──────────────────────────────────────────────────────────────

function SessionPlayer({
  session,
  onClose,
}: {
  session: Session;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [reactions, setReactions] = useState<Reaction[]>(session.items.map(() => null));
  const [saved, setSaved] = useState(session.saved ?? false);
  const [showEnd, setShowEnd] = useState(false);
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());

  const item = session.items[current];
  const reacted = reactions.filter(r => r !== null).length;
  const isLast = current === session.items.length - 1;

  const react = (idx: number, type: Reaction) => {
    setReactions(prev => {
      const next = [...prev];
      next[idx] = prev[idx] === type ? null : type;
      return next;
    });
  };

  const saveItem = (id: string) => {
    setSavedItems(prev => { const next = new Set(prev); next.add(id); return next; });
  };

  const reactionIcon = (r: Reaction) => r === "like" ? "👍" : r === "dislike" ? "👎" : r === "skip" ? "→" : "";

  return (
    <div style={{ display: "flex", flex: 1, height: "100%", minHeight: 0 }}>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px 60px" }}>

        {/* Back */}
        <button
          onClick={onClose}
          style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer", marginBottom: "28px", display: "block", transition: "color 0.12s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-dim)")}
        >
          ← Sessions
        </button>

        {/* Item header */}
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "var(--oak)" }}>{item.type}</span>
          <span>·</span>
          <span>{item.duration}</span>
        </p>
        <h2 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text)", lineHeight: 1.2, marginBottom: "6px", letterSpacing: "-0.02em" }}>{item.title}</h2>
        {item.author && (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)", marginBottom: "18px" }}>{item.author}</p>
        )}

        {/* Reason */}
        {item.reason && (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", lineHeight: 1.55, color: "var(--pool)", background: "var(--pool-bg)", borderLeft: "2px solid var(--pool-bdr)", padding: "8px 12px", marginBottom: "20px" }}>
            {item.reason}
          </div>
        )}

        {/* Description */}
        <p style={{ fontSize: "14px", color: "var(--text-mid)", lineHeight: 1.8, marginBottom: "20px" }}>{item.description}</p>

        {/* External link */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--pool)", borderBottom: "1px solid var(--pool-bdr)", paddingBottom: "1px", textDecoration: "none" }}
        >
          Open resource ↗
        </a>

        {/* Reaction bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "20px", marginTop: "20px", borderTop: "1px solid var(--border)" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-dim)", marginRight: "4px" }}>React</span>
          {(["like", "dislike", "skip"] as Reaction[]).map(r => (
            <button
              key={r!}
              onClick={() => react(current, r)}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "5px 11px", border: `1px solid ${reactions[current] === r ? (r === "like" ? "var(--leaf-bdr)" : r === "dislike" ? "var(--clay-bdr)" : "var(--border-hi)") : "var(--border)"}`,
                background: reactions[current] === r ? (r === "like" ? "var(--leaf-bg)" : r === "dislike" ? "var(--clay-bg)" : "var(--bg-subtle)") : "transparent",
                color: reactions[current] === r ? (r === "like" ? "var(--leaf)" : r === "dislike" ? "var(--clay)" : "var(--text-dim)") : "var(--text-dim)",
                cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "9px",
                letterSpacing: "0.08em", transition: "all 0.12s",
              }}
            >
              {r === "like" ? "👍 Liked" : r === "dislike" ? "👎 Not for me" : "→ Skip"}
            </button>
          ))}
          <button
            onClick={() => saveItem(item.id)}
            style={{
              padding: "5px 11px", border: `1px solid ${savedItems.has(item.id) ? "var(--oak-bdr)" : "var(--border)"}`,
              background: savedItems.has(item.id) ? "var(--oak-bg)" : "transparent",
              color: savedItems.has(item.id) ? "var(--oak)" : "var(--text-dim)",
              cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "9px", transition: "all 0.12s",
            }}
          >
            {savedItems.has(item.id) ? "✓ Saved" : "+ Save"}
          </button>
          <span style={{ flex: 1 }} />
          <button
            onClick={() => { if (isLast) setShowEnd(true); else setCurrent(c => c + 1); }}
            style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px", background: "var(--text)", color: "var(--bg)", border: "none", fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}
          >
            {isLast ? "Finish session →" : `Next — ${session.items[current + 1]?.type} →`}
          </button>
        </div>

        {/* End of session */}
        {showEnd && (
          <div style={{ marginTop: "32px", borderTop: "2px solid var(--border)", paddingTop: "28px" }}>
            <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              Session complete
              <span style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
            </p>

            {/* Reaction recap */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "24px" }}>
              {session.items.map((it, i) => (
                <div key={it.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "13px", width: "20px" }}>{reactionIcon(reactions[i]) || "·"}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--oak)", textTransform: "uppercase", width: "64px", flexShrink: 0 }}>{it.type}</span>
                  <span style={{ fontSize: "12px", color: "var(--text)", flex: 1 }}>{it.title}</span>
                  <button
                    onClick={() => saveItem(it.id)}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "8px", padding: "2px 8px", border: `1px solid ${savedItems.has(it.id) ? "var(--oak-bdr)" : "var(--border)"}`, background: savedItems.has(it.id) ? "var(--oak-bg)" : "transparent", color: savedItems.has(it.id) ? "var(--oak)" : "var(--text-dim)", cursor: "pointer" }}
                  >
                    {savedItems.has(it.id) ? "✓ Saved" : "+ Save"}
                  </button>
                </div>
              ))}
            </div>

            {/* Go deeper */}
            <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              Go deeper
              <span style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              {[
                { icon: "⬡", color: "var(--leaf)", label: "Scenario · explore", title: "Colonial Pipeline — full scenario analysis", desc: "The HCI and Commander views show the human decisions behind the incident." },
                { icon: "◈", color: "var(--pool)", label: "Session · 15 min", title: "The UX of crisis response", desc: "AI-assembled — 3 items on how interfaces hold up under incident pressure." },
              ].map((p, i) => (
                <button
                  key={i}
                  onClick={() => onClose()}
                  style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 16px", background: "var(--bg-card)", border: "1px solid var(--border)", cursor: "pointer", textAlign: "left", transition: "all 0.12s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hi)"; e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-card)"; }}
                >
                  <span style={{ fontSize: "16px", color: p.color, marginTop: "1px", flexShrink: 0 }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: p.color, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "4px" }}>{p.label}</p>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "3px" }}>{p.title}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-dim)" }}>{p.desc}</p>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-dim)", marginTop: "2px" }}>›</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Playlist sidebar */}
      <div style={{ width: "272px", minWidth: "272px", background: "var(--bg-card)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "3px" }}>Session playlist</p>
          <p style={{ fontSize: "12px", color: "var(--text-mid)" }}>{session.items.length} items · {session.duration}</p>
          <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ flex: 1, height: "2px", background: "var(--border)" }}>
              <div style={{ height: "100%", background: "var(--oak)", width: `${(reacted / session.items.length) * 100}%`, transition: "width 0.3s" }} />
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--text-dim)" }}>{reacted}/{session.items.length}</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {session.items.map((it, idx) => {
            const r = reactions[idx];
            const isActive = idx === current;
            const borderColor = r === "like" ? "var(--leaf)" : r === "dislike" ? "var(--clay)" : r === "skip" ? "var(--border-hi)" : "transparent";
            return (
              <div
                key={it.id}
                onClick={() => setCurrent(idx)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "9px",
                  padding: "9px 16px", cursor: "pointer",
                  borderLeft: `2px solid ${isActive ? "var(--oak)" : borderColor}`,
                  background: isActive ? "var(--bg-subtle)" : "transparent",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-subtle)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)", minWidth: "14px", marginTop: "1px" }}>{idx + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--oak)", marginBottom: "2px" }}>{it.type}</p>
                  <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", lineHeight: 1.3, marginBottom: "2px" }}>{it.title}</p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--text-dim)" }}>{it.duration}{r ? ` · ${reactionIcon(r)}` : ""}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save session */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <button
            onClick={() => setSaved(!saved)}
            style={{
              width: "100%", padding: "8px", border: `1px solid ${saved ? "var(--oak-bdr)" : "var(--border)"}`,
              background: saved ? "var(--oak-bg)" : "transparent",
              color: saved ? "var(--oak)" : "var(--text-dim)",
              fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em",
              textTransform: "uppercase", cursor: "pointer", transition: "all 0.12s",
            }}
          >
            {saved ? "✓ Session saved" : "Save session"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sessions list page ────────────────────────────────────────────────────────

export default function SessionsPage() {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load saved session IDs from Supabase in production
    // For now we use local state
  }, []);

  if (activeSession) {
    return (
      <div style={{ display: "flex", flex: 1, height: "100vh", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{
          position: "fixed", top: 0, left: "220px", right: 0, height: "52px", zIndex: 100,
          background: "var(--bg-card)", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: "16px", padding: "0 24px",
        }}>
          <button
            onClick={() => setActiveSession(null)}
            style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer" }}
          >
            ← Sessions
          </button>
          <span style={{ width: "1px", height: "18px", background: "var(--border)" }} />
          <span style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 600, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {activeSession.title}
          </span>
        </div>

        {/* Player */}
        <div style={{ flex: 1, display: "flex", marginTop: "52px", height: "calc(100vh - 52px)" }}>
          <SessionPlayer session={activeSession} onClose={() => setActiveSession(null)} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "48px 56px 80px", maxWidth: "980px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <p className="eyebrow">Module — Sessions</p>
        <h1 style={{ fontSize: "26px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: "8px" }}>Sessions</h1>
        <p style={{ fontSize: "14px", color: "var(--text-mid)", lineHeight: 1.65, maxWidth: "480px" }}>
          Focused learning playlists — AI-assembled from your history, curated by topic, or built from scratch. React to items as you go, save what you want to return to.
        </p>
      </div>

      {/* Curated sessions */}
      <div style={{ marginBottom: "44px" }}>
        <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          Curated playlists
          <span style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)" }}>
          {CURATED_SESSIONS.map(session => (
            <div
              key={session.id}
              style={{ background: "var(--bg-card)", padding: "22px 24px", cursor: "pointer", position: "relative", transition: "background 0.12s" }}
              onClick={() => setActiveSession(session)}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-card)")}
            >
              <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "3px", background: "var(--concrete-seam)", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--oak)")}
              />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "24px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-dim)" }}>
                      Curated · {session.duration} · {session.item_count} items
                    </span>
                  </div>
                  <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)", lineHeight: 1.3, marginBottom: "6px" }}>{session.title}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-mid)", lineHeight: 1.6 }}>{session.description}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
                    {session.items.slice(0, 3).map(item => (
                      <span key={item.id} style={{ fontFamily: "var(--font-mono)", fontSize: "8px", padding: "2px 7px", border: "1px solid var(--border)", color: "var(--text-dim)", background: "var(--bg-subtle)" }}>
                        {item.type} · {item.duration}
                      </span>
                    ))}
                    {session.items.length > 3 && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--text-dim)" }}>+{session.items.length - 3} more</span>
                    )}
                  </div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--oak)", flexShrink: 0 }}>
                  Start →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Build your own */}
      <div>
        <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          Build your own
          <span style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-mid)", marginBottom: "14px" }}>
          Tell the AI what you want to learn and how much time you have — it will assemble a focused session from the resource library.
        </p>
        <Link
          href="/"
          style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--oak)", textDecoration: "none" }}
        >
          Use the session generator on the dashboard →
        </Link>
      </div>
    </div>
  );
}
