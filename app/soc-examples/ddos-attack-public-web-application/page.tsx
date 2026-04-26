"use client";

import { useState } from "react";
import Link from "next/link";

// ── Terminal line component ──────────────────────────────────────────────────

function T({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span style={{ ...style }}>{children}</span>;
}

const tc = {
  dim:     { color: "#666660" },
  ts:      { color: "#666660" },
  src:     { color: "#6ba3c7" },
  dst:     { color: "#d4b85c" },
  allow:   { color: "#7ec873" },
  deny:    { color: "#e06c5f" },
  proto:   { color: "#b794c6" },
  hi:      { color: "#e06c5f", fontWeight: 500 as const },
  comment: { color: "#666660", fontStyle: "italic" as const },
};

// ── Shared sub-components ────────────────────────────────────────────────────

function HciCallout({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="insight design" style={{ margin: "20px 0", padding: "16px 20px" }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 500, color: "var(--oak)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
        {label}
      </p>
      <div style={{ fontSize: "13.5px", color: "var(--text-mid)", lineHeight: 1.65 }}>
        {children}
      </div>
    </div>
  );
}

function Terminal({ label, live, children }: { label: string; live?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ background: "#1a1a1a", padding: "20px 24px", margin: "16px 0", overflowX: "auto" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#666660", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{label}</span>
        {live && <span style={{ width: "6px", height: "6px", background: "#e06c5f", display: "inline-block", animation: "blink 1.5s infinite" }} />}
      </div>
      <pre style={{ fontFamily: "var(--font-mono)", fontSize: "12px", lineHeight: 1.7, color: "#c8c8b4", whiteSpace: "pre", margin: 0 }}>
        {children}
      </pre>
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: "14.5px", color: "var(--text-mid)", lineHeight: 1.75 }}>{children}</div>;
}

function ToolTag({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", background: "var(--pool-bg)", color: "var(--pool)", padding: "2px 7px", marginRight: "4px" }}>{children}</span>;
}

// ── Layer 1: Raw Logs ────────────────────────────────────────────────────────

function RawLogsLayer() {
  return (
    <div>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "6px" }}>What the machines are actually saying</h3>
      <p style={{ fontSize: "14px", color: "var(--text-mid)", marginBottom: "20px", maxWidth: "600px", lineHeight: 1.65 }}>
        Before any tool processes anything, this is what's being generated — thousands of lines per second across multiple sources. Each line is one event. This is the firehose.
      </p>

      <Prose>
        <p style={{ marginBottom: "14px" }}>A DDoS attack generates evidence across multiple log sources simultaneously. Here are the three you'd care about most: the <strong style={{ color: "var(--text)", fontWeight: 600 }}>web server access logs</strong> (what's hitting your application), the <strong style={{ color: "var(--text)", fontWeight: 600 }}>firewall logs</strong> (what's hitting your network), and the <strong style={{ color: "var(--text)", fontWeight: 600 }}>load balancer health checks</strong> (what's failing).</p>
      </Prose>

      <Terminal label="NGINX ACCESS LOG — shop.acmecorp.com" live>
        <T style={tc.comment}># Normal traffic — a few requests per second, varied paths and user agents</T>{"\n"}
        <T style={tc.ts}>2026-03-29T14:43:12Z</T> <T style={tc.src}>72.134.88.201</T> GET /products/shoes <T style={tc.allow}>200</T> 0.043s "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4)"{"\n"}
        <T style={tc.ts}>2026-03-29T14:43:12Z</T> <T style={tc.src}>98.207.14.55</T>  GET /cart <T style={tc.allow}>200</T> 0.067s "Mozilla/5.0 (Windows NT 10.0; Win64)"{"\n"}
        <T style={tc.ts}>2026-03-29T14:43:13Z</T> <T style={tc.src}>45.22.176.89</T>  POST /api/checkout <T style={tc.allow}>200</T> 0.182s "Mozilla/5.0 (Macintosh; Intel)"{"\n"}
        {"\n"}
        <T style={tc.comment}># 2:47 PM — the flood begins. Notice the pattern:</T>{"\n"}
        <T style={tc.ts}>2026-03-29T14:47:01Z</T> <T style={tc.hi}>185.234.72.11</T>  GET / <T style={tc.allow}>200</T> 0.891s "python-requests/2.28.1"{"\n"}
        <T style={tc.ts}>2026-03-29T14:47:01Z</T> <T style={tc.hi}>185.234.72.14</T>  GET / <T style={tc.allow}>200</T> 0.903s "python-requests/2.28.1"{"\n"}
        <T style={tc.ts}>2026-03-29T14:47:01Z</T> <T style={tc.hi}>91.108.44.203</T>  GET / <T style={tc.allow}>200</T> 0.944s "python-requests/2.28.1"{"\n"}
        <T style={tc.ts}>2026-03-29T14:47:01Z</T> <T style={tc.hi}>185.234.72.18</T>  GET / <T style={tc.allow}>200</T> 1.102s "python-requests/2.28.1"{"\n"}
        <T style={tc.ts}>2026-03-29T14:47:01Z</T> <T style={tc.hi}>45.155.205.99</T>  GET / <T style={tc.allow}>200</T> 1.230s "python-requests/2.28.1"{"\n"}
        <T style={tc.ts}>2026-03-29T14:47:02Z</T> <T style={tc.hi}>185.234.72.22</T>  GET / <T style={tc.allow}>200</T> 1.567s "python-requests/2.28.1"{"\n"}
        <T style={tc.ts}>2026-03-29T14:47:02Z</T> <T style={tc.hi}>185.234.72.25</T>  GET / <T style={tc.deny}>503</T> 2.001s "python-requests/2.28.1"{"\n"}
        <T style={tc.ts}>2026-03-29T14:47:02Z</T> <T style={tc.hi}>91.108.44.211</T>  GET / <T style={tc.deny}>503</T> 2.104s "python-requests/2.28.1"{"\n"}
        <T style={tc.comment}># ... 47,000 of these per second and climbing</T>
      </Terminal>

      <HciCallout label="HCI Design Note">
        <p>Look at the patterns an analyst's eye would catch: identical user agent strings (<span style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>python-requests/2.28.1</span>), IPs from the same subnet (185.234.72.x), all hitting the root path, response times climbing from 43ms to 2+ seconds. A well-designed SIEM should surface these patterns visually rather than forcing the analyst to scan raw text. Most don't — they just show a count spike on a chart.</p>
      </HciCallout>

      <Terminal label="FIREWALL LOG — Palo Alto PA-5260" live>
        <T style={tc.ts}>2026-03-29T14:47:01</T> <T style={tc.proto}>TRAFFIC</T> <T style={tc.src}>185.234.72.11</T> → <T style={tc.dst}>10.0.1.50:443</T> <T style={tc.allow}>allow</T> tcp rule=web-inbound bytes=<T style={tc.hi}>2847291</T>{"\n"}
        <T style={tc.ts}>2026-03-29T14:47:01</T> <T style={tc.proto}>TRAFFIC</T> <T style={tc.src}>91.108.44.203</T> → <T style={tc.dst}>10.0.1.50:443</T> <T style={tc.allow}>allow</T> tcp rule=web-inbound bytes=<T style={tc.hi}>3102844</T>{"\n"}
        <T style={tc.ts}>2026-03-29T14:47:02</T> <T style={tc.proto}>THREAT</T>  <T style={tc.src}>185.234.72.0/24</T> → <T style={tc.dst}>10.0.1.50:443</T> <T style={tc.deny}>flood-detected</T> type=<T style={tc.hi}>syn-flood</T> threshold=10000{"\n"}
        <T style={tc.comment}># Firewall sees the volume but these are valid HTTP requests — hard to block without blocking real users</T>
      </Terminal>

      <Terminal label="AWS ALB HEALTH CHECK LOG" live>
        <T style={tc.ts}>2026-03-29T14:47:45</T> target=<T style={tc.dst}>i-0a3b7c9e1f (10.0.1.50)</T> status=<T style={tc.allow}>healthy</T> response_time=0.234s{"\n"}
        <T style={tc.ts}>2026-03-29T14:48:15</T> target=<T style={tc.dst}>i-0a3b7c9e1f (10.0.1.50)</T> status=<T style={tc.allow}>healthy</T> response_time=<T style={tc.hi}>4.891s</T>{"\n"}
        <T style={tc.ts}>2026-03-29T14:48:45</T> target=<T style={tc.dst}>i-0a3b7c9e1f (10.0.1.50)</T> status=<T style={tc.deny}>unhealthy</T> reason=<T style={tc.hi}>timeout</T>{"\n"}
        <T style={tc.ts}>2026-03-29T14:49:15</T> target=<T style={tc.dst}>i-0a3b7c9e1f (10.0.1.50)</T> status=<T style={tc.deny}>unhealthy</T> reason=<T style={tc.hi}>timeout</T>{"\n"}
        <T style={tc.comment}># Load balancer starts pulling the server out of rotation — customers now see errors</T>
      </Terminal>

      <HciCallout label="What to internalize">
        <p>Every security tool you'll ever encounter is downstream of data that looks like this. When vendors talk about "ingestion," "parsing," and "normalization," they mean taking these messy, inconsistent text streams from dozens of different formats and making them queryable. The design challenge begins here: how do you make a million log lines per minute into something a person can reason about?</p>
      </HciCallout>
    </div>
  );
}

// ── Layer 2: SIEM Alert ──────────────────────────────────────────────────────

function SiemAlertLayer() {
  const fields = [
    { label: "Target", value: "shop.acmecorp.com (10.0.1.50)", danger: false },
    { label: "Current Request Rate", value: "47,283 req/sec (baseline: 800)", danger: true },
    { label: "Source IPs", value: "2,847 unique (12 ASNs, 6 countries)", danger: false },
    { label: "Duration So Far", value: "4 min 22 sec (ongoing)", danger: true },
    { label: "Service Status", value: "DEGRADED — 503 error rate at 73%", danger: true },
    { label: "Top User Agent", value: "python-requests/2.28.1 (94% of traffic)", danger: false },
    { label: "Correlated Alerts", value: "ALB health check failure, CPU threshold breach", danger: false },
    { label: "MITRE ATT&CK", value: "T1498.001 — Network DoS: Direct Flood", danger: false },
  ];

  return (
    <div>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "6px" }}>How the SIEM transforms the firehose into a signal</h3>
      <p style={{ fontSize: "14px", color: "var(--text-mid)", marginBottom: "20px", maxWidth: "600px", lineHeight: 1.65 }}>
        The SIEM ingested all those logs, ran correlation rules against them, and produced this — a single alert card that represents the synthesis of thousands of data points.
      </p>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", marginBottom: "20px", overflow: "hidden" }}>
        <div style={{ background: "var(--clay-bg)", borderBottom: "1px solid var(--border)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "10px", height: "10px", background: "var(--clay)", animation: "blink 2s infinite" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, color: "var(--clay)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Critical — Active Threat</span>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)" }}>ALERT-2026-8847</span>
        </div>
        <div style={{ padding: "20px" }}>
          <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>Volumetric DDoS Detected — HTTP Flood on shop.acmecorp.com</h4>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-xdim)", marginBottom: "16px" }}>Rule: ddos_http_flood_threshold | Correlation: traffic_anomaly + health_degradation</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
            {fields.map(f => (
              <div key={f.label}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-xdim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>{f.label}</div>
                <div style={{ fontSize: "13.5px", color: f.danger ? "var(--clay)" : "var(--text)", fontWeight: 500 }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Prose>
        <p style={{ marginBottom: "14px" }}>Notice what happened: those thousands of raw log lines became <strong style={{ color: "var(--text)", fontWeight: 600 }}>one alert with structured fields</strong>. The SIEM counted unique source IPs, calculated the deviation from baseline traffic, correlated the web server errors with the load balancer health check failures, mapped the behavior to a MITRE ATT&CK technique, and assessed severity.</p>
        <p style={{ marginBottom: "14px" }}>This is what a Tier 1 analyst actually sees in their queue. In a typical SIEM like Splunk or Microsoft Sentinel, this would appear as a row in a table alongside all the other alerts — maybe 15-30 open alerts at any given time during a normal shift. This one would stand out because of the critical severity tag, but the analyst still has to <strong style={{ color: "var(--text)", fontWeight: 600 }}>decide what to do with it</strong>.</p>
      </Prose>

      <HciCallout label="HCI Design Note">
        <p>This alert card is doing a lot of work, but look at what it's <em>not</em> doing: it's not showing the analyst the <em>trajectory</em> (is the attack accelerating or plateauing?), it's not showing geographic distribution of sources visually, and it's not surfacing whether this target has been hit before. Most SIEMs present alerts as static snapshots rather than evolving situations. For an availability incident that's actively unfolding, that's a major design failure — the analyst needs to see the attack's momentum, not just its current state.</p>
      </HciCallout>

      <HciCallout label="SIEM vs. SOAR — the key distinction">
        <p>The SIEM stops here. It <strong style={{ color: "var(--text)", fontWeight: 600 }}>detected and displayed</strong>. It will not block the attack, notify stakeholders, or spin up mitigation. That's either the analyst's job (Layer 3) or the SOAR's job (Layer 4). Think of the SIEM as a very sophisticated smoke detector — it tells you there's a fire, but it doesn't grab the extinguisher.</p>
      </HciCallout>
    </div>
  );
}

// ── Layer 3: Analyst Workflow ────────────────────────────────────────────────

interface WorkflowStep { time: string; title: string; body: React.ReactNode; status: "done" | "active" | "pending"; }

function AnalystWorkflowLayer() {
  const steps: WorkflowStep[] = [
    { time: "T+0:00 — 2:47 PM", title: "Alert appears in queue", status: "done", body: <p>The SIEM fires the alert and it lands in the analyst's queue alongside 22 other open alerts. The critical severity pulls it to the top. The analyst reads the summary, notes the attack type (HTTP flood), target (shop.acmecorp.com), and that it's <em>ongoing</em>. Heart rate goes up — this is a revenue-generating application.</p> },
    { time: "T+1:30", title: "Validate it's real, not a false positive", status: "done", body: <><p style={{ marginBottom: "12px" }}>First instinct: is this actually an attack, or did a marketing campaign just drive a traffic spike? The analyst checks:</p><p style={{ marginBottom: "8px" }}><ToolTag>SIEM</ToolTag> Query the traffic logs — is the user agent distribution normal? No: 94% is <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>python-requests</span>. Real customers use browsers.</p><p style={{ marginBottom: "8px" }}><ToolTag>Slack</ToolTag> Quick message to marketing: "Did we launch anything today?" Response: "No, nothing scheduled."</p><p>Verdict: this is real. Not a false positive.</p></> },
    { time: "T+4:00", title: "Assess scope and impact", status: "done", body: <><p style={{ marginBottom: "8px" }}><ToolTag>Monitoring</ToolTag> Check Datadog/Grafana — the web servers are at 98% CPU, response times have blown past SLA thresholds, and the error rate is climbing. Real customers are getting 503 errors.</p><p style={{ marginBottom: "8px" }}><ToolTag>SIEM</ToolTag> Pivot to check: are other services being hit? The API server and CDN appear normal — this is targeted at the web app only.</p><p><ToolTag>Threat Intel</ToolTag> Look up the top source IP ranges. Several are from known bulletproof hosting providers commonly associated with botnets.</p></> },
    { time: "T+8:00", title: "Initial mitigation — buy some time", status: "active", body: <><p style={{ marginBottom: "12px" }}>The analyst can't fix this alone but needs to reduce the bleeding:</p><p style={{ marginBottom: "8px" }}><ToolTag>WAF</ToolTag> Create a rate-limiting rule in Cloudflare/AWS WAF to block requests with the <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>python-requests</span> user agent.</p><p style={{ marginBottom: "8px" }}><ToolTag>Firewall</ToolTag> Submit a request to block the top 5 source CIDR ranges at the network edge. This requires approval from the network team — the analyst can't do it alone.</p><p>The rate limiting helps. Error rate drops from 73% to 45%. But the attack is adapting — new IPs and user agents are appearing.</p></> },
    { time: "T+12:00", title: "Escalate to Tier 2 and Incident Response", status: "active", body: <><p style={{ marginBottom: "12px" }}>This is beyond Tier 1 scope. The analyst:</p><p style={{ marginBottom: "8px" }}><ToolTag>Ticketing</ToolTag> Creates a formal incident ticket (SEV-1) in ServiceNow/Jira with all findings so far.</p><p style={{ marginBottom: "8px" }}><ToolTag>PagerDuty</ToolTag> Pages the on-call Tier 2 analyst and the infrastructure team lead.</p><p><ToolTag>Slack</ToolTag> Posts to #incident-response with a summary. The war room begins. The Tier 1 analyst's active role is mostly done.</p></> },
    { time: "T+15:00 → T+45:00", title: "Tier 2 takes over — advanced response", status: "pending", body: <p>Tier 2 activates DDoS mitigation services (Cloudflare Under Attack Mode, AWS Shield Advanced), works with ISP to null-route attack traffic upstream, scales infrastructure horizontally, and coordinates with business stakeholders on customer communication. This phase can last hours.</p> },
  ];

  const dotColor = (s: string) => s === "done" ? "var(--leaf)" : s === "active" ? "var(--oak)" : "var(--border)";

  return (
    <div>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "6px" }}>What the Tier 1 analyst actually does</h3>
      <p style={{ fontSize: "14px", color: "var(--text-mid)", marginBottom: "20px", maxWidth: "600px", lineHeight: 1.65 }}>
        This is the lived experience — the sequence of actions, tool switches, and judgment calls an analyst makes when that critical alert appears. This is what takes 15-45 minutes manually.
      </p>

      <div style={{ position: "relative", paddingLeft: "32px" }}>
        <div style={{ position: "absolute", left: "11px", top: 0, bottom: 0, width: "1px", background: "var(--border)" }} />
        {steps.map((step, i) => (
          <div key={i} style={{ position: "relative", paddingLeft: "24px", paddingBottom: i < steps.length - 1 ? "28px" : "0" }}>
            <div style={{ position: "absolute", left: "-26px", top: "4px", width: "12px", height: "12px", background: step.status === "pending" ? "var(--bg-card)" : dotColor(step.status), border: `2px solid ${dotColor(step.status)}` }} />
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)", marginBottom: "4px" }}>{step.time}</div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>{step.title}</div>
            <div style={{ fontSize: "13.5px", color: "var(--text-mid)", lineHeight: 1.65 }}>{step.body}</div>
          </div>
        ))}
      </div>

      <HciCallout label="HCI Design Note — the real experience">
        <p>Count the context switches: SIEM → Slack → SIEM → Datadog → SIEM → Threat Intel lookup → WAF console → Firewall request form → Ticketing system → PagerDuty → Slack again. That's <strong style={{ color: "var(--text)", fontWeight: 600 }}>11 tool switches in 12 minutes</strong> during a high-stress, time-critical incident. Each switch means a new interface, a new mental model, lost clipboard context, and potential for error. This is the core HCI problem in security operations.</p>
      </HciCallout>

      <HciCallout label="What alert fatigue feels like in practice">
        <p>While this critical DDoS alert is being worked, those other 22 alerts in the queue aren't going anywhere. Some might be deteriorating. The analyst knows this, which adds background anxiety to an already stressful investigation. After this incident is escalated, they go back to the queue — and some of those "low priority" alerts may have been sitting for hours. Multiply this by every shift, every day. That's why 70% of junior analysts burn out and leave.</p>
      </HciCallout>
    </div>
  );
}

// ── Layer 4: SOAR Response ───────────────────────────────────────────────────

function SoarResponseLayer() {
  const nodes = [
    { time: "T+0:00", action: "Alert ingested from SIEM", detail: "SOAR receives ALERT-2026-8847, parses fields, triggers playbook: ddos_response_v3", auto: true },
    { time: "T+0:03", action: "Validate — query traffic baseline", detail: "API call to monitoring: current 47K req/s vs. 800 baseline. Deviation > 10x → confirmed anomaly", auto: true },
    { time: "T+0:08", action: "Enrich — threat intel lookup on source IPs", detail: "Top 50 IPs queried against VirusTotal, AbuseIPDB, and internal blocklist. 38/50 flagged as known botnet infrastructure", auto: true },
    { time: "T+0:12", action: "Contain — deploy WAF rate-limiting rule", detail: "API call to Cloudflare: block python-requests UA, rate-limit >100 req/s per IP on target path", auto: true },
    { time: "T+0:15", action: "Contain — push firewall block rules", detail: "API call to Palo Alto: block top 12 CIDR ranges identified in threat intel enrichment", auto: true },
    { time: "T+0:18", action: "Notify — page on-call team", detail: "PagerDuty SEV-1 created. Slack #incident-response posted with enriched summary and actions taken so far", auto: true },
    { time: "T+0:20", action: "Escalate — activate DDoS mitigation service?", detail: "Playbook pauses. Enabling Cloudflare Under Attack Mode affects all users. Requires human approval.", auto: false },
    { time: "T+0:25", action: "Document — create incident ticket with full timeline", detail: "ServiceNow ticket auto-generated with: alert details, enrichment results, all containment actions, current status, pending decision", auto: true },
  ];

  const compareRows = [
    { dim: "Time to containment", siem: "∞ — SIEM doesn't act", analyst: "~12 minutes", soar: "~15 seconds" },
    { dim: "Threat intel enrichment", siem: "None — raw alert only", analyst: "Manual, 3-5 IPs checked", soar: "Automated, 50 IPs in 5 sec" },
    { dim: "Documentation", siem: "Alert log only", analyst: "Analyst writes ticket manually", soar: "Auto-generated, complete" },
    { dim: "Context switches", siem: "N/A", analyst: "11 tool switches", soar: "0 — API-based orchestration" },
    { dim: "Consistency", siem: "N/A", analyst: "Depends on analyst experience", soar: "Identical every time" },
    { dim: "Judgment calls", siem: "N/A", analyst: "Human throughout", soar: "Human at decision points only" },
    { dim: "Maintenance burden", siem: "Detection rule tuning", analyst: "Training + tribal knowledge", soar: "Playbook updates + API changes" },
  ];

  return (
    <div>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "6px" }}>How a SOAR handles the same scenario</h3>
      <p style={{ fontSize: "14px", color: "var(--text-mid)", marginBottom: "20px", maxWidth: "600px", lineHeight: 1.65 }}>
        A SOAR platform takes the same alert and executes a predefined playbook — automating most of what the Tier 1 analyst did manually in Layer 3.
      </p>

      <Prose>
        <p style={{ marginBottom: "14px" }}>The critical difference: <strong style={{ color: "var(--text)", fontWeight: 600 }}>the SIEM detects, the SOAR acts</strong>. When the SIEM fires that DDoS alert, it also sends it to the SOAR platform, which triggers a playbook — a pre-built sequence of automated actions.</p>
      </Prose>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px", margin: "20px 0" }}>
        {nodes.map((node, i) => (
          <div key={i}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "14px 18px", display: "grid", gridTemplateColumns: "60px 1fr auto", gap: "14px", alignItems: "center", transition: "border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--oak-bdr)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)", textAlign: "right" }}>{node.time}</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)" }}>{node.action}</div>
                <div style={{ fontSize: "12.5px", color: "var(--text-xdim)" }}>{node.detail}</div>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", padding: "3px 8px", background: node.auto ? "var(--leaf-bg)" : "var(--oak-bg)", color: node.auto ? "var(--leaf)" : "var(--oak)" }}>
                {node.auto ? "Auto" : "Human Decision"}
              </span>
            </div>
            {i < nodes.length - 1 && <div style={{ width: "1px", height: "12px", background: "var(--border)", marginLeft: "90px" }} />}
          </div>
        ))}
      </div>

      <Prose>
        <p style={{ marginBottom: "14px" }}>Total time to reach the same point the Tier 1 analyst reached in 12 minutes: <strong style={{ color: "var(--text)", fontWeight: 600 }}>25 seconds</strong>. And it's more thorough — the SOAR queried threat intel on 50 IPs (the analyst probably checked 5), deployed containment rules via API, and created a fully documented ticket.</p>
        <p>But notice the <strong style={{ color: "var(--text)", fontWeight: 600 }}>"Human Decision" step</strong> — the SOAR paused before activating full DDoS mitigation mode because that decision has business impact. Real customers will experience CAPTCHAs and delays. That's a judgment call the automation can't make alone.</p>
      </Prose>

      <HciCallout label="HCI Design Note — SOAR's design problem">
        <p>SOAR platforms solve the speed problem but create a new one: <strong style={{ color: "var(--text)", fontWeight: 600 }}>playbook maintenance</strong>. Someone has to build, test, and maintain these automated workflows. Traditional SOAR tools require visual flowchart builders or code — and they break when tool APIs change. This is why the "AI SOC analyst" startups are so interesting: they promise SOAR-like automation without the playbook burden. The design question is whether "no playbooks" means "no transparency."</p>
      </HciCallout>

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
            {compareRows.map(r => (
              <tr key={r.dim}>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 500, color: "var(--text)", width: "160px" }}>{r.dim}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", color: "var(--text-mid)" }}>{r.siem}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", color: "var(--text-mid)" }}>{r.analyst}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", color: "var(--text-mid)" }}>{r.soar}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <HciCallout label="The bigger picture">
        <p>This comparison table is essentially the argument the entire AI SOC industry is making: humans can't keep up, automation is faster and more consistent, but judgment still matters at key decision points. The design frontier is figuring out <em>where exactly</em> the human should be in the loop, how to give them the right context at those decision points, and how to build trust that the automation handled everything else correctly. That's an HCI problem as much as a security engineering one.</p>
      </HciCallout>
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

export default function DDoSExamplePage() {
  const [activeLayer, setActiveLayer] = useState<LayerId>("raw");

  return (
    <div style={{ padding: "48px 56px 80px", maxWidth: "960px" }}>

      {/* Breadcrumb */}
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-xdim)", marginBottom: "24px", display: "flex", alignItems: "center", gap: "6px" }}>
        <Link href="/industry-intel" style={{ color: "var(--pool)", textDecoration: "none" }}>Industry Intel</Link>
        <span>›</span>
        <Link href="/soc-examples" style={{ color: "var(--pool)", textDecoration: "none" }}>SOC Examples</Link>
        <span>›</span>
        <span>DDoS Attack on Public-Facing Web Application</span>
      </div>

      {/* Scenario header */}
      <div style={{ marginBottom: "40px", paddingBottom: "32px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "2px 7px", border: "1px solid var(--clay-bdr)", color: "var(--clay)", background: "var(--clay-bg)" }}>Availability</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "2px 7px", border: "1px solid var(--pool-bdr)", color: "var(--pool)", background: "var(--pool-bg)" }}>Tier 1 → Tier 2</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "2px 7px", border: "1px solid var(--border)", color: "var(--text-dim)", background: "var(--bg-subtle)" }}>Pre-populated</span>
        </div>
        <h1 style={{ fontSize: "26px", fontWeight: 500, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: "10px" }}>
          DDoS Attack on Public-Facing Web Application
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-mid)", lineHeight: 1.7, maxWidth: "640px" }}>
          A volumetric DDoS takes down a customer-facing e-commerce site. Walk through every layer: what the raw logs look like, how the SIEM surfaces it, what the analyst does step by step, and how a SOAR would handle the same scenario automatically.
        </p>
      </div>

      {/* Scenario context */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "24px 28px", marginBottom: "36px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "10px" }}>Scenario Setup</h3>
        <p style={{ fontSize: "14px", color: "var(--text-mid)", lineHeight: 1.7 }}>
          It's 2:47 PM on a Tuesday. You're a Tier 1 SOC analyst at a mid-size e-commerce company. Your shift started at noon and you've been working through a normal queue of mostly false-positive alerts — a couple of failed VPN logins, a flagged but benign PowerShell script, the usual. Then your SIEM lights up.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
          {[
            { label: "Target", value: "shop.acmecorp.com (Web App)" },
            { label: "Attack Type", value: "HTTP flood (Layer 7 DDoS)" },
            { label: "Normal Traffic", value: "~800 req/sec → 47,000 req/sec" },
          ].map(c => (
            <div key={c.label}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-xdim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{c.label}</div>
              <div style={{ fontSize: "13px", color: "var(--text)", fontWeight: 500 }}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Layer nav — sticky */}
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
      {activeLayer === "raw" && <RawLogsLayer />}
      {activeLayer === "siem" && <SiemAlertLayer />}
      {activeLayer === "workflow" && <AnalystWorkflowLayer />}
      {activeLayer === "soar" && <SoarResponseLayer />}

      {/* Back link */}
      <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid var(--border)" }}>
        <Link href="/soc-examples" style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--pool)", textDecoration: "none" }}>← Back to SOC Examples</Link>
      </div>

      <style>{`@keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0.2; } }`}</style>
    </div>
  );
}
