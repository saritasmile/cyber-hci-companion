"use client";

import { useState, useEffect, useCallback } from "react";

// ── Saved briefings (localStorage) ───────────────────────────────────────────

interface SavedBriefing {
  id: string;
  savedAt: string;
  briefing: {
    title?: string;
    paragraphs?: string[];
    stats?: { value: string; label: string }[];
    generated_at?: string;
  };
}

const STORAGE_KEY = "industry-intel-saved-briefings";

function loadSaved(): SavedBriefing[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch { return []; }
}

function persistSaved(items: SavedBriefing[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ── Vendor data ──────────────────────────────────────────────────────────────

interface Vendor {
  name: string;
  tag: "incumbent" | "startup" | "emerging";
  desc: string;
  meta: string[];
  hciRelevance: number; // 1-5
  url: string;
  location: string;
}

const incumbents: Vendor[] = [
  { name: "Cisco / Splunk", tag: "incumbent", desc: "Splunk ES 8.2 with agentic AI assistants, SOAR, UEBA bundled into Premier Edition. Massive data gravity — AI agents run in-app within Splunk dashboards.", meta: ["SIEM + SOAR", "Acq. 2024"], hciRelevance: 3, url: "https://www.splunk.com/en_us/products/enterprise-security.html", location: "San Jose, CA" },
  { name: "Palo Alto / Cortex", tag: "incumbent", desc: "Cortex AgentiX: full-stack autonomous investigations with agentic AI across firewall, endpoint, and cloud telemetry. Deep Palo Alto ecosystem integration.", meta: ["XDR + SIEM", "Enterprise"], hciRelevance: 4, url: "https://www.paloaltonetworks.com/cortex", location: "Santa Clara, CA" },
  { name: "CrowdStrike / Charlotte AI", tag: "incumbent", desc: "Charlotte AI embedded in Falcon platform. Exceptional endpoint telemetry quality. Expanding into cross-domain investigation across identity and cloud.", meta: ["EDR/XDR", "Market leader"], hciRelevance: 2, url: "https://www.crowdstrike.com/platform/charlotte-ai/", location: "Austin, TX" },
  { name: "Google SecOps / Gemini", tag: "incumbent", desc: "Natural language querying via Gemini lowers barrier for less experienced analysts. Strong at data retrieval but acts more as a research layer than autonomous responder.", meta: ["SIEM + SOAR", "Cloud-native"], hciRelevance: 3, url: "https://cloud.google.com/security/products/security-operations", location: "Mountain View, CA" },
  { name: "Microsoft Sentinel", tag: "incumbent", desc: "Cloud SIEM with Copilot for Security integration. Strong in Microsoft-heavy environments. Dominant in large enterprise deployments alongside Defender suite.", meta: ["SIEM", "Azure ecosystem"], hciRelevance: 2, url: "https://azure.microsoft.com/en-us/products/microsoft-sentinel", location: "Redmond, WA" },
  { name: "IBM QRadar", tag: "incumbent", desc: "Watson AI provides contextual insights with strong compliance and audit capabilities. Interface feels dated. Slower innovation than cloud-native competitors.", meta: ["SIEM", "On-prem option"], hciRelevance: 1, url: "https://www.ibm.com/qradar", location: "Armonk, NY" },
];

const startups: Vendor[] = [
  { name: "Dropzone AI", tag: "startup", desc: "Autonomous Tier 1 investigation without playbooks. Deploys in 30 min via API. Patented LLM system pre-trained on expert investigative techniques. 300+ deployments.", meta: ["AI SOC Analyst", "$16.8M Series A"], hciRelevance: 5, url: "https://www.dropzone.ai", location: "Seattle, WA" },
  { name: "Radiant Security", tag: "startup", desc: "Unbounded alert coverage across entire security stack including complex multi-signal attacks. Positions as the intelligent layer between tools and team.", meta: ["AI SOC Platform", "Full-stack triage"], hciRelevance: 4, url: "https://radiantsecurity.ai", location: "San Francisco, CA" },
  { name: "Prophet Security", tag: "startup", desc: "AI analyst that learns from human feedback over time. Dynamic investigation planning without static playbooks. Customers include Docker. Vendor-agnostic.", meta: ["AI SOC Analyst", "Human-on-the-loop"], hciRelevance: 5, url: "https://www.prophetsecurity.ai", location: "San Francisco, CA" },
  { name: "7AI", tag: "emerging", desc: "Founded by former Cybereason execs. Uses \"swarming\" AI agents across multiple investigation steps. Partnership with DXC Technology. Still building enterprise track record.", meta: ["Multi-agent", "Early stage"], hciRelevance: 3, url: "https://www.7ai.com", location: "Boston, MA" },
  { name: "Torq", tag: "startup", desc: "Hyperautomation engine with AI agent \"Socrates\" for Tier 1 triage. No/low-code workflow builder. Won Innovation Sandbox at CPX 2025. Automation-first with AI layered on.", meta: ["SOAR + AI", "Workflow-heavy"], hciRelevance: 3, url: "https://torq.io", location: "Tel Aviv, Israel" },
  { name: "Stellar Cyber", tag: "startup", desc: "Unified SecOps with AI-generated case summaries that explain \"what happened, why it matters, and what evidence supports it.\" Aimed at lean teams and MSSPs.", meta: ["Open XDR", "v6.3 (2026)"], hciRelevance: 4, url: "https://stellarcyber.ai", location: "Santa Clara, CA" },
  { name: "Conifers.ai", tag: "emerging", desc: "Mesh agentic AI architecture with pre-trained, task-specific agents. CognitiveSOC™ manages full incident lifecycle with staged rollout for scaling autonomy.", meta: ["Multi-agent mesh", "Newer entrant"], hciRelevance: 4, url: "https://conifers.ai", location: "San Francisco, CA" },
];

// ── Pain points ──────────────────────────────────────────────────────────────

interface PainPoint {
  severity: "critical" | "high" | "moderate";
  title: string;
  body: string;
  hciAngle: string;
}

const painPoints: PainPoint[] = [
  { severity: "critical", title: "Alert Fatigue & Overload", body: "Enterprise SOCs receive 10,000+ alerts daily. 40% are never investigated. 31.9% of analysts admit to ignoring alerts due to false positive rates. 61% of teams have ignored alerts that later proved critical. The psychological toll mirrors alarm fatigue in healthcare — brains filter out constant stimulation as background noise.", hciAngle: "Signal-to-noise visualization, progressive disclosure of alert severity, attention management design patterns, cognitive load reduction in triage interfaces." },
  { severity: "critical", title: "Analyst Burnout & Turnover", body: "70% of SOC analysts report severe burnout symptoms. 65% consider job changes within a year. 70% of junior analysts leave within three years. When analysts leave, organizations lose institutional knowledge, recruiting investment, and training — while remaining staff face even more pressure.", hciAngle: "Workload visualization for managers, satisfaction and burnout tracking, workflow design that preserves meaningful work, onboarding UX for high-turnover environments." },
  { severity: "high", title: "Tool Sprawl & Context Switching", body: "The average organization deploys 28 security monitoring tools, each with its own alert stream, interface, and mental model. Analysts constantly context-switch between consoles — SIEM, EDR, SOAR, email, ticketing — losing investigation context at every jump.", hciAngle: "Unified investigation workspaces, cross-tool context persistence, reduced mode errors from interface inconsistency, cognitive continuity in multi-tool workflows." },
  { severity: "high", title: "AI Trust Calibration", body: "As AI agents take on more autonomous investigation, analysts face a new problem: when should they trust the AI's verdict, and when should they override it? Over-trust leads to missed threats; under-trust negates the efficiency gains. Most tools offer little visibility into AI confidence levels or reasoning chains.", hciAngle: "Confidence visualization, explainable AI interfaces, calibrated trust through progressive autonomy, \"human-on-the-loop\" interaction design patterns." },
  { severity: "moderate", title: "Shift Handoff & Knowledge Loss", body: "79% of 24/7 SOCs experience peak alert fatigue during shift transitions when context is lost between teams. Investigations span shifts — the analyst who started a complex case may not be the one who finishes it. Institutional knowledge walks out the door with every departure.", hciAngle: "Async investigation state design, shift-change briefing UX, investigation narrative generation, persistent context that survives team transitions." },
  { severity: "moderate", title: "No Time for Strategic Work", body: "Most analysts are trapped in reactive mode — triaging alerts all day with no bandwidth for threat hunting, vulnerability management, or professional development. The reactive-only posture leaves organizations blind to sophisticated attacks that need proactive detection.", hciAngle: "Time allocation dashboards, \"strategic time\" tracking, workflow design that creates proactive space, learning integration into analyst workflows." },
];

// ── Design gaps ──────────────────────────────────────────────────────────────

interface DesignGap {
  title: string;
  body: string;
  vendors: string;
}

const designGaps: DesignGap[] = [
  { title: "Explainability Theater", body: "Most AI SOC tools claim \"explainable AI\" but deliver text-wall investigation reports. The reasoning chain is dumped as prose rather than designed for scanability. Analysts need to quickly assess confidence, identify what evidence supports a conclusion, and spot what the AI didn't look at.", vendors: "Partially addressed by: Prophet Security, Dropzone AI" },
  { title: "Human–AI Handoff Friction", body: "The transition point between \"AI handled it\" and \"human needs to take over\" is poorly designed. When an AI escalates, the analyst gets a summary but not the investigative momentum. Context about what was tried, what was ruled out, and what remains uncertain is often missing or buried.", vendors: "Emerging approach: Conifers.ai staged rollout model" },
  { title: "Demo-Driven Dashboards", body: "Interfaces are designed to impress buyers in 30-minute demos rather than support analysts through 8-hour shifts. What looks stunning in a sales deck becomes overwhelming when it's your all-day workspace. Information density, visual hierarchy, and workflow optimization are afterthoughts.", vendors: "Industry-wide problem — no vendor has solved this well" },
  { title: "Feedback Loop Blindness", body: "When analysts correct AI verdicts or add context, that feedback should make the system smarter. But most platforms offer no visibility into whether feedback was incorporated or how it changed future behavior. The \"human-on-the-loop\" promise rings hollow without closing the loop.", vendors: "Strongest effort: Prophet Security (adaptive learning)" },
  { title: "NOC/SOC Convergence Gap", body: "Network operations and security operations increasingly overlap but the tools remain siloed. A network anomaly might be a security incident; a security incident might cause network degradation. Analysts working across both domains face completely separate interfaces and mental models.", vendors: "Partially addressed by: Stellar Cyber (unified data lake)" },
  { title: "Onboarding & Skill Ceiling", body: "With 70% junior analyst turnover in 3 years, every tool needs to support rapid onboarding. But most security platforms assume deep domain expertise. The gap between \"can navigate the interface\" and \"can effectively investigate threats\" remains a design failure, not just a training one.", vendors: "Partial: Google SecOps natural language lowers barrier" },
];

// ── Tag styling ──────────────────────────────────────────────────────────────

const TAG_STYLES: Record<string, { color: string; bg: string }> = {
  incumbent: { color: "var(--text-dim)", bg: "var(--bg-subtle)" },
  startup:   { color: "var(--pool)",     bg: "var(--pool-bg)" },
  emerging:  { color: "var(--leaf)",     bg: "var(--leaf-bg)" },
};

const SEVERITY_STYLES: Record<string, { color: string; bg: string; letter: string }> = {
  critical: { color: "var(--clay)",     bg: "var(--clay-bg)", letter: "C" },
  high:     { color: "var(--oak)",      bg: "var(--oak-bg)",  letter: "H" },
  moderate: { color: "var(--pool)",     bg: "var(--pool-bg)", letter: "M" },
};

// ── Sub-components ───────────────────────────────────────────────────────────

function HciDots({ count }: { count: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "8px", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-xdim)", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: "4px" }}>HCI relevance</span>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ width: "8px", height: "8px", background: n <= count ? "var(--oak)" : "var(--bg-subtle)" }} />
      ))}
    </div>
  );
}

function VendorCard({ v }: { v: Vendor }) {
  const tag = TAG_STYLES[v.tag] ?? TAG_STYLES.startup;
  return (
    <a
      href={v.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "8px", cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s", textDecoration: "none", color: "inherit" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--oak-bdr)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>{v.name}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 500, padding: "3px 8px", letterSpacing: "0.04em", textTransform: "uppercase", background: tag.bg, color: tag.color, flexShrink: 0 }}>{v.tag}</span>
      </div>
      <p style={{ fontSize: "13px", color: "var(--text-mid)", lineHeight: 1.55 }}>{v.desc}</p>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        {v.meta.map((m, i) => (
          <span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)" }}>
            {i > 0 && "· "}{m}
          </span>
        ))}
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)", marginLeft: "auto" }}>
          ◎ {v.location}
        </span>
      </div>
      <HciDots count={v.hciRelevance} />
    </a>
  );
}

function PainPointCard({ p }: { p: PainPoint }) {
  const sev = SEVERITY_STYLES[p.severity];
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "22px 24px", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "18px", alignItems: "start", transition: "box-shadow 0.15s", cursor: "pointer" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600, background: sev.bg, color: sev.color, flexShrink: 0 }}>
        {sev.letter}
      </div>
      <div>
        <h5 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>{p.title}</h5>
        <p style={{ fontSize: "13.5px", color: "var(--text-mid)", lineHeight: 1.6 }}>{p.body}</p>
      </div>
      <div style={{ background: "var(--oak-bg)", padding: "10px 14px", maxWidth: "240px", flexShrink: 0 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--oak)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>HCI Opportunity</p>
        <p style={{ fontSize: "12.5px", color: "var(--text-mid)", lineHeight: 1.5 }}>{p.hciAngle}</p>
      </div>
    </div>
  );
}

function GapCard({ g }: { g: DesignGap }) {
  return (
    <div
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "22px 24px", cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--oak-bdr)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <h5 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ width: "20px", height: "20px", background: "var(--leaf-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", flexShrink: 0 }}>◇</span>
        {g.title}
      </h5>
      <p style={{ fontSize: "13.5px", color: "var(--text-mid)", lineHeight: 1.6, marginBottom: "10px" }}>{g.body}</p>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)" }}>{g.vendors}</p>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function IndustryIntelPage() {
  const [activeTab, setActiveTab] = useState<"landscape" | "pain-points" | "design-gaps">("landscape");
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [savedBriefings, setSavedBriefings] = useState<SavedBriefing[]>([]);
  const [viewingSaved, setViewingSaved] = useState<SavedBriefing | null>(null);
  const [briefingData, setBriefingData] = useState<{
    title?: string;
    paragraphs?: string[];
    stats?: { value: string; label: string }[];
  } | null>(null);

  // Load cached briefing and saved briefings on mount
  useEffect(() => {
    fetch("/api/intel-briefing")
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data && !data.error) setBriefingData(data); })
      .catch(() => {});
    setSavedBriefings(loadSaved());
  }, []);

  const refreshBriefing = useCallback(async () => {
    setBriefingLoading(true);
    setViewingSaved(null);
    try {
      const res = await fetch("/api/intel-briefing", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setBriefingData(data);
      }
    } catch { /* fail silently */ } finally {
      setBriefingLoading(false);
    }
  }, []);

  const saveBriefing = useCallback(() => {
    const active = briefingData;
    if (!active) return;
    const entry: SavedBriefing = {
      id: Date.now().toString(),
      savedAt: new Date().toISOString(),
      briefing: active,
    };
    const updated = [entry, ...savedBriefings];
    setSavedBriefings(updated);
    persistSaved(updated);
    setShowSaved(true);
  }, [briefingData, savedBriefings]);

  const deleteSaved = useCallback((id: string) => {
    const updated = savedBriefings.filter(b => b.id !== id);
    setSavedBriefings(updated);
    persistSaved(updated);
    if (viewingSaved?.id === id) setViewingSaved(null);
  }, [savedBriefings, viewingSaved]);

  const activeBriefing = viewingSaved ? viewingSaved.briefing : briefingData;

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: "landscape",    label: "Vendor Landscape" },
    { id: "pain-points",  label: "Analyst Pain Points" },
    { id: "design-gaps",  label: "Design Gaps" },
  ];

  return (
    <div style={{ padding: "48px 56px 80px", maxWidth: "980px" }}>

      {/* Header */}
      <div style={{ marginBottom: "40px", paddingBottom: "22px", borderBottom: "1px solid var(--border)" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "10px" }}>
          Discover — Industry Intelligence
        </p>
        <h1 style={{ fontSize: "26px", fontWeight: 500, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: "10px" }}>
          Industry Intelligence
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-mid)", lineHeight: 1.7, maxWidth: "640px" }}>
          The cybersecurity operations landscape through an HCI lens — who's building what, what analysts are struggling with, and where the design opportunities are.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px" }}>
          <span style={{ width: "6px", height: "6px", background: "var(--leaf)" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)" }}>Briefing current as of March 2026</span>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "var(--border)", border: "1px solid var(--border)", marginBottom: "32px" }}>
        {(activeBriefing?.stats ?? [
          { value: "100+", label: "AI SOC vendors" },
          { value: "~90%", label: "SOCs overwhelmed by backlogs" },
          { value: "28",   label: "avg. tools per SOC" },
          { value: "70%",  label: "junior analysts leave in 3 yrs" },
        ]).map(s => (
          <div key={s.label} style={{ background: "var(--bg-card)", padding: "18px 20px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 500, color: "var(--text)", letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "var(--text-xdim)", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Briefing card */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "32px", marginBottom: "16px", position: "relative", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "3px", height: "100%", background: viewingSaved ? "var(--pool)" : "var(--oak)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 500, color: viewingSaved ? "var(--pool)" : "var(--oak)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {viewingSaved ? "Saved Briefing" : "Landscape Briefing"}
          </p>
          {viewingSaved && (
            <>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)" }}>
                {new Date(viewingSaved.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <button
                onClick={() => setViewingSaved(null)}
                style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                ← Back to current
              </button>
            </>
          )}
        </div>
        <h3 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text)", marginBottom: "16px" }}>
          {activeBriefing?.title ?? "What's happening in cybersecurity operations right now"}
        </h3>
        <div style={{ fontSize: "14.5px", lineHeight: 1.75, color: "var(--text-mid)" }}>
          {activeBriefing?.paragraphs ? (
            activeBriefing.paragraphs.map((p, i) => (
              <p key={i} style={{ marginBottom: i < activeBriefing.paragraphs!.length - 1 ? "14px" : 0 }}>{p}</p>
            ))
          ) : (
            <>
          <p style={{ marginBottom: "14px" }}>
            The biggest shift in security operations right now is <strong style={{ color: "var(--text)", fontWeight: 600 }}>agentic AI</strong> — AI systems that don't just summarize alerts but actively investigate, correlate evidence, and recommend or take response actions. Every major vendor and a growing army of startups are racing to build "AI SOC analysts" that replicate what Tier 1 and Tier 2 human analysts do.
          </p>
          <p style={{ marginBottom: "14px" }}>
            On the incumbent side, <strong style={{ color: "var(--text)", fontWeight: 600 }}>Cisco/Splunk</strong> just announced Splunk Enterprise Security 8.2 with two AI-powered tiers — an Essentials Edition and a Premier Edition that bundles SOAR, UEBA, and an AI assistant into a unified workspace. <strong style={{ color: "var(--text)", fontWeight: 600 }}>Palo Alto Networks</strong> launched Cortex AgentiX, extending its XSIAM platform with autonomous agents. <strong style={{ color: "var(--text)", fontWeight: 600 }}>CrowdStrike</strong> continues expanding Charlotte AI across endpoint, identity, and cloud. These are all big companies adding AI layers on top of existing platforms.
          </p>
          <p style={{ marginBottom: "14px" }}>
            The startup side is where it gets more interesting from a design perspective. Companies like <strong style={{ color: "var(--text)", fontWeight: 600 }}>Dropzone AI</strong>, <strong style={{ color: "var(--text)", fontWeight: 600 }}>Radiant Security</strong>, <strong style={{ color: "var(--text)", fontWeight: 600 }}>Prophet Security</strong>, <strong style={{ color: "var(--text)", fontWeight: 600 }}>7AI</strong>, and <strong style={{ color: "var(--text)", fontWeight: 600 }}>Torq</strong> are building AI-native — meaning the AI isn't bolted on, it's the core product. Dropzone claims <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--pool)", background: "var(--pool-bg)", padding: "2px 7px" }}>300+ deployments</span> and says it can replicate Tier 1 analyst work end-to-end without playbooks.
          </p>
          <p style={{ marginBottom: "14px" }}>
            But here's the part that matters most from an HCI standpoint: <strong style={{ color: "var(--text)", fontWeight: 600 }}>the human problems haven't been solved.</strong> Nearly <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--pool)", background: "var(--pool-bg)", padding: "2px 7px" }}>90% of SOCs</span> are overwhelmed by backlogs and false positives. The average enterprise gets <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--pool)", background: "var(--pool-bg)", padding: "2px 7px" }}>10,000+ alerts/day</span>. And the human cost is brutal — 70% of SOC analysts with five years or less experience leave within three years.
          </p>
          <p>
            The core design challenge? These tools are automating <em>analyst tasks</em> without deeply rethinking <em>analyst workflows</em>. Explainability is still weak, context handoff between AI and human is clunky, trust calibration is under-explored, and the interfaces themselves often prioritize demo-ability over daily usability. This is where HCI has the most to contribute.
          </p>
            </>
          )}
        </div>
        <div style={{ marginTop: "20px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {!viewingSaved && (
            <button className="btn btn-primary" onClick={refreshBriefing} disabled={briefingLoading}>
              {briefingLoading ? "Generating…" : "↻ Refresh Briefing"}
            </button>
          )}
          <button
            className="btn btn-outline"
            onClick={saveBriefing}
            disabled={!activeBriefing}
            title="Save this briefing to your library"
          >
            ✦ Save Briefing
          </button>
          <button className="btn btn-outline" onClick={() => window.print()}>Save as PDF</button>
          <button className="btn btn-outline" onClick={() => setShowSources(s => !s)}>
            {showSources ? "Hide Sources" : "View Sources"}
          </button>
        </div>
        {showSources && (
          <div style={{ marginTop: "20px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-xdim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Sources</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[...incumbents, ...startups].map(v => (
                <a key={v.name} href={v.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: "13px", color: "var(--pool)", display: "flex", gap: "10px", alignItems: "baseline", textDecoration: "none" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none"; }}
                >
                  <span style={{ fontWeight: 600, color: "var(--text)", minWidth: "160px", flexShrink: 0 }}>{v.name}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-xdim)", wordBreak: "break-all" }}>{v.url}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Saved briefings panel */}
      {savedBriefings.length > 0 && (
        <div style={{ marginBottom: "36px", border: "1px solid var(--border)" }}>
          <button
            onClick={() => setShowSaved(s => !s)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "var(--bg-subtle)", border: "none", cursor: "pointer", textAlign: "left" }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 500, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Saved Briefings ({savedBriefings.length})
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-xdim)" }}>{showSaved ? "▴" : "▾"}</span>
          </button>
          {showSaved && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)" }}>
              {savedBriefings.map(saved => (
                <div
                  key={saved.id}
                  style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 20px", background: viewingSaved?.id === saved.id ? "var(--pool-bg)" : "var(--bg-card)", cursor: "pointer" }}
                  onClick={() => { setViewingSaved(viewingSaved?.id === saved.id ? null : saved); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                >
                  <span style={{ width: "6px", height: "6px", background: viewingSaved?.id === saved.id ? "var(--pool)" : "var(--border)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {saved.briefing.title ?? "Landscape Briefing"}
                    </p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)", marginTop: "2px" }}>
                      {new Date(saved.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteSaved(saved.id); }}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-xdim)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px", flexShrink: 0 }}
                    title="Delete saved briefing"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="tab-row" style={{ marginBottom: "28px" }}>
        {tabs.map(tab => (
          <button key={tab.id} className={`tab-item ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Vendor Landscape */}
      {activeTab === "landscape" && (
        <div>
          {/* Incumbents */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>Incumbents Adding AI</h4>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)", background: "var(--bg-subtle)", padding: "2px 8px" }}>{incumbents.length} tracked</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
              {incumbents.map(v => <VendorCard key={v.name} v={v} />)}
            </div>
          </div>
          {/* Startups */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>AI-Native Startups</h4>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)", background: "var(--bg-subtle)", padding: "2px 8px" }}>{startups.length} tracked</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
              {startups.map(v => <VendorCard key={v.name} v={v} />)}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Pain Points */}
      {activeTab === "pain-points" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {painPoints.map(p => <PainPointCard key={p.title} p={p} />)}
        </div>
      )}

      {/* Tab: Design Gaps */}
      {activeTab === "design-gaps" && (
        <div>
          <p style={{ fontSize: "14.5px", color: "var(--text-mid)", marginBottom: "24px", maxWidth: "620px", lineHeight: 1.7 }}>
            These are areas where current cybersecurity tools fall short from a design and human factors perspective — the spaces where HCI thinking could make the biggest difference.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {designGaps.map(g => <GapCard key={g.title} g={g} />)}
          </div>
        </div>
      )}
    </div>
  );
}
