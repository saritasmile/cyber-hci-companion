"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────

interface SocExample {
  title: string;
  slug: string;
  subtitle: string;
  cia_category: "availability" | "confidentiality" | "integrity";
  tier_flow: string;
  setup: {
    narrative: string;
    context_fields: { label: string; value: string }[];
  };
  raw_logs: {
    section_title: string;
    section_desc: string;
    intro: string;
    log_blocks: { label: string; lines: string[] }[];
    hci_notes: { label: string; body: string }[];
  };
  siem_alert: {
    section_title: string;
    section_desc: string;
    severity: string;
    alert_title: string;
    alert_rule: string;
    fields: { label: string; value: string; danger: boolean }[];
    prose_after: string;
    hci_notes: { label: string; body: string }[];
  };
  analyst_workflow: {
    section_title: string;
    section_desc: string;
    steps: { time: string; title: string; status: string; body: string }[];
    hci_notes: { label: string; body: string }[];
  };
  soar_response: {
    section_title: string;
    section_desc: string;
    intro: string;
    nodes: { time: string; action: string; detail: string; auto: boolean }[];
    comparison: { dimension: string; siem_only: string; analyst: string; soar: string }[];
    hci_notes: { label: string; body: string }[];
  };
}

// ── CIA badge colors ─────────────────────────────────────────────────────────

const CIA_STYLES: Record<string, { color: string; bg: string; bdr: string }> = {
  availability:    { color: "var(--clay)", bg: "var(--clay-bg)", bdr: "var(--clay-bdr)" },
  confidentiality: { color: "var(--pool)", bg: "var(--pool-bg)", bdr: "var(--pool-bdr)" },
  integrity:       { color: "var(--leaf)", bg: "var(--leaf-bg)", bdr: "var(--leaf-bdr)" },
};

// ── Shared sub-components ────────────────────────────────────────────────────

function HciCallout({ label, body }: { label: string; body: string }) {
  return (
    <div className="insight design" style={{ margin: "20px 0", padding: "16px 20px" }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 500, color: "var(--oak)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{label}</p>
      <p style={{ fontSize: "13.5px", color: "var(--text-mid)", lineHeight: 1.65 }}>{body}</p>
    </div>
  );
}

function ToolTag({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", background: "var(--pool-bg)", color: "var(--pool)", padding: "2px 7px", marginRight: "4px" }}>{children}</span>;
}

// Format analyst step body — replace [ToolName] with ToolTag components
function formatStepBody(body: string) {
  const parts = body.split(/(\[[^\]]+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]$/);
    if (match) return <ToolTag key={i}>{match[1]}</ToolTag>;
    return <span key={i}>{part}</span>;
  });
}

// ── Layer renderers ──────────────────────────────────────────────────────────

function RawLogsLayer({ data }: { data: SocExample["raw_logs"] }) {
  return (
    <div>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "6px" }}>{data.section_title}</h3>
      <p style={{ fontSize: "14px", color: "var(--text-mid)", marginBottom: "20px", maxWidth: "600px", lineHeight: 1.65 }}>{data.section_desc}</p>
      <div style={{ fontSize: "14.5px", color: "var(--text-mid)", lineHeight: 1.75, marginBottom: "16px" }}>
        <p>{data.intro}</p>
      </div>
      {data.log_blocks.map((block, i) => (
        <div key={i} style={{ background: "#1a1a1a", padding: "20px 24px", margin: "16px 0", overflowX: "auto" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#666660", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{block.label}</span>
            <span style={{ width: "6px", height: "6px", background: "#e06c5f", display: "inline-block", animation: "blink 1.5s infinite" }} />
          </div>
          <pre style={{ fontFamily: "var(--font-mono)", fontSize: "12px", lineHeight: 1.7, color: "#c8c8b4", whiteSpace: "pre-wrap", margin: 0 }}>
            {block.lines.join("\n")}
          </pre>
        </div>
      ))}
      {data.hci_notes.map((note, i) => <HciCallout key={i} label={note.label} body={note.body} />)}
    </div>
  );
}

function SiemAlertLayer({ data }: { data: SocExample["siem_alert"] }) {
  return (
    <div>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "6px" }}>{data.section_title}</h3>
      <p style={{ fontSize: "14px", color: "var(--text-mid)", marginBottom: "20px", maxWidth: "600px", lineHeight: 1.65 }}>{data.section_desc}</p>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", marginBottom: "20px", overflow: "hidden" }}>
        <div style={{ background: "var(--clay-bg)", borderBottom: "1px solid var(--border)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "10px", height: "10px", background: "var(--clay)", animation: "blink 2s infinite" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, color: "var(--clay)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{data.severity} — Active Threat</span>
          </div>
        </div>
        <div style={{ padding: "20px" }}>
          <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>{data.alert_title}</h4>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-xdim)", marginBottom: "16px" }}>{data.alert_rule}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
            {data.fields.map(f => (
              <div key={f.label}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-xdim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>{f.label}</div>
                <div style={{ fontSize: "13.5px", color: f.danger ? "var(--clay)" : "var(--text)", fontWeight: 500 }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ fontSize: "14.5px", color: "var(--text-mid)", lineHeight: 1.75 }}>
        <p>{data.prose_after}</p>
      </div>
      {data.hci_notes.map((note, i) => <HciCallout key={i} label={note.label} body={note.body} />)}
    </div>
  );
}

function AnalystWorkflowLayer({ data }: { data: SocExample["analyst_workflow"] }) {
  const dotColor = (s: string) => s === "done" ? "var(--leaf)" : s === "active" ? "var(--oak)" : "var(--border)";
  return (
    <div>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "6px" }}>{data.section_title}</h3>
      <p style={{ fontSize: "14px", color: "var(--text-mid)", marginBottom: "20px", maxWidth: "600px", lineHeight: 1.65 }}>{data.section_desc}</p>
      <div style={{ position: "relative", paddingLeft: "32px" }}>
        <div style={{ position: "absolute", left: "11px", top: 0, bottom: 0, width: "1px", background: "var(--border)" }} />
        {data.steps.map((step, i) => (
          <div key={i} style={{ position: "relative", paddingLeft: "24px", paddingBottom: i < data.steps.length - 1 ? "28px" : "0" }}>
            <div style={{ position: "absolute", left: "-26px", top: "4px", width: "12px", height: "12px", background: step.status === "pending" ? "var(--bg-card)" : dotColor(step.status), border: `2px solid ${dotColor(step.status)}` }} />
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)", marginBottom: "4px" }}>{step.time}</div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>{step.title}</div>
            <div style={{ fontSize: "13.5px", color: "var(--text-mid)", lineHeight: 1.65 }}>{formatStepBody(step.body)}</div>
          </div>
        ))}
      </div>
      {data.hci_notes.map((note, i) => <HciCallout key={i} label={note.label} body={note.body} />)}
    </div>
  );
}

function SoarResponseLayer({ data }: { data: SocExample["soar_response"] }) {
  return (
    <div>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "6px" }}>{data.section_title}</h3>
      <p style={{ fontSize: "14px", color: "var(--text-mid)", marginBottom: "20px", maxWidth: "600px", lineHeight: 1.65 }}>{data.section_desc}</p>
      <div style={{ fontSize: "14.5px", color: "var(--text-mid)", lineHeight: 1.75, marginBottom: "20px" }}>
        <p>{data.intro}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", margin: "20px 0" }}>
        {data.nodes.map((node, i) => (
          <div key={i}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "14px 18px", display: "grid", gridTemplateColumns: "60px 1fr auto", gap: "14px", alignItems: "center" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)", textAlign: "right" }}>{node.time}</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)" }}>{node.action}</div>
                <div style={{ fontSize: "12.5px", color: "var(--text-xdim)" }}>{node.detail}</div>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", padding: "3px 8px", background: node.auto ? "var(--leaf-bg)" : "var(--oak-bg)", color: node.auto ? "var(--leaf)" : "var(--oak)" }}>
                {node.auto ? "Auto" : "Human Decision"}
              </span>
            </div>
            {i < data.nodes.length - 1 && <div style={{ width: "1px", height: "12px", background: "var(--border)", marginLeft: "90px" }} />}
          </div>
        ))}
      </div>
      <div style={{ overflowX: "auto", margin: "20px 0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
          <thead>
            <tr>
              {["Dimension", "SIEM Only", "SIEM + Analyst", "SIEM + SOAR"].map(h => (
                <th key={h} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 500, color: "var(--text-xdim)", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left", padding: "10px 16px", background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.comparison.map(r => (
              <tr key={r.dimension}>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 500, color: "var(--text)", width: "160px" }}>{r.dimension}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", color: "var(--text-mid)" }}>{r.siem_only}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", color: "var(--text-mid)" }}>{r.analyst}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", color: "var(--text-mid)" }}>{r.soar}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.hci_notes.map((note, i) => <HciCallout key={i} label={note.label} body={note.body} />)}
    </div>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ padding: "48px 56px 80px", maxWidth: "960px" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)", marginBottom: "24px" }}>
        <Link href="/soc-examples" style={{ color: "var(--pool)", textDecoration: "none" }}>← SOC Examples</Link>
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "20px", marginBottom: "16px" }}>
          <div className="skeleton-line" style={{ height: "8px", width: "120px", marginBottom: "16px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div className="skeleton-line" style={{ height: "12px", width: "100%" }} />
            <div className="skeleton-line" style={{ height: "12px", width: "85%" }} />
            <div className="skeleton-line" style={{ height: "12px", width: "65%" }} />
          </div>
        </div>
      ))}
      <p style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)" }}>
        Generating four-layer walkthrough — this may take 15–30 seconds…
      </p>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

type LayerId = "raw" | "siem" | "workflow" | "soar";

const LAYERS: { id: LayerId; num: string; label: string }[] = [
  { id: "raw",      num: "Layer 1", label: "Raw Logs" },
  { id: "siem",     num: "Layer 2", label: "SIEM Alert" },
  { id: "workflow", num: "Layer 3", label: "Analyst Workflow" },
  { id: "soar",     num: "Layer 4", label: "SOAR Response" },
];

export default function SocExampleDynamicPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : params.slug?.[0] ?? "";

  const [data, setData] = useState<SocExample | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<LayerId>("raw");

  const fetchExample = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/soc-examples/${slug}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData(await res.json() as SocExample);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchExample(); }, [fetchExample]);

  if (loading) return <LoadingSkeleton />;

  if (error || !data) return (
    <div style={{ padding: "48px 56px" }}>
      <Link href="/soc-examples" style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--pool)", textDecoration: "none", display: "inline-block", marginBottom: "24px" }}>← SOC Examples</Link>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--clay-bdr)", padding: "24px" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--clay)", marginBottom: "8px" }}>Error</p>
        <p style={{ fontSize: "13px", color: "var(--text-mid)", marginBottom: "16px" }}>{error ?? "Example not found."}</p>
        <button onClick={fetchExample} style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--pool)", background: "none", border: "none", cursor: "pointer" }}>Retry →</button>
      </div>
    </div>
  );

  const cia = CIA_STYLES[data.cia_category] ?? CIA_STYLES.availability;

  return (
    <div style={{ padding: "48px 56px 80px", maxWidth: "960px" }}>

      {/* Breadcrumb */}
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)", marginBottom: "24px", display: "flex", alignItems: "center", gap: "6px" }}>
        <Link href="/industry-intel" style={{ color: "var(--pool)", textDecoration: "none" }}>Industry Intel</Link>
        <span>›</span>
        <Link href="/soc-examples" style={{ color: "var(--pool)", textDecoration: "none" }}>SOC Examples</Link>
        <span>›</span>
        <span>{data.title}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "40px", paddingBottom: "32px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "2px 7px", border: `1px solid ${cia.bdr}`, color: cia.color, background: cia.bg }}>{data.cia_category}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "2px 7px", border: "1px solid var(--pool-bdr)", color: "var(--pool)", background: "var(--pool-bg)" }}>{data.tier_flow}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "2px 7px", border: "1px solid var(--border)", color: "var(--text-dim)", background: "var(--bg-subtle)" }}>AI Generated</span>
        </div>
        <h1 style={{ fontSize: "26px", fontWeight: 500, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: "10px" }}>{data.title}</h1>
        <p style={{ fontSize: "14px", color: "var(--text-mid)", lineHeight: 1.7, maxWidth: "640px" }}>{data.subtitle}</p>
      </div>

      {/* Setup */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "24px 28px", marginBottom: "36px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "10px" }}>Scenario Setup</h3>
        <p style={{ fontSize: "14px", color: "var(--text-mid)", lineHeight: 1.7 }}>{data.setup.narrative}</p>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${data.setup.context_fields.length}, 1fr)`, gap: "16px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
          {data.setup.context_fields.map(c => (
            <div key={c.label}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-xdim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{c.label}</div>
              <div style={{ fontSize: "13px", color: "var(--text)", fontWeight: 500 }}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Layer nav */}
      <div style={{ display: "flex", gap: 0, marginBottom: "32px", position: "sticky", top: 0, zIndex: 10, background: "var(--bg)", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
        {LAYERS.map((layer, i) => (
          <button key={layer.id} onClick={() => setActiveLayer(layer.id)}
            style={{
              flex: 1, padding: "14px 16px", textAlign: "center", cursor: "pointer", transition: "all 0.2s",
              fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 500,
              background: activeLayer === layer.id ? "var(--text)" : "var(--bg-card)",
              color: activeLayer === layer.id ? "var(--bg-card)" : "var(--text-xdim)",
              border: "1px solid var(--border)",
              borderRight: i < LAYERS.length - 1 ? "none" : "1px solid var(--border)",
              borderColor: activeLayer === layer.id ? "var(--text)" : "var(--border)",
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", display: "block", marginBottom: "2px", opacity: 0.6 }}>{layer.num}</span>
            {layer.label}
          </button>
        ))}
      </div>

      {/* Layer content */}
      {activeLayer === "raw" && <RawLogsLayer data={data.raw_logs} />}
      {activeLayer === "siem" && <SiemAlertLayer data={data.siem_alert} />}
      {activeLayer === "workflow" && <AnalystWorkflowLayer data={data.analyst_workflow} />}
      {activeLayer === "soar" && <SoarResponseLayer data={data.soar_response} />}

      {/* Back link */}
      <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid var(--border)" }}>
        <Link href="/soc-examples" style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--pool)", textDecoration: "none" }}>← Back to SOC Examples</Link>
      </div>

      <style>{`@keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0.2; } }`}</style>
    </div>
  );
}
