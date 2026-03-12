"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function Dots() {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full animate-bounce"
          style={{ backgroundColor: "#c9a96e", animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          document.cookie =
            "cyber-hci-session=auth; path=/; max-age=2592000; SameSite=Lax";
        }
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          document.cookie =
            "cyber-hci-session=auth; path=/; max-age=2592000; SameSite=Lax";
        }
      }

      router.replace("/");
    }

    handleCallback();
  }, [router, searchParams]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-[#0f0e0d] flex items-center justify-center">
      <div className="text-center space-y-3">
        <Suspense fallback={<Dots />}>
          <CallbackHandler />
        </Suspense>
        <Dots />
        <p
          className="text-[10px] uppercase tracking-[0.25em] text-[#9d9080]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Completing sign-in…
        </p>
      </div>
    </div>
  );
}
