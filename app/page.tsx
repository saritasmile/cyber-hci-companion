import Link from "next/link";

const moduleCards = [
  {
    label: "Scenario Intelligence",
    description: "Analyze real-world cyber incidents through a UX lens. Understand how human factors shape attack surfaces and defense strategies.",
    href: "/scenarios",
    accent: "#4eb8a0",
    tag: "ANALYST",
    icon: "⬡",
    index: "01",
  },
  {
    label: "Guided Study",
    description: "Structured learning paths that connect cybersecurity fundamentals to HCI principles and design practice.",
    href: "/guided-study",
    accent: "#e8854a",
    tag: "HCI",
    icon: "◈",
    index: "02",
  },
  {
    label: "Horizon Scan",
    description: "Emerging threats, technologies, and trends — curated and contextualized for the design researcher.",
    href: "/horizon-scan",
    accent: "#7b9fd4",
    tag: "INTEL",
    icon: "◎",
    index: "03",
  },
  {
    label: "Rabbit Hole",
    description: "Choose a topic and go deep. AI-guided exploration of complex technical subjects made accessible.",
    href: "/rabbit-hole",
    accent: "#b07fd4",
    tag: "RESEARCH",
    icon: "⬢",
    index: "04",
  },
  {
    label: "Design Patterns",
    description: "A library of security UX patterns, anti-patterns, and annotated case studies from the field.",
    href: "/design-patterns",
    accent: "#c9a96e",
    tag: "PATTERNS",
    icon: "◇",
    index: "05",
  },
];

export default function Home() {
  return (
    <div className="px-10 py-10 max-w-5xl">
      {/* Header */}
      <div className="mb-12">
        <p
          className="text-[10px] uppercase tracking-[0.3em] text-[#9d9080] mb-3"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Dashboard
        </p>
        <h1
          className="text-4xl font-bold text-[#e8e0d4] mb-3 leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Welcome back.
        </h1>
        <p className="text-[#9d9080] text-sm max-w-xl leading-relaxed">
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
            className="group block bg-[#161412] border border-[#2a2520] rounded-lg p-5 hover:border-[#3a3530] transition-colors"
          >
            {/* Card top row */}
            <div className="flex items-start justify-between mb-4">
              <span
                className="text-xl leading-none"
                style={{ color: mod.accent }}
              >
                {mod.icon}
              </span>
              <span
                className="text-[10px] tracking-[0.2em] px-2 py-0.5 rounded-sm border"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: mod.accent,
                  borderColor: mod.accent + "40",
                  backgroundColor: mod.accent + "10",
                }}
              >
                {mod.tag}
              </span>
            </div>

            {/* Index + label */}
            <p
              className="text-[10px] text-[#9d9080] mb-1"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {mod.index}
            </p>
            <h2
              className="text-base font-semibold text-[#e8e0d4] mb-2 group-hover:text-white transition-colors"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {mod.label}
            </h2>

            {/* Description */}
            <p className="text-xs text-[#9d9080] leading-relaxed">
              {mod.description}
            </p>

            {/* Hover caret */}
            <div
              className="mt-4 text-[10px] tracking-[0.15em] opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ fontFamily: "var(--font-mono)", color: mod.accent }}
            >
              ENTER MODULE →
            </div>
          </Link>
        ))}

        {/* Knowledge Map card */}
        <Link
          href="/knowledge-map"
          className="group block bg-[#161412] border border-[#2a2520] rounded-lg p-5 hover:border-[#3a3530] transition-colors sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-start justify-between mb-4">
            <span className="text-xl leading-none text-[#c9a96e]">◉</span>
            <span
              className="text-[10px] tracking-[0.2em] px-2 py-0.5 rounded-sm border"
              style={{
                fontFamily: "var(--font-mono)",
                color: "#c9a96e",
                borderColor: "#c9a96e40",
                backgroundColor: "#c9a96e10",
              }}
            >
              MAP
            </span>
          </div>
          <p
            className="text-[10px] text-[#9d9080] mb-1"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            06
          </p>
          <h2
            className="text-base font-semibold text-[#e8e0d4] mb-2 group-hover:text-white transition-colors"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Knowledge Map
          </h2>
          <p className="text-xs text-[#9d9080] leading-relaxed">
            Visualize connections between concepts across all modules. See how your
            learning builds over time.
          </p>
          <div
            className="mt-4 text-[10px] tracking-[0.15em] opacity-0 group-hover:opacity-100 transition-opacity text-[#c9a96e]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            ENTER MODULE →
          </div>
        </Link>
      </div>
    </div>
  );
}
