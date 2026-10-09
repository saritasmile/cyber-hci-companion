export type Module =
  | "scenario-intelligence"
  | "horizon-scan"
  | "rabbit-hole"
  | "design-patterns"
  | "knowledge-map"
  | "learning-resources"
  | "sessions"
  | "industry-intel"
  | "soc-examples"
  | "glossary";

export type AccentColor = "analyst" | "hci" | "commander" | "research" | "gold";

export interface ModuleConfig {
  id: Module;
  label: string;
  description: string;
  href: string;
  accent: AccentColor;
  icon: string;
}

// ── Learning Resources ────────────────────────────────────────────────────────

export type ResourceType =
  | "course"
  | "book"
  | "tool"
  | "youtube"
  | "reddit"
  | "expert";

export type ResourceStatus =
  | "saved"
  | "in_progress"
  | "completed"
  | "not_interested";

export type ResourceCost = "free" | "paid" | "freemium";

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  author?: string;           // person, channel name, username
  description: string;
  url: string;
  cost: ResourceCost;
  topics: string[];          // e.g. ["ransomware", "social engineering", "HCI"]
  platform?: string;         // e.g. "Coursera", "YouTube", "Reddit", "Twitter/X"
  socials?: {                // for experts
    twitter?: string;
    linkedin?: string;
    substack?: string;
    mastodon?: string;
    website?: string;
  };
}

export interface ResourceWithStatus extends Resource {
  status: ResourceStatus | null;
}
