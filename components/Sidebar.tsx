"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { ModuleConfig } from "@/types";
import type { User } from "@supabase/supabase-js";

const modules: ModuleConfig[] = [
  {
    id: "scenario-intelligence",
    label: "Scenario Intelligence",
    description: "Analyze real-world cyber incidents through a UX lens",
    href: "/scenarios",
    accent: "analyst",
    icon: "⬡",
  },
  {
    id: "guided-study",
    label: "Guided Study",
    description: "Structured learning paths for cybersecurity concepts",
    href: "/study",
    accent: "hci",
    icon: "◈",
  },
  {
    id: "horizon-scan",
    label: "Horizon Scan",
    description: "Emerging threats and trends in the security landscape",
    href: "/scan",
    accent: "commander",
    icon: "◎",
  },
  {
    id: "rabbit-hole",
    label: "Rabbit Hole",
    description: "Deep dives into specific technical topics",
    href: "/rabbit",
    accent: "research",
    icon: "⬢",
  },
  {
    id: "design-patterns",
    label: "Design Patterns",
    description: "Security UX patterns and anti-patterns",
    href: "/patterns",
    accent: "gold",
    icon: "◇",
  },
];

const accentClasses: Record<string, string> = {
  analyst: "text-[#4eb8a0] border-[#4eb8a0]",
  hci: "text-[#e8854a] border-[#e8854a]",
  commander: "text-[#7b9fd4] border-[#7b9fd4]",
  research: "text-[#b07fd4] border-[#b07fd4]",
  gold: "text-[#c9a96e] border-[#c9a96e]",
};

const accentBgActive: Record<string, string> = {
  analyst: "bg-[#4eb8a0]/10",
  hci: "bg-[#e8854a]/10",
  commander: "bg-[#7b9fd4]/10",
  research: "bg-[#b07fd4]/10",
  gold: "bg-[#c9a96e]/10",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hide sidebar on auth routes (after all hooks)
  if (pathname.startsWith("/auth")) return null;

  async function handleSignOut() {
    await supabase.auth.signOut();
    // Clear session cookie
    document.cookie = "cyber-hci-session=; path=/; max-age=0";
    router.push("/auth");
  }

  const displayEmail = user?.email ?? null;
  const avatarLetter = displayEmail ? displayEmail[0].toUpperCase() : null;

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col border-r border-[#2a2520] bg-[#0f0e0d]">
      {/* Logo / wordmark */}
      <div className="px-6 py-6 border-b border-[#2a2520]">
        <p
          className="text-[10px] uppercase tracking-[0.25em] text-[#9d9080] mb-1"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Learning Companion
        </p>
        <h1
          className="text-lg font-bold text-[#e8e0d4] leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Cyber <span className="text-[#c9a96e]">×</span> HCI
        </h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p
          className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] text-[#9d9080]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Modules
        </p>
        <ul className="space-y-0.5">
          {modules.map((mod) => {
            const isActive = pathname.startsWith(mod.href);
            return (
              <li key={mod.id}>
                <Link
                  href={mod.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors group",
                    isActive
                      ? cn("border-l-2 pl-[10px]", accentClasses[mod.accent], accentBgActive[mod.accent])
                      : "text-[#9d9080] hover:text-[#e8e0d4] hover:bg-[#161412] border-l-2 border-transparent pl-[10px]"
                  )}
                >
                  <span
                    className={cn(
                      "text-base leading-none transition-colors",
                      isActive ? accentClasses[mod.accent].split(" ")[0] : "group-hover:text-[#e8e0d4]"
                    )}
                  >
                    {mod.icon}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                    {mod.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Divider + Knowledge Map */}
        <div className="mt-4 pt-4 border-t border-[#2a2520] px-3">
          <Link
            href="/knowledge-map"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors group border-l-2",
              pathname.startsWith("/knowledge-map")
                ? "text-[#c9a96e] border-[#c9a96e] bg-[#c9a96e]/10"
                : "text-[#9d9080] hover:text-[#e8e0d4] hover:bg-[#161412] border-transparent pl-[10px]"
            )}
          >
            <span className="text-base leading-none text-[#c9a96e]">◉</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
              Knowledge Map
            </span>
          </Link>
        </div>
      </nav>

      {/* Footer — user section */}
      <div className="px-4 py-4 border-t border-[#2a2520]">
        {user ? (
          /* Authenticated */
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
              style={{
                backgroundColor: "#c9a96e20",
                border: "1px solid #c9a96e40",
                color: "#c9a96e",
                fontFamily: "var(--font-mono)",
              }}
            >
              {avatarLetter}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[10px] text-[#e8e0d4] truncate"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {displayEmail}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="shrink-0 text-[#9d9080] hover:text-[#e8854a] transition-colors"
              style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}
            >
              ↪
            </button>
          </div>
        ) : (
          /* Guest */
          <div className="flex items-center justify-between">
            <p
              className="text-[10px] text-[#9d9080]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Guest mode
            </p>
            <Link
              href="/auth"
              className="text-[10px] text-[#c9a96e] hover:text-[#e8e0d4] transition-colors"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Sign in →
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}

export { modules };
