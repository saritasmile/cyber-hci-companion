"use client";

import { useEffect, useRef } from "react";
import { useGlossary, GlossaryTerm } from "./GlossaryContext";

interface DefinitionCardProps {
  termData: GlossaryTerm;
  anchorRect: DOMRect;
  sourceScenario?: string;
  onClose: () => void;
  onRelatedClick: (term: string) => void;
}

export function DefinitionCard({
  termData,
  anchorRect,
  sourceScenario,
  onClose,
  onRelatedClick,
}: DefinitionCardProps) {
  const { saveTerm, toggleGotIt, isSaved, terms } = useGlossary();
  const cardRef = useRef<HTMLDivElement>(null);
  const key = termData.term.toLowerCase();
  const saved = isSaved(key);
  const gotIt = terms[key]?.got_it ?? false;

  // Position the card near the anchor, keeping it in viewport
  const style = useRef<React.CSSProperties>({});
  (() => {
    const CARD_W = 340;
    const CARD_H = 340; // approximate
    const MARGIN = 12;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;

    let left = anchorRect.left + anchorRect.width / 2 - CARD_W / 2;
    let top = anchorRect.bottom + MARGIN + window.scrollY;

    // Clamp horizontally
    left = Math.max(MARGIN, Math.min(left, vw - CARD_W - MARGIN));

    // Flip above if it would go off bottom
    if (anchorRect.bottom + CARD_H + MARGIN > vh) {
      top = anchorRect.top - CARD_H - MARGIN + window.scrollY;
    }

    style.current = { position: "absolute", top, left, width: CARD_W, zIndex: 200 };
  })();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Delay to avoid closing immediately on the click that opened the card
    const t = setTimeout(() => document.addEventListener("mousedown", handleClick), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handleClick); };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSave() {
    await saveTerm({ ...termData, source_scenario: sourceScenario });
  }

  return (
    <div ref={cardRef} style={style.current}>
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 16px 12px",
          borderBottom: "1px solid var(--border)",
          background: "var(--commander-bg, #e8f0fa)",
        }}>
          <div style={{
            fontFamily: "var(--font-heading)",
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--commander, #1a4e8a)",
            lineHeight: 1.2,
            marginBottom: 3,
          }}>
            {termData.term}
          </div>
          {termData.pronunciation && (
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              color: "var(--commander, #1a4e8a)",
              opacity: 0.7,
            }}>
              {termData.pronunciation}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={sectionLabel}>Plain English</div>
            <div style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.65 }}>
              {termData.definition}
            </div>
          </div>

          {termData.hci_context && (
            <div>
              <div style={sectionLabel}>Why it matters for HCI / UX</div>
              <div style={{
                fontSize: 12,
                color: "var(--text-mid)",
                lineHeight: 1.6,
                background: "var(--hci-bg, #fdf0e8)",
                borderLeft: "2px solid var(--hci-bdr, #f0c4a0)",
                padding: "7px 10px",
              }}>
                {termData.hci_context}
              </div>
            </div>
          )}

          {termData.related_terms && termData.related_terms.length > 0 && (
            <div>
              <div style={sectionLabel}>Related terms</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {termData.related_terms.map((r) => (
                  <button
                    key={r}
                    onClick={() => onRelatedClick(r)}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 8,
                      padding: "2px 7px",
                      border: "1px solid var(--border)",
                      background: "var(--commander-bg, #e8f0fa)",
                      color: "var(--commander, #1a4e8a)",
                      cursor: "pointer",
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "10px 16px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={handleSave}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "5px 11px",
                border: `1px solid ${saved ? "var(--analyst-bdr, #b0dbd4)" : "var(--border)"}`,
                background: saved ? "var(--analyst-bg, #e8f5f2)" : "transparent",
                color: saved ? "var(--analyst, #0a7a68)" : "var(--text-dim)",
                cursor: saved ? "default" : "pointer",
              }}
            >
              {saved ? "✓ Saved" : "+ Save to glossary"}
            </button>

            {saved && (
              <button
                onClick={() => toggleGotIt(key)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "5px 11px",
                  border: `1px solid ${gotIt ? "var(--analyst-bdr, #b0dbd4)" : "var(--border)"}`,
                  background: gotIt ? "var(--analyst-bg, #e8f5f2)" : "transparent",
                  color: gotIt ? "var(--analyst, #0a7a68)" : "var(--text-dim)",
                  cursor: "pointer",
                }}
              >
                {gotIt ? "✓ Got it" : "Got it?"}
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--text-dim)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "5px",
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 8,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--text-dim)",
  marginBottom: 4,
};
