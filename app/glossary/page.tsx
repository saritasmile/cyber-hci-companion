"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GlossaryTerm {
  id: string;
  term: string;
  pronunciation: string;
  definition: string;
  hci: string;
  related: string[];
  sources: string[];         // scenario slugs where this was encountered
  savedAt?: string;
  gotIt?: boolean;
}

// ── Static seed terms ─────────────────────────────────────────────────────────
// In production these come from Supabase (terms saved via inline glossary),
// with AI-generated definitions. This seed covers terms from existing scenarios.

const SEED_TERMS: GlossaryTerm[] = [
  {
    id: "ransomware",
    term: "Ransomware",
    pronunciation: "[RAN-sum-wair]",
    definition: "Malicious software that encrypts your files and holds them hostage until you pay. The attacker locks you out of your own data and demands payment — usually in cryptocurrency — to give you the key back.",
    hci: "Ransomware attacks expose the gap between IT and operations teams. The decision to pay or not pay is almost always made under extreme time pressure with incomplete information — designing better crisis decision-support interfaces is an open UX research problem.",
    related: ["malware", "incident response", "ransom", "DarkSide"],
    sources: ["colonial-pipeline", "moveit"],
  },
  {
    id: "lateral-movement",
    term: "Lateral Movement",
    pronunciation: "[LAT-er-ul MOOV-ment]",
    definition: "Once an attacker is inside a network, they move sideways — from one system to another — looking for higher-value targets. Like a burglar who's in your hallway quietly checking which rooms are unlocked.",
    hci: "Lateral movement is often invisible on standard dashboards. SOC analysts may see individual alerts but fail to connect them into a pattern — a classic case of how fragmented interfaces contribute to missed detections.",
    related: ["privilege escalation", "IOC", "threat hunting", "SIEM"],
    sources: ["colonial-pipeline", "solarwinds-sunburst"],
  },
  {
    id: "mfa",
    term: "MFA — Multi-Factor Authentication",
    pronunciation: "[em-ef-ay]",
    definition: "Requiring more than just a password to log in — like a code sent to your phone or a fingerprint scan. Even if someone steals your password, they still can't get in without the second factor.",
    hci: "MFA is a rare case where adding friction is intentional. But poor MFA UX — confusing prompts, push notification floods, no context — can undermine the entire security model. The Uber 2022 attack showed exactly how attacker-exploitable bad MFA UX can be.",
    related: ["MFA fatigue", "authentication", "push notification", "social engineering"],
    sources: ["uber-2022", "colonial-pipeline"],
  },
  {
    id: "ioc",
    term: "IOC — Indicator of Compromise",
    pronunciation: "[eye-oh-see]",
    definition: "A piece of evidence that suggests a system has been breached — like a suspicious file, an unusual network connection, or a known malicious IP address showing up in logs.",
    hci: "IOCs are surfaced through SIEM dashboards, but a high-volume alert environment causes analysts to become desensitized. Designing interfaces that make IOCs feel urgent and actionable — not just another row in a table — is a core security UX problem.",
    related: ["SIEM", "threat intel", "alert fatigue", "forensics"],
    sources: ["colonial-pipeline", "solarwinds-sunburst"],
  },
  {
    id: "threat-actor",
    term: "Threat Actor",
    pronunciation: "[THRET AK-ter]",
    definition: "Anyone who deliberately causes harm to a computer system or network — from a lone hacker to a criminal gang to a nation-state intelligence service. The term is neutral about who or why; it just means the entity doing the attacking.",
    hci: "Understanding who the threat actor is shapes the entire response interface. A nation-state actor and a ransomware gang have very different goals — and the decision trees presented to incident commanders should reflect that context.",
    related: ["APT", "TTPs", "attribution", "nation-state"],
    sources: ["salt-typhoon", "colonial-pipeline"],
  },
  {
    id: "incident-response",
    term: "Incident Response",
    pronunciation: "[IN-sih-dent rih-SPONS]",
    definition: "The structured process an organization follows when something goes wrong — detecting the breach, containing the damage, removing the threat, and getting back to normal. Often abbreviated IR.",
    hci: "Incident response is where security and human factors collide most visibly. Responders work under extreme time pressure with incomplete information, across multiple tools that don't talk to each other. The UX of crisis coordination is one of the most underresearched areas in security.",
    related: ["playbook", "CISO", "containment", "forensics"],
    sources: ["colonial-pipeline"],
  },
  {
    id: "supply-chain-attack",
    term: "Supply Chain Attack",
    pronunciation: "[suh-PLY chayn uh-TAK]",
    definition: "An attack that targets a third-party vendor or software provider to reach a more valuable final target. Rather than attacking Company A directly, attackers compromise the software Company A trusts and uses — so the malware arrives as a trusted update.",
    hci: "Supply chain attacks exploit the trust signals built into software update interfaces. Users are conditioned to trust and install updates — designing interfaces that surface trust chain provenance without overwhelming users is an unsolved UX challenge.",
    related: ["SolarWinds", "SUNBURST", "software integrity", "trust chain"],
    sources: ["solarwinds-sunburst", "moveit"],
  },
  {
    id: "mfa-fatigue",
    term: "MFA Fatigue",
    pronunciation: "[em-ef-ay fuh-TEEG]",
    definition: "An attack technique where the attacker floods a target with MFA approval requests until the person accidentally or frustratedly taps 'approve'. Also describes the general phenomenon of users disabling or bypassing MFA after being overwhelmed by prompts.",
    hci: "MFA fatigue is one of the clearest examples of a security control undermined by bad UX. The push notification interface provides no context — is this a real request? From me? Right now? Fixing this is a design problem as much as a security one.",
    related: ["MFA", "push notification", "social engineering", "Uber 2022"],
    sources: ["uber-2022"],
  },
];

// ── Term row — accordion ──────────────────────────────────────────────────────

function TermRow({
  term,
  gotIt,
  onToggleGotIt,
  onRelatedClick,
}: {
  term: GlossaryTerm;
  gotIt: boolean;
  onToggleGotIt: (id: string) => void;
  onRelatedClick: (related: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        border: `1px solid ${open ? "var(--pool-bdr)" : "var(--border)"}`,
        marginBottom: "6px",
        opacity: gotIt && !open ? 0.45 : 1,
        transition: "opacity 0.15s, border-color 0.15s",
        boxShadow: open ? "0 2px 10px rgba(0,0,0,0.06)" : "none",
      }}
    >
      {/* Summary row */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "12px 16px", cursor: "pointer",
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget.querySelector(".term-name") as HTMLElement)!.style.color = "var(--pool)"; }}
        onMouseLeave={e => { if (!open) (e.currentTarget.querySelector(".term-name") as HTMLElement)!.style.color = "var(--text)"; }}
      >
        <span
          className="term-name"
          style={{ flex: 1, fontSize: "14px", fontWeight: 500, color: open ? "var(--pool)" : "var(--text)", transition: "color 0.12s" }}
        >
          {term.term}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)", flexShrink: 0 }}>
          {term.pronunciation}
        </span>
        {gotIt && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--leaf)", flexShrink: 0 }}>✓</span>
        )}
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: "13px", color: open ? "var(--pool)" : "var(--text-dim)",
          flexShrink: 0, display: "inline-block",
          transition: "transform 0.18s, color 0.12s",
          transform: open ? "rotate(90deg)" : "rotate(0deg)",
        }}>›</span>
      </div>

      {/* Expanded body */}
      {open && (
        <div style={{ padding: "0 16px 18px", borderTop: "1px solid var(--border)" }}>

          {/* Definition */}
          <div style={{ marginTop: "14px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "5px" }}>Plain English</p>
            <p style={{ fontSize: "13px", color: "var(--text-mid)", lineHeight: 1.7 }}>{term.definition}</p>
          </div>

          {/* HCI */}
          <div style={{ marginTop: "14px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "5px" }}>Why it matters for HCI / UX</p>
            <div style={{ fontSize: "12px", color: "var(--text-mid)", lineHeight: 1.65, background: "var(--clay-bg)", borderLeft: "2px solid var(--clay-bdr)", padding: "8px 11px" }}>
              {term.hci}
            </div>
          </div>

          {/* Related */}
          <div style={{ marginTop: "14px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "8px" }}>Related terms</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {term.related.map(r => (
                <button
                  key={r}
                  onClick={() => onRelatedClick(r)}
                  style={{
                    fontFamily: "var(--font-mono)", fontSize: "8px", padding: "2px 7px",
                    border: "1px solid var(--pool-bdr)", background: "var(--pool-bg)",
                    color: "var(--pool)", cursor: "pointer", transition: "border-color 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--pool)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--pool-bdr)")}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              {term.sources.map(s => (
                <span key={s} style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--text-dim)", padding: "1px 6px", border: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                  {s.replace(/-/g, " ")}
                </span>
              ))}
            </div>
            <button
              onClick={() => onToggleGotIt(term.id)}
              style={{
                fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.1em",
                textTransform: "uppercase", padding: "4px 10px",
                border: `1px solid ${gotIt ? "var(--leaf-bdr)" : "var(--border)"}`,
                background: gotIt ? "var(--leaf-bg)" : "transparent",
                color: gotIt ? "var(--leaf)" : "var(--text-dim)",
                cursor: "pointer", transition: "all 0.12s",
              }}
            >
              {gotIt ? "✓ Got it" : "Got it"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Filter = "all" | "learning" | "gotit";

export default function GlossaryPage() {
  const [terms, setTerms] = useState<GlossaryTerm[]>(SEED_TERMS);
  const [gotItIds, setGotItIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // In production: load saved terms + gotIt state from Supabase
  useEffect(() => {
    // supabase.from('glossary_terms').select(...) — not yet implemented
  }, []);

  const toggleGotIt = useCallback((id: string) => {
    setGotItIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleRelatedClick = useCallback((related: string) => {
    setSearch(related);
  }, []);

  const filtered = terms.filter(t => {
    const matchesSearch = !search || t.term.toLowerCase().includes(search.toLowerCase()) || t.definition.toLowerCase().includes(search.toLowerCase()) || t.related.some(r => r.toLowerCase().includes(search.toLowerCase()));
    const gotIt = gotItIds.has(t.id);
    const matchesFilter = filter === "all" || (filter === "gotit" && gotIt) || (filter === "learning" && !gotIt);
    return matchesSearch && matchesFilter;
  });

  // Group by first letter
  const grouped: Record<string, GlossaryTerm[]> = {};
  filtered.forEach(t => {
    const letter = t.term[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(t);
  });

  const completedCount = gotItIds.size;
  const learningCount = terms.length - completedCount;

  const filterBtnStyle = (f: Filter): React.CSSProperties => ({
    fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.1em",
    textTransform: "uppercase", padding: "7px 12px",
    border: `1px solid ${filter === f ? "var(--border-hi)" : "var(--border)"}`,
    background: filter === f ? "var(--bg-subtle)" : "transparent",
    color: filter === f ? "var(--text)" : "var(--text-dim)",
    cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap",
  });

  return (
    <div style={{ padding: "48px 56px 80px", maxWidth: "860px" }}>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <p className="eyebrow">Module — Glossary</p>
        <h1 style={{ fontSize: "26px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: "8px" }}>
          Your Glossary
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-mid)", lineHeight: 1.65, maxWidth: "480px" }}>
          Terms you've encountered while exploring. Written for designers, not analysts — plain English with HCI context baked in. Highlight any term in a scenario to save it here.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
        {[
          { label: "Saved", value: terms.length, color: "var(--pool)" },
          { label: "Got it", value: completedCount, color: "var(--leaf)" },
          { label: "Still learning", value: learningCount, color: "var(--oak)" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "10px 18px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: 700, color: stat.color, marginBottom: "2px" }}>{stat.value}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-dim)" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{
          flex: 1, minWidth: "200px", display: "flex", alignItems: "center", gap: "8px",
          background: "var(--bg-card)", border: "1px solid var(--border)", padding: "8px 12px",
          transition: "border-color 0.12s",
        }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-dim)" }}>⌕</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search terms…"
            style={{ flex: 1, border: "none", background: "transparent", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text)", outline: "none" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ border: "none", background: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "11px" }}>✕</button>
          )}
        </div>
        <button style={filterBtnStyle("all")} onClick={() => setFilter("all")}>All</button>
        <button style={filterBtnStyle("learning")} onClick={() => setFilter("learning")}>Still learning</button>
        <button style={filterBtnStyle("gotit")} onClick={() => setFilter("gotit")}>Got it</button>
      </div>

      {/* Terms */}
      {Object.keys(grouped).sort().map(letter => (
        <div key={letter} style={{ marginBottom: "24px" }}>
          <p style={{
            fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: 700,
            color: "var(--border-hi)", marginBottom: "8px", paddingBottom: "6px",
            borderBottom: "1px solid var(--border)",
          }}>
            {letter}
          </p>
          {grouped[letter].map(term => (
            <TermRow
              key={term.id}
              term={term}
              gotIt={gotItIds.has(term.id)}
              onToggleGotIt={toggleGotIt}
              onRelatedClick={handleRelatedClick}
            />
          ))}
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "var(--text-dim)" }}>
            {search ? `No terms matching "${search}"` : "No terms yet — explore some scenarios and highlight unfamiliar words to save them here."}
          </p>
        </div>
      )}

    </div>
  );
}
