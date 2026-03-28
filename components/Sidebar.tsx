"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

// Sidebar stays dark even in light mode — intentional anchoring
const SIDEBAR_BG          = "#1a1614";
const SIDEBAR_TEXT        = "rgba(255,255,255,0.55)";
const SIDEBAR_LABEL       = "rgba(255,255,255,0.3)";
const SIDEBAR_BORDER      = "rgba(255,255,255,0.1)";
const SIDEBAR_ACTIVE_BG   = "rgba(255,255,255,0.1)";
const SIDEBAR_ACTIVE_TEXT = "#faf8f4";
const SIDEBAR_ACTIVE_BDR  = "#d4a860"; // --accent-bdr

// ── Nav links (valid React component — hooks at top level) ────────────────────

function NavLinks({ pathname, onNavClick }: { pathname: string; onNavClick?: () => void }) {
  const isKmActive = pathname.startsWith("/knowledge-map");

  return (
    <>
      <p
        className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em]"
        style={{ fontFamily: "var(--font-mono)", color: SIDEBAR_LABEL }}
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
                onClick={onNavClick}
                className="flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors border-l-2 pl-[10px]"
                style={{
                  color: isActive ? SIDEBAR_ACTIVE_TEXT : SIDEBAR_TEXT,
                  backgroundColor: isActive ? SIDEBAR_ACTIVE_BG : "transparent",
                  borderLeftColor: isActive ? SIDEBAR_ACTIVE_BDR : "transparent",
                }}
              >
                <span className="text-base leading-none">
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

      {/* Knowledge Map */}
      <div className="mt-4 pt-4 px-3" style={{ borderTop: `1px solid ${SIDEBAR_BORDER}` }}>
        <Link
          href="/knowledge-map"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors border-l-2 pl-[10px]"
          style={{
            color: isKmActive ? SIDEBAR_ACTIVE_TEXT : SIDEBAR_TEXT,
            backgroundColor: isKmActive ? SIDEBAR_ACTIVE_BG : "transparent",
            borderLeftColor: isKmActive ? SIDEBAR_ACTIVE_BDR : "transparent",
          }}
        >
          <span className="text-base leading-none" style={{ color: "#d4a860" }}>◉</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
            Knowledge Map
          </span>
        </Link>
      </div>
    </>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function SidebarFooter({
  user,
  displayEmail,
  avatarLetter,
  onSignOut,
}: {
  user: User | null;
  displayEmail: string | null;
  avatarLetter: string | null;
  onSignOut: () => void;
}) {
  return (
    <div className="px-4 py-4" style={{ borderTop: `1px solid ${SIDEBAR_BORDER}` }}>
      {user ? (
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
            style={{
              backgroundColor: "rgba(212,168,96,0.15)",
              border: "1px solid rgba(212,168,96,0.3)",
              color: "#d4a860",
              fontFamily: "var(--font-mono)",
            }}
          >
            {avatarLetter}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] truncate"
              style={{ fontFamily: "var(--font-mono)", color: SIDEBAR_ACTIVE_TEXT }}
            >
              {displayEmail}
            </p>
          </div>
          <button
            onClick={onSignOut}
            title="Sign out"
            className="shrink-0 transition-colors"
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: SIDEBAR_LABEL }}
          >
            ↪
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p
            className="text-[10px]"
            style={{ fontFamily: "var(--font-mono)", color: SIDEBAR_LABEL }}
          >
            Guest mode
          </p>
          <Link
            href="/auth"
            className="text-[10px] transition-colors"
            style={{ fontFamily: "var(--font-mono)", color: "#d4a860" }}
          >
            Sign in →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Hide on auth routes
  if (pathname.startsWith("/auth")) return null;

  async function handleSignOut() {
    await supabase.auth.signOut();
    document.cookie = "cyber-hci-session=; path=/; max-age=0";
    router.push("/auth");
  }

  const displayEmail = user?.email ?? null;
  const avatarLetter = displayEmail ? displayEmail[0].toUpperCase() : null;
  const footerProps = { user, displayEmail, avatarLetter, onSignOut: handleSignOut };

  const logoBlock = (
    <div className="px-6 py-6" style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}` }}>
      <p
        className="text-[10px] uppercase tracking-[0.25em] mb-1"
        style={{ fontFamily: "var(--font-mono)", color: SIDEBAR_LABEL }}
      >
        Learning Companion
      </p>
      <h1
        className="text-lg font-bold leading-tight"
        style={{ fontFamily: "var(--font-heading)", color: SIDEBAR_ACTIVE_TEXT }}
      >
        Cyber <span style={{ color: "#d4a860" }}>×</span> HCI
      </h1>
    </div>
  );

  return (
    <>
      {/* ── Mobile header ── */}
      <header
        className="md:hidden sticky top-0 z-[200] flex items-center justify-between px-5"
        style={{ height: "56px", backgroundColor: SIDEBAR_BG }}
      >
        <h1
          className="text-base font-bold"
          style={{ fontFamily: "var(--font-heading)", color: SIDEBAR_ACTIVE_TEXT }}
        >
          Cyber <span style={{ color: "#d4a860" }}>×</span> HCI
        </h1>
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="flex flex-col gap-1.5 p-1"
        >
          <span className="block w-5 h-px" style={{ backgroundColor: SIDEBAR_ACTIVE_TEXT }} />
          <span className="block w-5 h-px" style={{ backgroundColor: SIDEBAR_ACTIVE_TEXT }} />
          <span className="block w-4 h-px" style={{ backgroundColor: SIDEBAR_ACTIVE_TEXT }} />
        </button>
      </header>

      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex w-64 shrink-0 h-screen sticky top-0 flex-col"
        style={{ backgroundColor: SIDEBAR_BG, borderRight: `1px solid ${SIDEBAR_BORDER}` }}
      >
        {logoBlock}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <NavLinks pathname={pathname} />
        </nav>
        <SidebarFooter {...footerProps} />
      </aside>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[300]">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 flex flex-col overflow-y-auto"
            style={{ backgroundColor: SIDEBAR_BG }}
          >
            <div
              className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}` }}
            >
              <h1
                className="text-base font-bold"
                style={{ fontFamily: "var(--font-heading)", color: SIDEBAR_ACTIVE_TEXT }}
              >
                Cyber <span style={{ color: "#d4a860" }}>×</span> HCI
              </h1>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="text-lg"
                style={{ color: SIDEBAR_LABEL }}
              >
                ✕
              </button>
            </div>
            <nav className="flex-1 py-4 px-3">
              <NavLinks pathname={pathname} onNavClick={() => setDrawerOpen(false)} />
            </nav>
            <SidebarFooter {...footerProps} />
          </aside>
        </div>
      )}
    </>
  );
}

export { modules };
