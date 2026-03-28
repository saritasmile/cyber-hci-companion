import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { resources } from "@/lib/resources";

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const userId = authHeader?.replace("Bearer ", "");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServer();

  // Fetch explored scenarios for this user
  const { data: explored } = await supabase
    .from("knowledge_map_entries")
    .select("topic, visit_count, last_visited")
    .eq("user_id", userId)
    .eq("module", "scenario")
    .order("last_visited", { ascending: false })
    .limit(10);

  if (!explored || explored.length === 0) {
    return NextResponse.json({ suggestions: [], reason: "no_history" });
  }

  // Fetch already-progressed resources so we can exclude them
  const { data: progressed } = await supabase
    .from("resource_progress")
    .select("resource_id, status")
    .eq("user_id", userId);

  const excludedIds = new Set(
    (progressed ?? [])
      .filter((p) => p.status === "not_interested" || p.status === "completed")
      .map((p) => p.resource_id)
  );

  const availableResources = resources.filter((r) => !excludedIds.has(r.id));

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are a cybersecurity learning advisor helping a UX designer and researcher deepen their knowledge.

The user has recently explored these scenarios (most recent first):
${explored.map((e) => `- ${e.topic} (visited ${e.visit_count} time${e.visit_count !== 1 ? "s" : ""})`).join("\n")}

Here is the available resource library (as JSON):
${JSON.stringify(availableResources.map((r) => ({ id: r.id, type: r.type, title: r.title, topics: r.topics, description: r.description })), null, 2)}

Select the 5 most relevant resources from this library for this user based on their explored scenarios. Prioritize variety across resource types.

Return ONLY a JSON array of objects — no markdown fences, no preamble:
[
  {
    "id": "resource id from the library",
    "reason": "One sentence explaining why this is relevant to their specific explored scenarios"
  }
]`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const suggestions = JSON.parse(jsonText) as { id: string; reason: string }[];

    return NextResponse.json({ suggestions, explored: explored.map((e) => e.topic) });
  } catch (err) {
    console.error("[resources/suggest] Error:", err);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}
