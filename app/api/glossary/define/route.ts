import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { term, context, sourceScenario } = await req.json();
    if (!term || typeof term !== "string") {
      return NextResponse.json({ error: "term required" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are a glossary writer for a cybersecurity learning tool aimed at HCI/UX designers — people with strong design intuition but limited security background.

Define the term "${term}" in the context of cybersecurity.${context ? `\n\nHere is the sentence/passage where the reader encountered it:\n"""${context}"""` : ""}

Return ONLY a JSON object with exactly these fields (no markdown, no extra keys):
{
  "term": "the canonical name for the term, properly capitalized (e.g. 'Multi-Factor Authentication' not 'mfa')",
  "pronunciation": "phonetic pronunciation in brackets, e.g. [ran-sum-WAIR] — omit if obvious",
  "definition": "2-3 sentence plain English definition. No jargon. Imagine explaining to a UX designer. Use an analogy if helpful.",
  "hci_context": "1-2 sentences on why this term matters specifically from an HCI or UX design perspective — interface failures, cognitive load, decision-making under pressure, etc.",
  "related_terms": ["array", "of", "3-5", "related", "cybersecurity", "terms"]
}`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleaned);

    return NextResponse.json({
      term: data.term ?? term,
      pronunciation: data.pronunciation ?? "",
      definition: data.definition ?? "",
      hci_context: data.hci_context ?? "",
      related_terms: data.related_terms ?? [],
      got_it: false,
      source_scenario: sourceScenario ?? null,
    });
  } catch (err) {
    console.error("[glossary/define]", err);
    return NextResponse.json({ error: "Failed to generate definition" }, { status: 500 });
  }
}
