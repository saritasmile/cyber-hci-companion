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

const BRIEFING_PROMPT = `You are a senior cybersecurity analyst and HCI researcher helping a UX designer learn about the cybersecurity operations industry. Write a landscape briefing that covers what's happening right now in cybersecurity security operations — especially AI-powered SOC tools, agentic AI for threat detection and response, and the analyst experience.

Your audience is a UX/HCI designer with limited cybersecurity background. Write in a conversational, accessible style — laymen's terms with technical specifics where they matter. Use a warm, informed tone like a knowledgeable colleague briefing you over coffee.

Return ONLY a JSON object — no markdown fences, no preamble, no trailing text.

Required structure:
{
  "title": "A compelling headline summarizing the current moment (e.g. 'The race to build AI SOC analysts is reshaping security operations')",
  "paragraphs": [
    "Each paragraph as a separate string. Include 4-5 paragraphs total.",
    "Paragraph 1: The biggest shift happening right now — what's the headline trend?",
    "Paragraph 2: What the major incumbents (Cisco/Splunk, Palo Alto, CrowdStrike, Microsoft, Google) are doing",
    "Paragraph 3: What the AI-native startups (Dropzone AI, Radiant Security, Prophet Security, etc.) are doing differently",
    "Paragraph 4: The human problems that haven't been solved — analyst pain points, burnout stats, alert fatigue numbers",
    "Paragraph 5: The core design challenge — where HCI has the most to contribute"
  ],
  "stats": [
    { "value": "100+", "label": "A key stat with short label" }
  ],
  "generated_at": "ISO timestamp"
}

Be specific with numbers, company names, and product names. Include recent developments from 2025-2026. The stats array should have exactly 4 items — the most impactful numbers for understanding the landscape. Make bold claims from the designer-vendor names and reference real products.`;

export async function GET(_request: NextRequest) {
  const supabase = getSupabaseServer();

  // ── Check cache ──────────────────────────────────────────────────────────
  const { data: cached } = await supabase
    .from("intel_briefing_cache")
    .select("briefing, expires_at")
    .eq("id", "latest")
    .single();

  if (cached && new Date(cached.expires_at) > new Date()) {
    return NextResponse.json(cached.briefing);
  }

  // ── Generate via Anthropic ───────────────────────────────────────────────
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let briefing: Record<string, unknown>;
  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: BRIEFING_PROMPT }],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text : "";
    const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    briefing = JSON.parse(jsonText);
  } catch (err) {
    console.error("[intel-briefing/route] Anthropic or parse error:", err);
    return NextResponse.json(
      { error: "Failed to generate briefing. Please try again." },
      { status: 500 }
    );
  }

  // ── Persist to cache (3-day TTL) ─────────────────────────────────────────
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 3);

  const { error: cacheError } = await supabase
    .from("intel_briefing_cache")
    .upsert(
      { id: "latest", briefing, expires_at: expiresAt.toISOString() },
      { onConflict: "id" }
    );

  if (cacheError) {
    console.error("[intel-briefing/route] Cache write failed:", cacheError.message);
  }

  return NextResponse.json(briefing);
}

// POST forces a refresh (busts cache)
export async function POST(_request: NextRequest) {
  const supabase = getSupabaseServer();

  // Delete existing cache to force regeneration
  await supabase
    .from("intel_briefing_cache")
    .delete()
    .eq("id", "latest");

  // ── Generate via Anthropic ───────────────────────────────────────────────
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let briefing: Record<string, unknown>;
  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: BRIEFING_PROMPT }],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text : "";
    const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    briefing = JSON.parse(jsonText);
  } catch (err) {
    console.error("[intel-briefing/route] Anthropic or parse error:", err);
    return NextResponse.json(
      { error: "Failed to generate briefing. Please try again." },
      { status: 500 }
    );
  }

  // ── Persist to cache (3-day TTL) ─────────────────────────────────────────
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 3);

  await supabase
    .from("intel_briefing_cache")
    .upsert(
      { id: "latest", briefing, expires_at: expiresAt.toISOString() },
      { onConflict: "id" }
    );

  return NextResponse.json(briefing);
}
