import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

function buildPrompt(scenario: string): string {
  return `You are a senior SOC analyst and cybersecurity educator helping a UX/HCI designer understand security operations through concrete examples. The designer has limited cybersecurity background but is technically literate and learns best through realistic, layered walkthroughs.

The user wants to see a walkthrough for: "${scenario}"

Generate a complete four-layer SOC example walkthrough. Return ONLY a JSON object — no markdown fences, no preamble, no trailing text.

Required structure:
{
  "title": "Short, specific title for this scenario (e.g. 'Brute Force Login Attack Against VPN Portal')",
  "slug": "url-safe-slug-for-this-scenario (lowercase, hyphens, no spaces)",
  "subtitle": "One sentence describing what you'll walk through — mention all four layers",
  "cia_category": "One of: availability, confidentiality, integrity",
  "tier_flow": "e.g. 'Tier 1' or 'Tier 1 → Tier 2' or 'Tier 1 → Tier 2 → IR'",
  "setup": {
    "narrative": "2-3 sentences setting the scene. Put the reader in the analyst's chair — what time is it, what's the environment, what were they doing before this alert hit.",
    "context_fields": [
      { "label": "Target", "value": "The specific target or system" },
      { "label": "Attack Type", "value": "Technical classification" },
      { "label": "Key Metric", "value": "The most telling number — baseline vs. anomaly" }
    ]
  },
  "raw_logs": {
    "section_title": "A short title for this layer",
    "section_desc": "1-2 sentences explaining what we're looking at",
    "intro": "1-2 paragraphs of prose context before showing logs",
    "log_blocks": [
      {
        "label": "LOG SOURCE NAME — e.g. 'WINDOWS EVENT LOG — DC01.corp.acme.com'",
        "lines": [
          "Each line is a realistic log entry. Include timestamps, IPs, usernames, status codes, etc.",
          "Show 3-4 normal entries first, then 6-8 anomalous entries that reveal the attack pattern",
          "Include a comment line starting with # explaining what's happening"
        ]
      }
    ],
    "hci_notes": [
      { "label": "HCI Design Note", "body": "A paragraph connecting what the analyst sees in these logs to a design opportunity or challenge" }
    ]
  },
  "siem_alert": {
    "section_title": "A short title for this layer",
    "section_desc": "1-2 sentences explaining the transformation from raw logs to alert",
    "severity": "One of: critical, high, medium",
    "alert_title": "The alert headline as it would appear in a SIEM",
    "alert_rule": "The rule name and correlation logic",
    "fields": [
      { "label": "FIELD NAME", "value": "field value", "danger": true }
    ],
    "prose_after": "1-2 paragraphs explaining what the SIEM did to produce this alert",
    "hci_notes": [
      { "label": "HCI Design Note", "body": "A paragraph about what's missing from the alert from a design perspective" },
      { "label": "SIEM vs. SOAR", "body": "A paragraph reinforcing this key distinction for this specific scenario" }
    ]
  },
  "analyst_workflow": {
    "section_title": "A short title for this layer",
    "section_desc": "1-2 sentences framing the analyst experience",
    "steps": [
      {
        "time": "T+0:00 or similar",
        "title": "Step title",
        "status": "One of: done, active, pending",
        "body": "2-4 sentences describing what the analyst does. Reference specific tools with names like [SIEM], [Slack], [EDR], [Firewall], [Ticketing], [PagerDuty], etc."
      }
    ],
    "hci_notes": [
      { "label": "HCI Design Note", "body": "Count the context switches, describe the cognitive load, connect to the real analyst experience" },
      { "label": "What this feels like", "body": "A paragraph about the emotional/cognitive texture of doing this work" }
    ]
  },
  "soar_response": {
    "section_title": "A short title for this layer",
    "section_desc": "1-2 sentences framing the SOAR alternative",
    "intro": "1 paragraph on the SIEM-detects-SOAR-acts distinction for this scenario",
    "nodes": [
      {
        "time": "T+0:00 — timing in seconds",
        "action": "What the SOAR does",
        "detail": "Specific API call or automation step",
        "auto": true
      }
    ],
    "comparison": [
      {
        "dimension": "e.g. Time to containment",
        "siem_only": "What SIEM alone provides",
        "analyst": "What the human analyst achieves",
        "soar": "What SOAR automation achieves"
      }
    ],
    "hci_notes": [
      { "label": "HCI Design Note", "body": "The design problem SOAR creates (playbook maintenance, transparency, trust)" },
      { "label": "The bigger picture", "body": "Connect to the industry-wide human-AI interaction challenge" }
    ]
  }
}

CRITICAL GUIDELINES:
- Make log entries realistic with plausible IPs, timestamps, usernames, file paths, and status codes
- Include 5-7 analyst workflow steps
- Include 6-8 SOAR automation nodes with at least one "auto": false human decision point
- Include 5-7 comparison rows
- Every HCI note should connect the technical content to a specific design opportunity or UX challenge
- Write for a UX designer, not a security engineer — explain jargon inline
- Be specific to THIS scenario type — don't use generic security advice`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = getSupabaseServer();

  // ── Check cache ──────────────────────────────────────────────────────────
  const { data: cached } = await supabase
    .from("soc_example_cache")
    .select("example, expires_at")
    .eq("slug", slug)
    .single();

  if (cached && new Date(cached.expires_at) > new Date()) {
    return NextResponse.json(cached.example);
  }

  // Not cached and no scenario description — return 404
  return NextResponse.json(
    { error: "Example not found. Use POST to generate." },
    { status: 404 }
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();
  const scenario: string = body.scenario ?? slug;

  const supabase = getSupabaseServer();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let example: Record<string, unknown>;
  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 8192,
      messages: [{ role: "user", content: buildPrompt(scenario) }],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text : "";
    const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    example = JSON.parse(jsonText);
  } catch (err) {
    console.error("[soc-examples/route] Anthropic or parse error:", err);
    return NextResponse.json(
      { error: "Failed to generate walkthrough. Please try again." },
      { status: 500 }
    );
  }

  // ── Persist to cache (7-day TTL) ─────────────────────────────────────────
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error: cacheError } = await supabase
    .from("soc_example_cache")
    .upsert(
      { slug, scenario, example, expires_at: expiresAt.toISOString() },
      { onConflict: "slug" }
    );

  if (cacheError) {
    console.error("[soc-examples/route] Cache write failed:", cacheError.message);
  }

  return NextResponse.json(example);
}
