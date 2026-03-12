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

  // If already signed in, set cookie and redirect
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
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (authError) throw authError;
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send magic link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleGuest() {
    document.cookie = "cyber-hci-session=guest; path=/; max-age=2592000; SameSite=Lax";
    router.replace(nextPath === "/auth" ? "/" : nextPath);
  }

  return (
    <div className="min-h-screen bg-[#0f0e0d] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-8 text-center">
          <p
            className="text-[10px] uppercase tracking-[0.3em] text-[#9d9080] mb-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Learning Companion
          </p>
          <h1
            className="text-2xl font-bold text-[#e8e0d4]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Cyber <span className="text-[#c9a96e]">×</span> HCI
          </h1>
        </div>

        {/* Card */}
        <div className="bg-[#161412] border border-[#2a2520] rounded-lg p-6">
          {sent ? (
            /* ── Sent state ── */
            <div className="text-center py-2">
              <div
                className="w-8 h-8 rounded-full border flex items-center justify-center mx-auto mb-4"
                style={{ borderColor: "#4eb8a040", backgroundColor: "#4eb8a010" }}
              >
                <span className="text-[#4eb8a0] text-sm">✓</span>
              </div>
              <p
                className="text-[10px] uppercase tracking-[0.2em] text-[#4eb8a0] mb-3"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Check your inbox
              </p>
              <p className="text-sm text-[#9d9080] leading-relaxed">
                We sent a magic link to{" "}
                <span className="text-[#e8e0d4]">{email}</span>.{" "}
                Click the link to complete sign-in.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-[10px] text-[#9d9080] hover:text-[#e8e0d4] transition-colors"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Use a different email →
              </button>
            </div>
          ) : (
            /* ── Sign-in form ── */
            <form onSubmit={handleSubmit} className="space-y-4">
              <p
                className="text-[10px] uppercase tracking-[0.2em] text-[#9d9080] mb-2"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Sign in to save your progress
              </p>

              <div>
                <label
                  htmlFor="email"
                  className="block text-[9px] uppercase tracking-[0.2em] text-[#9d9080] mb-2"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#0f0e0d] border border-[#2a2520] rounded-lg px-4 py-3 text-sm text-[#e8e0d4] placeholder-[#4a4540] outline-none focus:border-[#c9a96e] transition-colors"
                  style={{ fontFamily: "var(--font-body)" }}
                  disabled={loading}
                />
              </div>

              {error && (
                <p
                  className="text-xs text-[#e8854a] leading-relaxed"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!email.trim() || loading}
                className="w-full py-3 rounded-lg text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "var(--font-mono)",
                  backgroundColor: "#c9a96e15",
                  border: "1px solid #c9a96e",
                  color: "#c9a96e",
                }}
              >
                {loading ? "Sending…" : "Send Magic Link →"}
              </button>
            </form>
          )}
        </div>

        {/* Guest mode */}
        <div className="mt-5 text-center">
          <p
            className="text-[10px] text-[#4a4540] mb-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Don&apos;t want to sign in?
          </p>
          <button
            onClick={handleGuest}
            className="text-[11px] text-[#9d9080] hover:text-[#e8e0d4] transition-colors border-b border-[#2a2520] hover:border-[#9d9080] pb-0.5"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Continue as guest (exploration only)
          </button>
          <p
            className="text-[9px] text-[#4a4540] mt-1.5"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Knowledge map and saved notes require an account
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
