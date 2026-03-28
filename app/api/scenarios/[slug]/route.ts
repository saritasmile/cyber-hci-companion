import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { scenarios } from "@/lib/scenarios";
import type { ScenarioMeta } from "@/lib/scenarios";

// Server-side Supabase client — uses service role key to bypass RLS on shared cache table.
function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

function buildPrompt(scenario: ScenarioMeta): string {
  return `You are a senior cybersecurity analyst and HCI researcher with expertise in incident response, security operations, and human-centered design. Analyze the following cyber incident and provide a structured, authoritative analysis.

Incident: ${scenario.name}
Date: ${scenario.date}
Type: ${scenario.type}
Sector: ${scenario.sector}
Brief: ${scenario.summary}

Provide a comprehensive analysis as a JSON object. Return ONLY the JSON object—no markdown fences, no preamble, no trailing text.

Required structure:
{
  "overview": {
    "what_happened": "A clear, 3–5 sentence narrative of the incident for a technically literate non-specialist audience.",
    "timeline": [
      { "date": "YYYY-MM or descriptive date", "event": "What happened at this point" }
    ],
    "scale": "Quantified scope: number of organizations, users, records, financial impact, etc.",
    "attribution": "Who was responsible, with confidence level and supporting evidence."
  },
  "analyst": {
    "summary": "Technical summary for a SOC analyst or security engineer—3–4 sentences.",
    "detection": [
      "Specific detection method or indicator that could surface this attack type"
    ],
    "iocs": [
      "Concrete indicator of compromise (domain, hash pattern, technique, behavioral signal)"
    ],
    "response_gaps": [
      "A specific gap in the incident response that delayed or complicated containment"
    ],
    "tools_implicated": [
      "Software, protocol, or platform that was exploited or misused"
    ]
  },
  "commander": {
    "summary": "Executive summary for a CISO or incident commander—3–4 sentences on business impact and strategic significance.",
    "decisions": [
      "A critical decision point faced by leadership during or after the incident, with the trade-off involved"
    ],
    "disclosure": "How and when the incident was disclosed publicly, and the reception/fallout.",
    "policy_impact": "Regulatory, legislative, or policy changes triggered or accelerated by this incident.",
    "risk_framing": "How this incident should be framed for board-level risk communication."
  },
  "hci": {
    "summary": "Analysis of the human factors, UX failures, and cognitive dimensions of this incident—3–4 sentences.",
    "failures": [
      "A specific human-computer interaction failure, interface design flaw, or UX anti-pattern that contributed to the attack or delayed response"
    ],
    "cognitive_load": "Analysis of how cognitive overload, alert fatigue, or decision-making under pressure shaped the incident.",
    "design_questions": [
      "A research or design question this incident raises for security UX practitioners"
    ],
    "research_angles": [
      "A specific HCI or UX research direction opened up by this incident"
    ]
  },
  "design_lessons": {
    "summary": "What this incident teaches us about designing more resilient, human-centered security systems—3–4 sentences.",
    "lessons": [
      "A concrete, actionable design lesson derived from this incident"
    ],
    "pattern_connections": [
      "A security UX pattern or anti-pattern (e.g., 'MFA fatigue', 'alert blindness', 'trust chain transparency') that this incident exemplifies or challenges"
    ]
  },
  "incident_timeline": {
    "summary": "A 2–3 sentence high-level narrative of how this incident unfolded from first signal to resolution — written for someone who wants to understand the human and organizational arc, not the technical details.",
    "stages": [
      {
        "stage": "Stage name — one of: Discovery, Initial Triage, Diagnosis, Escalation & Notification, Containment, Remediation, Post-Incident Review. Use only the stages that actually occurred; add intermediate stages if the incident warrants them.",
        "timestamp": "When this stage occurred — absolute date or relative label like 'Day 1', 'Week 2', 'T+6 hours'",
        "elapsed": "Time elapsed since the previous stage, e.g. 'T+0', 'T+4 hours', 'T+3 days'. Use 'T+0' for the first stage.",
        "description": "2–3 sentence non-technical narrative of what happened at this stage. Focus on the human and organizational story — who noticed what, what decisions were made, what the atmosphere was like.",
        "who_involved": [
          "Role or team involved at this stage, e.g. 'NOC engineer', 'CISO', 'FBI Cyber Division', 'Legal counsel', 'Third-party IR firm'"
        ],
        "how_spread": "One sentence describing how awareness or impact spread at this stage — internally across teams, to leadership, to external partners, to the public.",
        "cia_impacts": ["One or more of: availability, confidentiality, integrity — whichever became apparent or were confirmed at this stage"],
        "cia_rationale": "One sentence explaining what was observed at this stage that indicated each of the listed CIA impacts — e.g. 'Systems were taken offline proactively, causing service outages' or 'Exfiltrated data was confirmed to include PII, establishing a confidentiality breach'.",
        "key_action": "The single most pivotal decision or action taken at this stage."
      }
    ]
  }
}

Ensure all arrays in overview/analyst/commander/hci/design_lessons have 4–6 items. The incident_timeline.stages array should have 5–8 stages reflecting the actual arc of the incident. Be specific and evidence-based, not generic. Prioritize insights that are unique to this incident.`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const scenario = scenarios.find((s) => s.slug === slug);
  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  const supabase = getSupabaseServer();

  // ── Check cache ────────────────────────────────────────────────────────────
  const { data: cached } = await supabase
    .from("scenario_cache")
    .select("analysis, expires_at")
    .eq("scenario_id", slug)
    .single();

  if (cached && new Date(cached.expires_at) > new Date()) {
    // If cached analysis is missing incident_timeline (generated before this
    // feature was added), fall through to regenerate rather than returning
    // an incomplete object.
    const hasTimeline =
      cached.analysis &&
      typeof cached.analysis === "object" &&
      "incident_timeline" in cached.analysis;

    if (hasTimeline) {
      return NextResponse.json(cached.analysis);
    }
  }

  // ── Generate analysis via Anthropic ───────────────────────────────────────
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let analysis: Record<string, unknown>;
  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 8192,
      messages: [{ role: "user", content: buildPrompt(scenario) }],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Strip any accidental markdown fences before parsing
    const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    analysis = JSON.parse(jsonText);
  } catch (err) {
    console.error("[scenarios/route] Anthropic or parse error:", err);
    return NextResponse.json(
      { error: "Failed to generate analysis. Please try again." },
      { status: 500 }
    );
  }

  // ── Persist to cache (7-day TTL) ──────────────────────────────────────────
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error: cacheError } = await supabase
    .from("scenario_cache")
    .upsert(
      { scenario_id: slug, analysis, expires_at: expiresAt.toISOString() },
      { onConflict: "scenario_id" }
    );

  if (cacheError) {
    console.error("[scenarios/route] Cache write failed:", cacheError.message);
  }

  return NextResponse.json(analysis);
}
