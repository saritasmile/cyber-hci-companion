import Link from "next/link";

// Light-mode accent tokens
const moduleCards = [
  {
    label: "Scenario Intelligence",
    description: "Analyze real-world cyber incidents through a UX lens. Understand how human factors shape attack surfaces and defense strategies.",
    href: "/scenarios",
    color: "#0a7a68",   // --analyst
    bg: "#e8f5f2",
    bdr: "#b0dbd4",
    tag: "ANALYST",
    icon: "⬡",
    index: "01",
    barClass: "module-card-scenario",
  },
  {
    label: "Guided Study",
    description: "Structured learning paths that connect cybersecurity fundamentals to HCI principles and design practice.",
    href: "/guided-study",
    color: "#c04a0a",   // --hci
    bg: "#fdf0e8",
    bdr: "#f0c4a0",
    tag: "HCI",
    icon: "◈",
    index: "02",
    barClass: "module-card-study",
  },
  {
    label: "Horizon Scan",
    description: "Emerging threats, technologies, and trends — curated and contextualized for the design researcher.",
    href: "/horizon-scan",
    color: "#1a4e8a",   // --commander
    bg: "#e8f0fa",
    bdr: "#a8c4e8",
    tag: "INTEL",
    icon: "◎",
    index: "03",
    barClass: "module-card-scan",
  },
  {
    label: "Rabbit Hole",
    description: "Choose a topic and go deep. AI-guided exploration of complex technical subjects made accessible.",
    href: "/rabbit-hole",
    color: "#6a3a9a",   // --research
    bg: "#f2ecfa",
    bdr: "#c8a8e8",
    tag: "RESEARCH",
    icon: "⬢",
    index: "04",
    barClass: "module-card-rabbit",
  },
  {
    label: "Design Patterns",
    description: "A library of security UX patterns, anti-patterns, and annotated case studies from the field.",
    href: "/design-patterns",
    color: "#8a5a1a",   // --accent
    bg: "#faf0e0",
    bdr: "#d4a860",
    tag: "PATTERNS",
    icon: "◇",
    index: "05",
    barClass: "module-card-patterns",
  },
];

export default function Home() {
  return (
    <div className="px-10 py-10 max-w-5xl responsive-padding">
      {/* Header */}
      <div className="mb-12">
        <p
          className="text-[10px] uppercase tracking-[0.3em] mb-3"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}
        >
          Dashboard
        </p>
        <h1
          className="page-title mb-3"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Welcome back.
        </h1>
        <p className="text-sm max-w-xl leading-relaxed" style={{ color: "var(--text-mid)" }}>
          Your cybersecurity learning companion — built for UX designers and researchers
          navigating the intersection of security and human-centered design.
        </p>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {moduleCards.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className={`group block card p-5 transition-all module-card ${mod.barClass}`}
          >
            {/* Card top row */}
            <div className="flex items-start justify-between mb-4">
              <span className="text-xl leading-none" style={{ color: mod.color }}>
                {mod.icon}
              </span>
              <span
                className="text-[10px] tracking-[0.2em] px-2 py-0.5 border"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: mod.color,
                  borderColor: mod.bdr,
                  backgroundColor: mod.bg,
                  borderRadius: "2px",
                }}
              >
                {mod.tag}
              </span>
            </div>

            {/* Index + label */}
            <p
              className="text-[10px] mb-1"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}
            >
              {mod.index}
            </p>
            <h2
              className="text-base font-semibold mb-2 transition-colors"
              style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}
            >
              {mod.label}
            </h2>

            {/* Description */}
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-dim)" }}>
              {mod.description}
            </p>

            {/* Hover caret */}
            <div
              className="mt-4 text-[10px] tracking-[0.15em] opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ fontFamily: "var(--font-mono)", color: mod.color }}
            >
              ENTER MODULE →
            </div>
          </Link>
        ))}

        {/* Knowledge Map card */}
        <Link
          href="/knowledge-map"
          className="group block card p-5 transition-all module-card sm:col-span-2 lg:col-span-1"
          style={{ position: "relative" }}
        >
          <div className="flex items-start justify-between mb-4">
            <span className="text-xl leading-none" style={{ color: "#8a5a1a" }}>◉</span>
            <span
              className="text-[10px] tracking-[0.2em] px-2 py-0.5 border"
              style={{
                fontFamily: "var(--font-mono)",
                color: "#8a5a1a",
                borderColor: "#d4a860",
                backgroundColor: "#faf0e0",
                borderRadius: "2px",
              }}
            >
              MAP
            </span>
          </div>
          <p
            className="text-[10px] mb-1"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}
          >
            06
          </p>
          <h2
            className="text-base font-semibold mb-2 transition-colors"
            style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}
          >
            Knowledge Map
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-dim)" }}>
            Visualize connections between concepts across all modules. See how your
            learning builds over time.
          </p>
          <div
            className="mt-4 text-[10px] tracking-[0.15em] opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ fontFamily: "var(--font-mono)", color: "#8a5a1a" }}
          >
            ENTER MODULE →
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-[3px]"
            style={{ backgroundColor: "#6a3a9a" }}
          />
        </Link>
      </div>
    </div>
  );
}
