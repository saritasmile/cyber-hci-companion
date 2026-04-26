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

const RESOURCE_CATALOG = resources.map(r => ({
  id: r.id,
  type: r.type,
  title: r.title,
  author: r.author,
  description: r.description,
  topics: r.topics,
}));

export async function POST(request: Request) {
  const { query, time } = await request.json();

  if (!query || typeof query !== "string") {
    return Response.json({ error: "query is required" }, { status: 400 });
  }

  const timeLabel = time === "15" ? "15 minutes" : "1 hour";
  const itemCount = time === "15" ? 3 : 5;

  const prompt = `You are a cybersecurity learning curator. A student wants to learn about: "${query}"
They have ${timeLabel} available.

Here is the full resource catalog as JSON:
${JSON.stringify(RESOURCE_CATALOG, null, 2)}

Select exactly ${itemCount} resources from the catalog that best match the topic. Prefer variety across types (book, youtube, course, expert, etc.).

Return ONLY a JSON object — no markdown fences, no preamble:
{
  "title": "A concise, specific session title (not just the query verbatim)",
  "description": "1–2 sentences describing what this session covers and what the learner will gain",
  "items": [
    {
      "id": "exact resource id from catalog",
      "reason": "1 sentence explaining why this resource is relevant to the query"
    }
  ]
}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    let raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    // Strip markdown fences if present
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(raw) as {
      title: string;
      description: string;
      items: { id: string; reason: string }[];
    };

    const sessionItems = parsed.items
      .map(pick => {
        const resource = resources.find(r => r.id === pick.id);
        if (!resource) return null;
        return {
          id: resource.id,
          type: resource.type,
          title: resource.title,
          author: resource.author,
          description: resource.description,
          url: resource.url,
          duration: DURATION_BY_TYPE[resource.type] ?? "10 min",
          reason: pick.reason,
        };
      })
      .filter(Boolean);

    const totalMins = sessionItems.reduce((sum, item) => {
      const mins = parseInt(item!.duration) || 10;
      return sum + mins;
    }, 0);

    return Response.json({
      id: `custom-${Date.now()}`,
      title: parsed.title,
      description: parsed.description,
      type: "ai",
      duration: `~${totalMins} min`,
      item_count: sessionItems.length,
      items: sessionItems,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[sessions/generate] error:", msg);
    return Response.json({ error: `Generation failed: ${msg}` }, { status: 500 });
  }
}
