import Anthropic from "@anthropic-ai/sdk";

const DEPTH_LABELS: Record<string, string> = {
  overview: "a high-level overview suitable for someone new to the topic",
  working_knowledge: "working knowledge suitable for a practitioner who needs to apply this concept",
  deep_dive: "an expert-level deep dive with technical depth and nuance",
};

function buildPrompt(topic: string, depth: string): string {
  const depthLabel = DEPTH_LABELS[depth] ?? DEPTH_LABELS.overview;
  return `You are a senior cybersecurity researcher and HCI/UX specialist. A student wants to learn about the following topic at the level of ${depthLabel}.

Topic: ${topic}

Provide a structured learning response as a JSON object. Return ONLY the JSON object—no markdown fences, no preamble, no trailing text.

Required structure:
{
  "analyst": {
    "summary": "3–4 sentence technical summary of this topic from a security analyst or practitioner perspective. Be concrete and specific to the topic.",
    "concepts": [
      "A key technical concept, term, or mechanism the learner must understand"
    ],
    "tools": [
      "A specific tool, framework, protocol, or resource relevant to this topic"
    ]
  },
  "hci": {
    "summary": "3–4 sentence analysis of this topic through a human-computer interaction or UX lens. How does it affect users, operators, or system designers?",
    "challenges": [
      "A specific human factor, cognitive challenge, or UX problem associated with this topic"
    ],
    "design_questions": [
      "An open design or research question this topic raises for security UX practitioners"
    ]
  },
  "reflect": [
    "A thought-provoking reflective question to deepen understanding of this topic"
  ]
}

Ensure analyst.concepts has 4–6 items, analyst.tools has 3–5 items, hci.challenges has 4–6 items, hci.design_questions has 3–5 items, and reflect has 4–6 questions. Be specific to "${topic}" — avoid generic platitudes.`;
}

export async function POST(request: Request) {
  const { topic, depth } = await request.json();

  if (!topic || typeof topic !== "string") {
    return new Response(JSON.stringify({ error: "Topic is required" }), {
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
          max_tokens: 2048,
          messages: [{ role: "user", content: buildPrompt(topic, depth ?? "overview") }],
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
        console.error("[study/route] Anthropic stream error:", err);
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
