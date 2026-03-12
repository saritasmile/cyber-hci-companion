import Anthropic from "@anthropic-ai/sdk";

function buildPrompt(keyword: string): string {
  return `You are a senior cybersecurity researcher and HCI/UX specialist with a talent for finding unexpected connections. A learner is exploring the concept: "${keyword}"

Provide a structured exploration response as a JSON object. Return ONLY the JSON object—no markdown fences, no preamble, no trailing text.

Required structure:
{
  "summary": "3–4 sentence explanation of this concept. What it is, why it matters, and its significance in the cybersecurity and/or HCI landscape.",
  "analyst_note": "2–3 sentences of insight from a security analyst perspective — technical significance, threat relevance, or operational implication.",
  "hci_note": "2–3 sentences of insight from an HCI/UX perspective — how this concept affects human behavior, design, or usability in security contexts.",
  "related": [
    "A related concept, adjacent topic, or connected idea worth exploring next"
  ],
  "rabbit": "A surprising, non-obvious connection this concept has to another field, historical event, emerging trend, or counter-intuitive implication. Make this genuinely unexpected and intellectually stimulating — 2–3 sentences."
}

Ensure "related" has exactly 5 items. Each should be a concise label (2–5 words) suitable for a clickable pill button. Be specific to "${keyword}" — surface connections that are genuinely illuminating, not generic.`;
}

export async function POST(request: Request) {
  const { keyword } = await request.json();

  if (!keyword || typeof keyword !== "string") {
    return new Response(JSON.stringify({ error: "Keyword is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 1024,
          messages: [{ role: "user", content: buildPrompt(keyword) }],
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } catch (err) {
        console.error("[rabbit/route] Anthropic stream error:", err);
        controller.enqueue(
          encoder.encode(JSON.stringify({ error: "Generation failed. Please try again." }))
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
