"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = searchParams.get("next") ?? "/";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        document.cookie = "cyber-hci-session=auth; path=/; max-age=2592000; SameSite=Lax";
        router.replace(nextPath);
      }
    });
  }, [nextPath, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true); setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authError) throw authError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send magic link. Please try again.");
    } finally { setLoading(false); }
  }

  function handleGuest() {
    document.cookie = "cyber-hci-session=guest; path=/; max-age=2592000; SameSite=Lax";
    router.replace(nextPath === "/auth" ? "/" : nextPath);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="mb-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] mb-2"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
            Learning Companion
          </p>
          <h1 className="text-2xl" style={{ fontFamily: "var(--font-heading)", fontWeight: 500, color: "var(--text)" }}>
            Cyber <span style={{ color: "var(--oak)" }}>×</span> HCI
          </h1>
        </div>

        {/* Card */}
        <div className="card p-6">
          {sent ? (
            <div className="text-center py-2">
              <div className="w-8 h-8 rounded-full border flex items-center justify-center mx-auto mb-4"
                style={{ borderColor: "var(--leaf-bdr)", backgroundColor: "var(--leaf-bg)" }}>
                <span style={{ color: "var(--leaf)", fontSize: "14px" }}>✓</span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] mb-3"
                style={{ fontFamily: "var(--font-mono)", color: "var(--leaf)" }}>
                Check your inbox
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-mid)", lineHeight: 1.65 }}>
                We sent a magic link to <span style={{ color: "var(--text)" }}>{email}</span>. Click the link to complete sign-in.
              </p>
              <button onClick={() => setSent(false)}
                className="mt-4 text-[10px] transition-colors"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
                Use a different email →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-[10px] uppercase tracking-[0.2em] mb-2"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
                Sign in to save your progress
              </p>

              <div>
                <label htmlFor="email" className="block text-[9px] uppercase tracking-[0.2em] mb-2"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
                  Email address
                </label>
                <input
                  id="email" type="email" autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 outline-none transition-all"
                  style={{ fontFamily: "var(--font-body)", fontSize: "14px", backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "2px", color: "var(--text)" }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--border-strong)"; e.target.style.boxShadow = "0 0 0 3px rgba(26,22,20,0.06)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                  disabled={loading}
                />
              </div>

              {error && (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--clay)", lineHeight: 1.5 }}>{error}</p>
              )}

              <button
                type="submit" disabled={!email.trim() || loading}
                className="w-full py-3 uppercase tracking-[0.15em] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ fontFamily: "var(--font-mono)", fontSize: "9px", backgroundColor: "var(--oak-bg)", border: "1px solid var(--oak-bdr)", borderRadius: "2px", color: "var(--oak)" }}
              >
                {loading ? "Sending…" : "Send Magic Link →"}
              </button>
            </form>
          )}
        </div>

        {/* Guest mode */}
        <div className="mt-5 text-center">
          <p className="text-[10px] mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
            Don&apos;t want to sign in?
          </p>
          <button onClick={handleGuest}
            className="text-[11px] pb-0.5 transition-colors border-b"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-mid)", borderColor: "var(--border)" }}>
            Continue as guest (exploration only)
          </button>
          <p className="text-[9px] mt-1.5" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
            Knowledge map and saved notes require an account
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return <Suspense><AuthForm /></Suspense>;
}
