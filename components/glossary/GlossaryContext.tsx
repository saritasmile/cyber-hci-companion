"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

export interface GlossaryTerm {
  id?: string;
  term: string;
  pronunciation?: string;
  definition: string;
  hci_context?: string;
  related_terms?: string[];
  got_it: boolean;
  source_scenario?: string;
}

interface GlossaryContextValue {
  terms: Record<string, GlossaryTerm>;       // keyed by lowercased term
  saveTerm: (term: GlossaryTerm) => Promise<void>;
  toggleGotIt: (termKey: string) => Promise<void>;
  isSaved: (termKey: string) => boolean;
  isLoaded: boolean;
}

const GlossaryContext = createContext<GlossaryContextValue | null>(null);

export function GlossaryProvider({ children }: { children: React.ReactNode }) {
  const [terms, setTerms] = useState<Record<string, GlossaryTerm>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const userIdRef = useRef<string | null>(null);

  // Load all saved terms for the current user on mount
  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsLoaded(true); return; }
        userIdRef.current = user.id;

        const { data, error } = await supabase
          .from("glossary_terms")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;

        const map: Record<string, GlossaryTerm> = {};
        for (const row of data ?? []) {
          map[row.term.toLowerCase()] = {
            id: row.id,
            term: row.term,
            pronunciation: row.pronunciation,
            definition: row.definition,
            hci_context: row.hci_context,
            related_terms: row.related_terms ?? [],
            got_it: row.got_it,
            source_scenario: row.source_scenario,
          };
        }
        setTerms(map);
      } catch (err) {
        console.error("[Glossary] Failed to load terms:", err);
      } finally {
        setIsLoaded(true);
      }
    }
    load();
  }, []);

  const saveTerm = useCallback(async (term: GlossaryTerm) => {
    const key = term.term.toLowerCase();
    const userId = userIdRef.current;
    if (!userId) return;

    // Optimistic update
    setTerms((prev) => ({ ...prev, [key]: { ...term, got_it: false } }));

    try {
      const { data, error } = await supabase
        .from("glossary_terms")
        .upsert({
          user_id: userId,
          term: term.term,
          pronunciation: term.pronunciation ?? null,
          definition: term.definition,
          hci_context: term.hci_context ?? null,
          related_terms: term.related_terms ?? [],
          got_it: false,
          source_scenario: term.source_scenario ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,term" })
        .select("id")
        .single();

      if (error) throw error;

      setTerms((prev) => ({
        ...prev,
        [key]: { ...prev[key], id: data.id },
      }));
    } catch (err) {
      console.error("[Glossary] Failed to save term:", err);
      // Rollback optimistic update
      setTerms((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, []);

  const toggleGotIt = useCallback(async (termKey: string) => {
    const key = termKey.toLowerCase();
    const existing = terms[key];
    if (!existing || !existing.id) return;

    const newVal = !existing.got_it;

    // Optimistic update
    setTerms((prev) => ({
      ...prev,
      [key]: { ...prev[key], got_it: newVal },
    }));

    try {
      const { error } = await supabase
        .from("glossary_terms")
        .update({ got_it: newVal, updated_at: new Date().toISOString() })
        .eq("id", existing.id);

      if (error) throw error;
    } catch (err) {
      console.error("[Glossary] Failed to toggle got_it:", err);
      // Rollback
      setTerms((prev) => ({
        ...prev,
        [key]: { ...prev[key], got_it: existing.got_it },
      }));
    }
  }, [terms]);

  const isSaved = useCallback((termKey: string) => {
    return termKey.toLowerCase() in terms;
  }, [terms]);

  return (
    <GlossaryContext.Provider value={{ terms, saveTerm, toggleGotIt, isSaved, isLoaded }}>
      {children}
    </GlossaryContext.Provider>
  );
}

export function useGlossary() {
  const ctx = useContext(GlossaryContext);
  if (!ctx) throw new Error("useGlossary must be used inside GlossaryProvider");
  return ctx;
}
