"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { DefinitionCard } from "./DefinitionCard";
import { GlossaryTerm } from "./GlossaryContext";

interface JargonSpan {
  text: string;
  isJargon: boolean;
  termKey?: string;   // the canonical term name (may differ from text)
}

interface ActiveDef {
  termData: GlossaryTerm;
  anchorRect: DOMRect;
}

interface JargonTextProps {
  text: string;
  sourceScenario?: string;
  /** Wrapper element style */
  style?: React.CSSProperties;
  /** Pass className through to wrapper */
  className?: string;
}

// Cache: scenarioText+termText → GlossaryTerm, so we don't re-fetch on every render
const defCache = new Map<string, GlossaryTerm>();
// Cache: text blob → identified spans, so we don't re-identify on re-renders
const spanCache = new Map<string, JargonSpan[]>();

export function JargonText({ text, sourceScenario, style, className }: JargonTextProps) {
  const [spans, setSpans] = useState<JargonSpan[]>([{ text, isJargon: false }]);
  const [activeDef, setActiveDef] = useState<ActiveDef | null>(null);
  const [loadingTerm, setLoadingTerm] = useState<string | null>(null);
  const [highlightBtn, setHighlightBtn] = useState<{ x: number; y: number; text: string } | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const identifiedRef = useRef(false);

  // Step 1: Ask AI to identify jargon terms in this text
  useEffect(() => {
    if (identifiedRef.current || !text.trim()) return;
    identifiedRef.current = true;

    const cacheKey = text.slice(0, 120);
    if (spanCache.has(cacheKey)) {
      setSpans(spanCache.get(cacheKey)!);
      return;
    }

    async function identify() {
      try {
        const res = await fetch("/api/glossary/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) return; // fail silently — plain text is fine

        const { terms }: { terms: string[] } = await res.json();
        if (!terms.length) return;

        // Build spans by splitting text around identified terms
        const result = buildSpans(text, terms);
        spanCache.set(cacheKey, result);
        setSpans(result);
      } catch {
        // fail silently
      }
    }
    identify();
  }, [text]);

  // Fetch definition for a term (with cache)
  const fetchDef = useCallback(async (termText: string, anchorRect: DOMRect) => {
    const cacheKey = termText.toLowerCase();
    if (defCache.has(cacheKey)) {
      setActiveDef({ termData: defCache.get(cacheKey)!, anchorRect });
      return;
    }

    setLoadingTerm(termText);
    try {
      const res = await fetch("/api/glossary/define", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: termText, context: text.slice(0, 400), sourceScenario }),
      });
      if (!res.ok) throw new Error("define failed");
      const data: GlossaryTerm = await res.json();
      defCache.set(cacheKey, data);
      setActiveDef({ termData: data, anchorRect });
    } catch {
      // Show a minimal card even on failure
      const fallback: GlossaryTerm = {
        term: termText,
        definition: "Definition unavailable — please try again.",
        got_it: false,
      };
      setActiveDef({ termData: fallback, anchorRect });
    } finally {
      setLoadingTerm(null);
    }
  }, [text, sourceScenario]);

  // Handle highlight-to-define
  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    const selected = sel?.toString().trim() ?? "";
    if (selected.length < 3 || selected.length > 80) {
      setHighlightBtn(null);
      return;
    }
    const range = sel!.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setHighlightBtn({
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY - 40,
      text: selected,
    });
  }, []);

  // Clear highlight button on outside click
  useEffect(() => {
    function handleDown(e: MouseEvent) {
      const btn = document.getElementById("jargon-highlight-btn");
      if (btn && !btn.contains(e.target as Node)) setHighlightBtn(null);
    }
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, []);

  return (
    <>
      <span
        ref={containerRef}
        style={{ position: "relative", ...style }}
        className={className}
        onMouseUp={handleMouseUp}
      >
        {spans.map((span, i) =>
          span.isJargon ? (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                fetchDef(span.termKey ?? span.text, rect);
              }}
              style={{
                display: "inline",
                background: "none",
                border: "none",
                padding: 0,
                margin: 0,
                font: "inherit",
                color: loadingTerm === (span.termKey ?? span.text)
                  ? "var(--text-dim)"
                  : "var(--pool, #3d7a8a)",
                borderBottom: "1px dotted var(--pool, #3d7a8a)",
                cursor: "pointer",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "var(--commander-bg, #e8f0fa)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "none";
              }}
            >
              {span.text}
            </button>
          ) : (
            <span key={i}>{span.text}</span>
          )
        )}
      </span>

      {/* Highlight-to-define button — portaled to body to avoid invalid nesting inside <p> */}
      {highlightBtn && createPortal(
        <button
          id="jargon-highlight-btn"
          onClick={() => {
            const fakeRect = {
              left: highlightBtn.x - 50,
              right: highlightBtn.x + 50,
              top: highlightBtn.y + 40,
              bottom: highlightBtn.y + 56,
              width: 100,
              height: 16,
              x: highlightBtn.x - 50,
              y: highlightBtn.y + 40,
              toJSON: () => {},
            } as DOMRect;
            setHighlightBtn(null);
            fetchDef(highlightBtn.text, fakeRect);
          }}
          style={{
            position: "absolute",
            left: highlightBtn.x,
            top: highlightBtn.y,
            transform: "translateX(-50%)",
            background: "var(--text, #18140f)",
            color: "var(--bg, #f7f5f2)",
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "5px 10px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            zIndex: 150,
            whiteSpace: "nowrap",
          }}
        >
          Define ↗
        </button>,
        document.body
      )}

      {/* Definition card — portaled to body to avoid invalid nesting inside <p> */}
      {activeDef && createPortal(
        <DefinitionCard
          termData={activeDef.termData}
          anchorRect={activeDef.anchorRect}
          sourceScenario={sourceScenario}
          onClose={() => setActiveDef(null)}
          onRelatedClick={(related) => {
            fetchDef(related, activeDef.anchorRect);
          }}
        />,
        document.body
      )}
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Split text into spans, marking identified jargon terms.
 * Case-insensitive match, preserves original casing in output.
 */
function buildSpans(text: string, terms: string[]): JargonSpan[] {
  if (!terms.length) return [{ text, isJargon: false }];

  // Sort by length descending so longer phrases match before shorter substrings
  const sorted = [...terms].sort((a, b) => b.length - a.length);
  const pattern = sorted.map(escapeRegex).join("|");
  const regex = new RegExp(`(${pattern})`, "gi");

  const parts = text.split(regex);
  const termSet = new Set(sorted.map((t) => t.toLowerCase()));

  return parts.map((part) => {
    const isJargon = termSet.has(part.toLowerCase());
    return { text: part, isJargon, termKey: isJargon ? part : undefined };
  }).filter((s) => s.text.length > 0);
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
