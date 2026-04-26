"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ModuleConfig } from "@/types";
import type { User } from "@supabase/supabase-js";

const modules: ModuleConfig[] = [
  { id: "scenario-intelligence", label: "Scenarios",         description: "Analyze real-world cyber incidents through a UX lens",  href: "/scenarios", accent: "analyst",   icon: "⬡" },
  { id: "horizon-scan",          label: "Horizon Scan",      description: "Emerging threats and trends in the security landscape",  href: "/scan",      accent: "commander", icon: "◎" },
  { id: "rabbit-hole",           label: "Rabbit Hole",       description: "Deep dives into specific technical topics",             href: "/rabbit",    accent: "research",  icon: "⬢" },
  { id: "design-patterns",       label: "Design Patterns",   description: "Security UX patterns and anti-patterns",                href: "/patterns",  accent: "gold",      icon: "◇" },
  { id: "learning-resources",    label: "Learning Resources",description: "Courses, books, tools, experts and communities",        href: "/resources", accent: "analyst",   icon: "◈" },
  { id: "sessions",              label: "Sessions",          description: "AI-assembled and curated learning playlists",           href: "/sessions",  accent: "analyst",   icon: "◈" },
];

const discoverModules: ModuleConfig[] = [
  { id: "industry-intel", label: "Industry Intel", description: "Vendor landscape, analyst pain points, and design gaps", href: "/industry-intel", accent: "commander", icon: "◎" },
  { id: "soc-examples",   label: "SOC Examples",   description: "Four-layer walkthroughs of real SOC workflows",          href: "/soc-examples",  accent: "analyst",   icon: "⬡" },
];

const secondaryModules: ModuleConfig[] = [
  { id: "glossary",      label: "Glossary",      description: "Terms saved while exploring",          href: "/glossary",      accent: "gold", icon: "◉" },
  { id: "knowledge-map", label: "Knowledge Map", description: "Visualize your learning connections",  href: "/knowledge-map", accent: "gold", icon: "◉" },
];

// ── All sidebar colors driven by CSS variables in globals.css ─────────────────
const S = {
  bg:         "var(--sidebar-bg)",
  text:       "var(--sidebar-text)",
  label:      "var(--sidebar-dim)",
  border:     "var(--sidebar-bdr)",
  activeBg:   "var(--sidebar-hover)",
  activeText: "var(--sidebar-active)",
  activeBdr:  "var(--oak)",
  accent:     "var(--oak)",
};

// ── Colored SVG icons — each module gets a unique shape and color ─────────────

function ModuleIcon({ id }: { id: string }) {
  switch (id) {
    case "scenario-intelligence":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="7" cy="7" r="5.5" stroke="#7dd4e8" strokeWidth="1.2"/>
        </svg>
      );
    case "horizon-scan":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="7" cy="7" r="5.5" stroke="#b8848a" strokeWidth="1.2"/>
          <circle cx="7" cy="7" r="1.8" fill="#b8848a"/>
        </svg>
      );
    case "rabbit-hole":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <polygon points="7,1.2 12.2,4.1 12.2,9.9 7,12.8 1.8,9.9 1.8,4.1" stroke="#e8a84a" strokeWidth="1.2"/>
        </svg>
      );
    case "design-patterns":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <rect x="2.5" y="2.5" width="9" height="9" rx="1" stroke="#c47b5a" strokeWidth="1.2" transform="rotate(45 7 7)"/>
        </svg>
      );
    case "learning-resources":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <rect x="2.5" y="2.5" width="9" height="9" rx="1" stroke="#7aaa50" strokeWidth="1.2" transform="rotate(45 7 7)"/>
          <rect x="4.2" y="4.2" width="5.6" height="5.6" rx="0.5" fill="#7aaa50" transform="rotate(45 7 7)"/>
        </svg>
      );
    case "sessions":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <rect x="3" y="3" width="8" height="8" rx="1" stroke="#c8a97e" strokeWidth="1.2" transform="rotate(45 7 7)"/>
        </svg>
      );
    case "industry-intel":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <path d="M7 1.5L2 4.5V9.5L7 12.5L12 9.5V4.5L7 1.5Z" stroke="#7dd4e8" strokeWidth="1.2"/>
          <path d="M7 4.5L4.5 6V9L7 10.5L9.5 9V6L7 4.5Z" stroke="#7dd4e8" strokeWidth="0.8"/>
        </svg>
      );
    case "soc-examples":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <rect x="2" y="3" width="10" height="8" stroke="#e8a84a" strokeWidth="1.2"/>
          <line x1="2" y1="6" x2="12" y2="6" stroke="#e8a84a" strokeWidth="0.8"/>
          <line x1="5.5" y1="6" x2="5.5" y2="11" stroke="#e8a84a" strokeWidth="0.8"/>
        </svg>
      );
    case "glossary":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="7" cy="7" r="5.5" stroke="#e8a84a" strokeWidth="1.2"/>
          <circle cx="7" cy="7" r="2.2" fill="#e8a84a"/>
        </svg>
      );
    case "knowledge-map":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="7" cy="7" r="5.5" stroke="#7aaa50" strokeWidth="1.2"/>
          <circle cx="7" cy="7" r="2.2" fill="#7aaa50"/>
        </svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="7" cy="7" r="5.5" stroke="#a8d8e8" strokeWidth="1.2"/>
        </svg>
      );
  }
}

// ── Nav links ─────────────────────────────────────────────────────────────────

function NavLinks({ pathname, onNavClick }: { pathname: string; onNavClick?: () => void }) {
  return (
    <>
      <p className="px-3 mb-2 uppercase tracking-[0.2em]"
        style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: S.label }}>
        Modules
      </p>
      <ul className="space-y-0.5">
        {modules.map((mod) => {
          const isActive = pathname.startsWith(mod.href);
          return (
            <li key={mod.id}>
              <Link href={mod.href} onClick={onNavClick}
                className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors border-l-2 pl-[10px]"
                style={{
                  color: isActive ? S.activeText : S.text,
                  backgroundColor: isActive ? S.activeBg : "transparent",
                  borderLeftColor: isActive ? S.activeBdr : "transparent",
                }}>
                <ModuleIcon id={mod.id} />
                <span style={{ fontFamily: "var(--font-body)", fontSize: "13px" }}>{mod.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Discover section */}
      <div className="mt-4 pt-4 px-3" style={{ borderTop: `1px solid ${S.border}` }}>
        <p className="px-0 mb-2 uppercase tracking-[0.2em]"
          style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: S.label }}>
          Discover
        </p>
        {discoverModules.map((mod) => {
          const isActive = pathname.startsWith(mod.href);
          return (
            <Link key={mod.id} href={mod.href} onClick={onNavClick}
              className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors border-l-2 pl-[10px]"
              style={{
                color: isActive ? S.activeText : S.text,
                backgroundColor: isActive ? S.activeBg : "transparent",
                borderLeftColor: isActive ? S.activeBdr : "transparent",
              }}>
              <ModuleIcon id={mod.id} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: "13px" }}>{mod.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Secondary */}
      <div className="mt-4 pt-4 px-3" style={{ borderTop: `1px solid ${S.border}` }}>
        {secondaryModules.map((mod) => {
          const isActive = pathname.startsWith(mod.href);
          return (
            <Link key={mod.id} href={mod.href} onClick={onNavClick}
              className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors border-l-2 pl-[10px]"
              style={{
                color: isActive ? S.activeText : S.text,
                backgroundColor: isActive ? S.activeBg : "transparent",
                borderLeftColor: isActive ? S.activeBdr : "transparent",
              }}>
              <ModuleIcon id={mod.id} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{mod.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function SidebarFooter({ user, displayEmail, avatarLetter, onSignOut }: {
  user: User | null;
  displayEmail: string | null;
  avatarLetter: string | null;
  onSignOut: () => void;
}) {
  return (
    <div className="px-4 py-4" style={{ borderTop: `1px solid ${S.border}` }}>
      {user ? (
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--oak-bg)", border: "1px solid var(--oak-bdr)", color: "var(--oak)", fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: "bold" }}>
            {avatarLetter}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: S.activeText }}>
              {displayEmail}
            </p>
          </div>
          <button onClick={onSignOut} title="Sign out" className="shrink-0 transition-colors"
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: S.label }}>
            ↪
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: S.label }}>Guest mode</p>
          <Link href="/auth" className="transition-colors"
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: S.accent }}>
            Sign in →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

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
    <Link href="/" className="block px-6 py-6 transition-opacity hover:opacity-80"
      style={{ borderBottom: `1px solid ${S.border}` }}>
      <p className="uppercase tracking-[0.25em] mb-1"
        style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: S.label }}>
        Learning Companion
      </p>
      <h1 className="text-lg font-bold leading-tight"
        style={{ fontFamily: "var(--font-heading)", color: S.activeText }}>
        Cyber <span style={{ color: S.accent }}>×</span> HCI
      </h1>
    </Link>
  );

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-[200] flex items-center justify-between px-5"
        style={{ height: "56px", backgroundColor: S.bg }}>
        <Link href="/" className="transition-opacity hover:opacity-80">
          <h1 className="text-base font-bold"
            style={{ fontFamily: "var(--font-heading)", color: S.activeText }}>
            Cyber <span style={{ color: S.accent }}>×</span> HCI
          </h1>
        </Link>
        <button onClick={() => setDrawerOpen(true)} aria-label="Open menu" className="flex flex-col gap-1.5 p-1">
          <span className="block w-5 h-px" style={{ backgroundColor: S.activeText }} />
          <span className="block w-5 h-px" style={{ backgroundColor: S.activeText }} />
          <span className="block w-4 h-px" style={{ backgroundColor: S.activeText }} />
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 h-screen sticky top-0 flex-col"
        style={{ backgroundColor: S.bg, borderRight: `1px solid ${S.border}` }}>
        {logoBlock}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <NavLinks pathname={pathname} />
        </nav>
        <SidebarFooter {...footerProps} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[300]">
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col overflow-y-auto"
            style={{ backgroundColor: S.bg }}>
            <div className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: `1px solid ${S.border}` }}>
              <Link href="/" onClick={() => setDrawerOpen(false)} className="transition-opacity hover:opacity-80">
                <h1 className="text-base font-bold"
                  style={{ fontFamily: "var(--font-heading)", color: S.activeText }}>
                  Cyber <span style={{ color: S.accent }}>×</span> HCI
                </h1>
              </Link>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="text-lg"
                style={{ color: S.label }}>✕</button>
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
