import Anthropic from "@anthropic-ai/sdk";

// Server-side only — never import this in client components
if (typeof window !== "undefined") {
  throw new Error("lib/anthropic.ts must only be used on the server.");
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
