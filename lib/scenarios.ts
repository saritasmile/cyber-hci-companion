// Static metadata for the Scenario Intelligence module.
// AI-generated analysis is fetched at runtime and cached in Supabase.

export type SeverityLevel = "critical" | "high" | "medium";
export type LensTag = "Analyst" | "Commander" | "HCI";

export interface ScenarioMeta {
  slug: string;
  name: string;
  date: string;
  type: string;
  sector: string;
  severity: SeverityLevel;
  summary: string;
  tags: LensTag[];
}

export const scenarios: ScenarioMeta[] = [
  {
    slug: "salt-typhoon",
    name: "Salt Typhoon",
    date: "2024",
    type: "Nation-state espionage",
    sector: "Telecommunications",
    severity: "critical",
    summary:
      "Chinese state-sponsored threat actor infiltrated major US telecom providers—AT&T, Verizon, T-Mobile—accessing lawful intercept systems and harvesting metadata on senior government officials.",
    tags: ["Analyst", "Commander"],
  },
  {
    slug: "solarwinds-sunburst",
    name: "SolarWinds SUNBURST",
    date: "Dec 2020",
    type: "Supply chain attack",
    sector: "Government / Enterprise",
    severity: "critical",
    summary:
      "A trojanized software update to SolarWinds Orion was distributed to 18,000+ organizations including nine US federal agencies, giving attackers months of undetected access.",
    tags: ["Analyst", "Commander", "HCI"],
  },
  {
    slug: "colonial-pipeline",
    name: "Colonial Pipeline",
    date: "May 2021",
    type: "Ransomware",
    sector: "Critical Infrastructure",
    severity: "critical",
    summary:
      "DarkSide ransomware forced a six-day shutdown of the largest US fuel pipeline, causing fuel shortages across the East Coast and a $4.4M ransom payment.",
    tags: ["Commander", "HCI"],
  },
  {
    slug: "moveit",
    name: "MOVEit Transfer",
    date: "May 2023",
    type: "Zero-day exploitation",
    sector: "Multi-sector",
    severity: "critical",
    summary:
      "Cl0p ransomware group exploited a SQL injection zero-day in MOVEit Transfer software, exfiltrating data from over 2,700 organizations and affecting 93 million individuals.",
    tags: ["Analyst", "Commander"],
  },
  {
    slug: "log4shell",
    name: "Log4Shell",
    date: "Dec 2021",
    type: "Remote code execution",
    sector: "Multi-sector",
    severity: "critical",
    summary:
      "A critical vulnerability in the ubiquitous Log4j Java logging library enabled unauthenticated remote code execution across hundreds of millions of systems, triggering a global scramble.",
    tags: ["Analyst", "HCI"],
  },
  {
    slug: "uber-2022",
    name: "Uber 2022",
    date: "Sep 2022",
    type: "Social engineering",
    sector: "Technology",
    severity: "high",
    summary:
      "An 18-year-old attacker used MFA fatigue attacks and social engineering to gain full admin access to Uber's internal systems, Slack, HackerOne, and AWS within hours.",
    tags: ["Analyst", "HCI"],
  },
];

// ── Analysis types returned by the AI and cached in Supabase ─────────────────

export interface TimelineEvent {
  date: string;
  event: string;
}

export interface ScenarioAnalysis {
  overview: {
    what_happened: string;
    timeline: TimelineEvent[];
    scale: string;
    attribution: string;
  };
  analyst: {
    summary: string;
    detection: string[];
    iocs: string[];
    response_gaps: string[];
    tools_implicated: string[];
  };
  commander: {
    summary: string;
    decisions: string[];
    disclosure: string;
    policy_impact: string;
    risk_framing: string;
  };
  hci: {
    summary: string;
    failures: string[];
    cognitive_load: string;
    design_questions: string[];
    research_angles: string[];
  };
  design_lessons: {
    summary: string;
    lessons: string[];
    pattern_connections: string[];
  };
}
