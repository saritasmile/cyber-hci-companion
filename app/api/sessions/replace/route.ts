import Anthropic from "@anthropic-ai/sdk";
import { resources } from "@/lib/resources";

const DURATION_BY_TYPE: Record<string, string> = {
  book:    "15 min",
  course:  "20 min",
  tool:    "10 min",
  youtube: "15 min",
  reddit:  "5 min",
  expert:  "5 min",
};

export async function POST(request: Request) {
  const { item, sessionTitle, sessionDescription, excludeIds, excludeUrls } = await request.json();

  if (!item || typeof item !== "object") {
    return Response.json({ error: "item is required" }, { status: 400 });
  }

  const idSet = new Set<string>(excludeIds ?? []);
  const urlSet = new Set<string>(excludeUrls ?? []);

  const available = resources
    .filter(r => !idSet.has(r.id) && !urlSet.has(r.url))
    .map(r => ({
      id: r.id,
      type: r.type,
      title: r.title,
      author: r.author,
      description: r.description,
      topics: r.topics,
    }));

  if (available.length === 0) {
    return Response.json({ error: "No replacement resources available" }, { status: 404 });
  }

  const prompt = `You are a cybersecurity learning curator. A resource in a learning session is broken or unavailable and needs a replacement.

Session: "${sessionTitle ?? "Learning session"}"
${sessionDescription ? `Session description: ${sessionDescription}` : ""}

The broken resource was:
- Title: ${item.title}
- Type: ${item.type}
- Description: ${item.description}
${item.reason ? `- Why it was included: ${item.reason}` : ""}

Available replacement resources (JSON):
${JSON.stringify(available, null, 2)}

Pick exactly ONE resource that best replaces the broken one — covering similar topics, ideally the same type if available.

Return ONLY a JSON object — no markdown fences, no preamble:
{
  "id": "exact resource id from the catalog above",
  "reason": "1 sentence explaining why this replacement covers the same ground as the broken resource"
}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    let raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(raw) as { id: string; reason: string };

    const resource = resources.find(r => r.id === parsed.id);
    if (!resource) {
      return Response.json({ error: "Suggested resource not found in catalog" }, { status: 404 });
    }

    return Response.json({
      id: resource.id,
      type: resource.type,
      title: resource.title,
      author: resource.author,
      description: resource.description,
      url: resource.url,
      duration: DURATION_BY_TYPE[resource.type] ?? "10 min",
      reason: parsed.reason,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[sessions/replace] error:", msg);
    return Response.json({ error: `Replacement failed: ${msg}` }, { status: 500 });
  }
}
