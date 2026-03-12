export type Module =
  | "scenario-intelligence"
  | "guided-study"
  | "horizon-scan"
  | "rabbit-hole"
  | "design-patterns"
  | "knowledge-map";

export type AccentColor = "analyst" | "hci" | "commander" | "research" | "gold";

export interface ModuleConfig {
  id: Module;
  label: string;
  description: string;
  href: string;
  accent: AccentColor;
  icon: string;
}
