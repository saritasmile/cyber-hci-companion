"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ModuleConfig } from "@/types";

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
    href: "/horizon-scan",
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
    href: "/design-patterns",
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

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#2a2520]">
        <p
          className="text-[10px] text-[#9d9080]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          v0.1.0 &mdash; Est. 2026
        </p>
      </div>
    </aside>
  );
}

export { modules };
