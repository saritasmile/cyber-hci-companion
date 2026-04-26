"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SocExampleListItem {
  slug: string;
  scenario: string;
  title: string;
  subtitle: string;
  cia_category: string;
  tier_flow: string;
}

const CIA_STYLES: Record<string, { color: string; bg: string; bdr: string }> = {
  availability:    { color: "var(--clay)", bg: "var(--clay-bg)", bdr: "var(--clay-bdr)" },
  confidentiality: { color: "var(--pool)", bg: "var(--pool-bg)", bdr: "var(--pool-bdr)" },
  integrity:       { color: "var(--leaf)", bg: "var(--leaf-bg)", bdr: "var(--leaf-bdr)" },
};

const quickPicks = [
  "Brute force login (Confidentiality)",
  "File integrity violation (Integrity)",
  "Phishing email investigation",
  "Lateral movement detection",
  "Ransomware encryption in progress",
  "Cloud misconfiguration (S3 bucket)",
  "Insider threat — unusual data access",
];

export default function SocExamplesPage() {
  const [adhocInput, setAdhocInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedExamples, setGeneratedExamples] = useState<SocExampleListItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/soc-examples")
      .then(res => res.ok ? res.json() : [])
      .then(data => setGeneratedExamples(data))
      .catch(() => {});
  }, [generating]);

  const generateWalkthrough = async (scenario: string) => {
    if (!scenario.trim()) return;
    setGenerating(true);
    const slug = scenario.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    try {
      const res = await fetch(`/api/soc-examples/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      if (res.ok) {
        router.push(`/soc-examples/${slug}`);
      }
    } catch { /* fail silently */ } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ padding: "48px 56px 80px", maxWidth: "960px" }}>

      {/* Breadcrumb */}
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)", marginBottom: "24px", display: "flex", alignItems: "center", gap: "6px" }}>
        <Link href="/industry-intel" style={{ color: "var(--pool)", textDecoration: "none" }}>Industry Intel</Link>
        <span>›</span>
        <span>SOC Examples</span>
      </div>

      {/* Page header */}
      <div style={{ marginBottom: "40px", paddingBottom: "32px", borderBottom: "1px solid var(--border)" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 500, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: "10px" }}>
          SOC Examples
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-mid)", lineHeight: 1.7, maxWidth: "640px" }}>
          Four-layer walkthroughs of real SOC workflows — raw logs, SIEM alert, analyst response, and SOAR automation. Browse the pre-built example or generate your own.
        </p>
      </div>

      {/* Pre-populated example */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-xdim)", marginBottom: "10px" }}>Pre-populated</div>
        <Link
          href="/soc-examples/ddos-attack-public-web-application"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "20px 22px", display: "flex", alignItems: "center", gap: "14px", textDecoration: "none", color: "inherit", transition: "border-color 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--oak-bdr)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "2px 7px", border: "1px solid var(--clay-bdr)", color: "var(--clay)", background: "var(--clay-bg)", flexShrink: 0 }}>
            Availability
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)" }}>DDoS Attack on Public-Facing Web Application</div>
            <div style={{ fontSize: "12px", color: "var(--text-xdim)", marginTop: "2px" }}>HTTP flood on an e-commerce site — logs, SIEM alert, analyst workflow, and SOAR playbook</div>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)", flexShrink: 0 }}>Tier 1 → Tier 2</span>
          <span style={{ color: "var(--text-dim)", fontSize: "14px", flexShrink: 0 }}>→</span>
        </Link>
      </div>

      {/* Generator */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "28px", marginBottom: "40px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Generate a walkthrough</h3>
        <p style={{ fontSize: "13.5px", color: "var(--text-mid)", marginBottom: "16px", lineHeight: 1.6 }}>
          Describe an attack, incident type, or security concept and get a walkthrough in the same four-layer format. Or pick from the quick options below.
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <input className="input" value={adhocInput} onChange={e => setAdhocInput(e.target.value)}
            placeholder="e.g. 'What does a phishing investigation look like?'"
            style={{ flex: 1, padding: "11px 14px" }}
            onKeyDown={e => { if (e.key === "Enter") generateWalkthrough(adhocInput); }}
            disabled={generating}
          />
          <button className="btn btn-primary" onClick={() => generateWalkthrough(adhocInput)} disabled={generating}>
            {generating ? "Generating…" : "Generate Walkthrough"}
          </button>
        </div>
        {generating && (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)", marginTop: "10px" }}>
            Generating four-layer walkthrough — this may take 15–30 seconds…
          </p>
        )}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px" }}>
          {quickPicks.map(p => (
            <button key={p} className="btn-filter" onClick={() => { setAdhocInput(p); generateWalkthrough(p); }} disabled={generating}>{p}</button>
          ))}
        </div>
      </div>

      {/* Previously generated */}
      {generatedExamples.length > 0 && (
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-xdim)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>Generated</span>
            <span style={{ background: "var(--bg-subtle)", padding: "1px 7px" }}>{generatedExamples.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {generatedExamples.map(ex => {
              const cia = CIA_STYLES[ex.cia_category] ?? CIA_STYLES.availability;
              return (
                <Link key={ex.slug} href={`/soc-examples/${ex.slug}`}
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px", textDecoration: "none", color: "inherit", transition: "border-color 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--oak-bdr)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  {ex.cia_category && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "2px 7px", border: `1px solid ${cia.bdr}`, color: cia.color, background: cia.bg, flexShrink: 0 }}>
                      {ex.cia_category}
                    </span>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.title}</div>
                    {ex.subtitle && <div style={{ fontSize: "12px", color: "var(--text-xdim)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.subtitle}</div>}
                  </div>
                  {ex.tier_flow && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)", flexShrink: 0 }}>{ex.tier_flow}</span>
                  )}
                  <span style={{ color: "var(--text-dim)", fontSize: "14px", flexShrink: 0 }}>→</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
