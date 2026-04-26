import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ terms: [] });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `You are helping an HCI/UX designer learn cybersecurity vocabulary.

Read this text and identify terms that would be unfamiliar to someone with a design background but no security background. Focus on technical jargon, acronyms, and domain-specific phrases.

Return ONLY a JSON array of the exact strings as they appear in the text — no explanations, no markdown, no extra keys. Return an empty array if there are no jargon terms.

Rules:
- Include: technical acronyms (VPN, MFA, IOC), attack techniques (lateral movement, ransomware), security concepts (threat actor, intrusion vector), infrastructure terms (SCADA, OT network)
- Exclude: common English words, general tech terms everyone knows (email, password, server), proper nouns that are names (Colonial Pipeline, DarkSide is ok since it's a threat actor group name)
- Prefer multi-word phrases over individual words when the phrase is the jargon unit (e.g. "lateral movement" not just "movement")
- Max 8 terms per text block

Text:
"""
${text.slice(0, 1000)}
"""

Respond with only the JSON array, e.g.: ["ransomware", "lateral movement", "MFA"]`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "[]";

    // Strip markdown fences if present
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const terms: string[] = JSON.parse(cleaned);

    return NextResponse.json({ terms: Array.isArray(terms) ? terms : [] });
  } catch (err) {
    console.error("[glossary/identify]", err);
    return NextResponse.json({ terms: [] });
  }
}
