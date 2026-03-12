// Static Design Patterns data for the Design Patterns module.
// Each pattern includes HCI principles, real-world examples, trade-offs, and academic references.

export type PatternCategory =
  | "Alert Design"
  | "Automation UX"
  | "Data Visualisation"
  | "Access Control UX";

export interface TradeOff {
  pro: string;
  con: string;
}

export interface AcademicRef {
  citation: string;
  note: string;
}

export interface Pattern {
  id: string;
  name: string;
  category: PatternCategory;
  tagline: string;
  problem: string;
  hciPrinciple: string;
  realToolExamples: string[];
  tradeoffs: TradeOff[];
  antiPatterns: string[];
  academicRefs: AcademicRef[];
  relatedScenarios: string[]; // scenario slugs
}

export const patterns: Pattern[] = [
  // ── Alert Design ──────────────────────────────────────────────────────────

  {
    id: "alert-triage-hierarchy",
    name: "Alert Triage Hierarchy",
    category: "Alert Design",
    tagline: "Surface the right alert at the right time with severity-aware visual ordering.",
    problem:
      "SOC analysts face hundreds of alerts per shift. Without a clear visual hierarchy, high-severity events drown in a uniform list. Cognitive load spikes, triage time lengthens, and critical incidents are missed during peak volume.",
    hciPrinciple:
      "Pre-attentive processing — the human visual system detects colour, size, and position in under 250ms without conscious effort. Encoding severity through multiple visual channels (colour + weight + position) lets analysts parse queue priority before reading a single word.",
    realToolExamples: [
      "Splunk SIEM: colour-coded severity bands (Critical red → Informational grey) in the Incident Review dashboard",
      "Microsoft Sentinel: incident severity ladder with automatic priority queuing",
      "Elastic Security: risk score bar charts that visually dominate the layout on high-severity events",
      "PagerDuty: urgency levels with distinct visual treatment and sound cues for critical alerts",
    ],
    tradeoffs: [
      {
        pro: "Dramatically reduces mean time to acknowledge (MTTA) for critical events",
        con: "Risk of habituation — analysts may unconsciously filter out high-severity colour after weeks of false positives",
      },
      {
        pro: "Works under fatigue; pre-attentive cues bypass taxed working memory",
        con: "Colour-only encoding excludes colour-blind analysts (~8% of males); requires redundant encoding",
      },
      {
        pro: "Naturally guides new analysts without requiring deep pattern-matching experience",
        con: "Miscalibrated severity scoring poisons the hierarchy, eroding trust across the whole queue",
      },
    ],
    antiPatterns: [
      "Uniform grey alert lists that require reading every title to determine priority",
      "Using only icon size without colour redundancy",
      "Auto-escalating severity thresholds that inflate everything to 'Critical', nullifying the scale",
      "Hiding medium/low alerts with no affordance to expand — risks missing slow-burn threats",
    ],
    academicRefs: [
      {
        citation:
          "Ware, C. (2020). Information Visualization: Perception for Design (4th ed.). Morgan Kaufmann.",
        note: "Foundational text on pre-attentive features and visual encoding for data-dense interfaces.",
      },
      {
        citation:
          "Andersen, M. et al. (2022). 'Alert fatigue in Security Operations Centres.' CHI '22 Extended Abstracts.",
        note: "Empirical study showing that visual hierarchy redesign reduced analyst miss-rate by 23% in simulated SOC tasks.",
      },
    ],
    relatedScenarios: ["salt-typhoon", "solarwinds"],
  },

  {
    id: "progressive-alert-disclosure",
    name: "Progressive Alert Disclosure",
    category: "Alert Design",
    tagline: "Show the minimum needed to triage, then expand on demand.",
    problem:
      "Alerts that front-load technical detail (raw log lines, full packet captures, MITRE tactic IDs) force analysts to mentally filter signal from noise before they can even classify the event. Cognitive bandwidth is wasted before triage begins.",
    hciPrinciple:
      "Progressive disclosure (Nielsen, 1994) — present only the information required for the current decision; reveal depth only when explicitly requested. This maps to the analyst workflow: classify first, investigate second, remediate third.",
    realToolExamples: [
      "CrowdStrike Falcon: detection cards show process tree summary by default; full telemetry behind an expand toggle",
      "Palo Alto Cortex XDR: causality chain collapsed by default, expandable per node",
      "IBM QRadar: offense summary card with 'View Event Details' drill-down",
      "Jira/ServiceNow security plugins: ticket preview + detail pane pattern",
    ],
    tradeoffs: [
      {
        pro: "Reduces cognitive load at the triage stage where speed is critical",
        con: "Extra click to expand detail can feel friction-heavy during high-volume incidents",
      },
      {
        pro: "Scales to varying analyst experience — novices see summaries, experts drill straight in",
        con: "Hidden context risks; analysts may triage incorrectly on summary alone and miss crucial buried detail",
      },
    ],
    antiPatterns: [
      "Firehose view: all raw log data visible by default with no summarisation",
      "Progressive disclosure so aggressive that critical context (e.g., affected host name) is hidden behind clicks",
      "Inconsistent expansion behaviour across different alert types within the same tool",
    ],
    academicRefs: [
      {
        citation: "Nielsen, J. (1994). 'Progressive Disclosure.' Nielsen Norman Group.",
        note: "Original UX formulation; widely applied in data-dense enterprise tools.",
      },
      {
        citation:
          "Sundaramurthy, S.C. et al. (2014). 'A Human Capital Model for Mitigating Security Analyst Burnout.' SOUPS '14.",
        note: "Identifies information overload as a primary burnout driver in SOC roles.",
      },
    ],
    relatedScenarios: ["log4shell", "solarwinds"],
  },

  // ── Automation UX ─────────────────────────────────────────────────────────

  {
    id: "human-in-the-loop-override",
    name: "Human-in-the-Loop Override",
    category: "Automation UX",
    tagline: "Automated action + clear human veto = appropriate trust without learned helplessness.",
    problem:
      "SOAR and XDR platforms auto-execute playbooks that isolate hosts, block IPs, and kill processes. When these actions are invisible or irrevocable, analysts lose situational awareness and stop developing judgment. Over-automation creates brittle, uncritical dependence.",
    hciPrinciple:
      "Human supervisory control (Sheridan & Verplank, 1978) — maintain the human in a monitoring and authority role even when automation handles execution. The key design levers are: visibility of automated actions, reversibility, and a clear veto pathway.",
    realToolExamples: [
      "Palo Alto XSOAR: 'Ask' task in playbooks that pauses automation and requests analyst approval before destructive actions",
      "Splunk SOAR: manual task steps that interrupt auto-execution with analyst decision prompts",
      "Microsoft Sentinel: automation rules with 'review required' flags before endpoint isolation",
      "Tines: human approval nodes embedded in no-code automation workflows",
    ],
    tradeoffs: [
      {
        pro: "Preserves analyst situational awareness and decision-making skill development",
        con: "Approval steps add latency; in fast-moving ransomware scenarios, seconds matter",
      },
      {
        pro: "Creates audit trail of human decisions, supporting compliance and post-incident review",
        con: "Alert fatigue applies equally to approval prompts — analysts may rubber-stamp without reading",
      },
      {
        pro: "Reduces blast radius of misconfigured playbooks",
        con: "Poorly designed override UI (small 'Reject' button, ambiguous labels) can cause mis-clicks",
      },
    ],
    antiPatterns: [
      "Silent automation with no activity log — analysts discover actions only from downstream effects",
      "Confirmation dialogs with default 'Approve' that invite rubber-stamping",
      "Override prompts with countdown timers that default to Approve — automation anxiety pressure",
      "No rollback mechanism; once a host is isolated, there is no undo",
    ],
    academicRefs: [
      {
        citation:
          "Sheridan, T.B. & Verplank, W.L. (1978). Human and Computer Control of Undersea Teleoperators. MIT Man-Machine Systems Laboratory.",
        note: "Original 10-level autonomy scale; still the canonical framework for human-automation authority design.",
      },
      {
        citation:
          "Parasuraman, R. & Riley, V. (1997). 'Humans and Automation.' Human Factors, 39(2), 230–253.",
        note: "Defines misuse, disuse, and abuse of automation — foundational for SOAR design critique.",
      },
    ],
    relatedScenarios: ["colonial-pipeline", "uber-2022"],
  },

  {
    id: "automation-trust-gradient",
    name: "Automation Trust Gradient",
    category: "Automation UX",
    tagline: "Match automation confidence display to analyst trust calibration needs.",
    problem:
      "Binary automation outputs (blocked / allowed) obscure the confidence level behind decisions. Analysts either over-trust outputs or distrust them entirely. Neither is calibrated. Under-trust wastes automation value; over-trust creates complacency and misses adversarial manipulation of ML models.",
    hciPrinciple:
      "Calibrated trust (Lee & See, 2004) — system transparency about uncertainty enables appropriate reliance. Displaying confidence scores, decision rationale, and contributing signals helps analysts decide when to accept automation versus verify manually.",
    realToolExamples: [
      "Darktrace: AI confidence percentage shown alongside each anomaly alert",
      "CrowdStrike: 'Why was this detected?' natural-language explanation panel",
      "Google Chronicle: ML detection confidence bands in the alert detail view",
      "Vectra AI: certainty and priority scores displayed as visual gauges on each threat",
    ],
    tradeoffs: [
      {
        pro: "Enables analysts to rationally allocate manual review effort toward lower-confidence detections",
        con: "Percentage confidence scores are often misinterpreted as probabilities — requires training",
      },
      {
        pro: "Surfaces model degradation signals early when confidence trends downward on normal traffic",
        con: "Too much explanatory detail in high-volume queues adds cognitive load at triage",
      },
    ],
    antiPatterns: [
      "Single binary verdict (malicious / benign) with no explanation",
      "Confidence shown as a raw floating-point number (0.87391) without contextual meaning",
      "Hiding model rationale behind a separate 'AI explainability' panel that is never opened",
      "Showing confidence only for positive detections, not for 'clean' verdicts",
    ],
    academicRefs: [
      {
        citation:
          "Lee, J.D. & See, K.A. (2004). 'Trust in Automation.' Human Factors, 46(1), 50–80.",
        note: "Defines calibrated, appropriate, and miscalibrated trust — essential reading for SOAR/XDR designers.",
      },
      {
        citation:
          "Wischnewski, M. et al. (2023). 'Measuring Trust Calibration in AI-assisted Decision Making.' CHI '23.",
        note: "Shows that confidence visualisations reduce over-reliance but may increase under-reliance without adequate design.",
      },
    ],
    relatedScenarios: ["solarwinds", "colonial-pipeline"],
  },

  // ── Data Visualisation ────────────────────────────────────────────────────

  {
    id: "threat-data-layering",
    name: "Threat Data Layering",
    category: "Data Visualisation",
    tagline: "Stack contextual data on demand rather than displaying everything at once.",
    problem:
      "Network topology maps, threat intel dashboards, and attack timelines often try to display every data dimension simultaneously. The result is visual clutter that hides the relationships analysts most need to see. Overplotting is endemic in SIEM and NDR visualisations.",
    hciPrinciple:
      "Shneiderman's mantra (1996): overview first, zoom and filter, then details on demand. Layer data progressively so the base view provides spatial orientation, subsequent layers add categorical context, and final layers reveal raw telemetry only when requested.",
    realToolExamples: [
      "Maltego: entity graph with collapsible relationship types — start with domains, expand to IPs, expand to certificates",
      "Recorded Future: threat actor profiles with layered intelligence (strategic → operational → tactical)",
      "Analyst1: threat graph with toggle-able data layers (actor, campaign, malware family, TTPs)",
      "Kibana Lens: drag-and-drop data layering for SIEM visualisations",
    ],
    tradeoffs: [
      {
        pro: "Dramatically reduces initial cognitive load on first encounter with unfamiliar data",
        con: "Analysts accustomed to all-data views find layered interfaces frustratingly slow for known workflows",
      },
      {
        pro: "Allows junior analysts to navigate without being overwhelmed, improving onboarding",
        con: "Risk of analysts never exploring beyond Layer 1, missing important context in lower layers",
      },
    ],
    antiPatterns: [
      "Network graphs with 500+ nodes and all edge types enabled by default",
      "Dashboards where every widget loads simultaneously, causing a 'wall of charts' effect",
      "No way to save a configured layer state — analysts must reconfigure every session",
    ],
    academicRefs: [
      {
        citation:
          "Shneiderman, B. (1996). 'The Eyes Have It.' Proceedings of IEEE Symposium on Visual Languages, 336–343.",
        note: "Introduced the overview+detail+filter mantra that underpins most security visualisation design.",
      },
      {
        citation:
          "D'Amico, A. & Whitley, K. (2008). 'The Real Work of Computer Network Defense Analysts.' VizSec '08.",
        note: "Observational study of analyst cognitive workflows that informed layered visualisation design principles.",
      },
    ],
    relatedScenarios: ["salt-typhoon", "moveit"],
  },

  // ── Access Control UX ────────────────────────────────────────────────────

  {
    id: "contextual-access-prompts",
    name: "Contextual Access Prompts",
    category: "Access Control UX",
    tagline: "Request permission when the user has context for the decision, not upfront.",
    problem:
      "Traditional permission models front-load access requests at login or application launch. Users grant broad permissions they do not understand, in a context divorced from the action. This produces consent without comprehension — the root cause of over-privileged service accounts and rubber-stamped MFA prompts.",
    hciPrinciple:
      "Contextual integrity (Nissenbaum, 2004) — information flows feel appropriate when the context of request matches the context of use. Prompting at the moment of the action, with task-relevant explanation, maximises comprehension and enables informed consent.",
    realToolExamples: [
      "iOS: camera permission requested when camera is first invoked, not at app install",
      "Azure PIM: Just-In-Time role elevation at the moment of need with justification field",
      "Okta Verify: number-matching MFA that provides attack context at verification time",
      "CyberArk EPM: least-privilege elevation prompts triggered at the action with policy rationale",
    ],
    tradeoffs: [
      {
        pro: "Users make better-informed decisions when request context matches action context",
        con: "Just-in-time prompts can interrupt flow state and feel obstructive during critical workflows",
      },
      {
        pro: "Reduces scope of over-privileged access — users only grant what they actively need",
        con: "Frequent prompts at fine-grained permission levels recreate alert fatigue in the access control layer",
      },
      {
        pro: "Aligns with Zero Trust principles — verify continuously rather than trust at boundary",
        con: "Legacy systems and APIs often lack the hooks for contextual prompts, creating inconsistent UX",
      },
    ],
    antiPatterns: [
      "Bulk permission consent screens at installation/onboarding: 'This app needs access to: [20 permissions]'",
      "Silent elevation that grants admin rights without notifying the user",
      "Permission denial with no explanation of what functionality is lost or how to re-grant",
      "MFA prompts with only approve/deny and no context about what is being authenticated",
    ],
    academicRefs: [
      {
        citation:
          "Nissenbaum, H. (2004). 'Privacy as Contextual Integrity.' Washington Law Review, 79(1), 119–157.",
        note: "The theoretical foundation for context-appropriate information requests; widely cited in security UX research.",
      },
      {
        citation:
          "Felt, A.P. et al. (2012). 'Android Permissions: User Attention, Comprehension, and Behavior.' SOUPS '12.",
        note: "Demonstrated that front-loaded permission models produce informed consent in fewer than 17% of users.",
      },
    ],
    relatedScenarios: ["uber-2022", "colonial-pipeline"],
  },
];

export const patternCategories: PatternCategory[] = [
  "Alert Design",
  "Automation UX",
  "Data Visualisation",
  "Access Control UX",
];

export function getPatternsByCategory(category: PatternCategory): Pattern[] {
  return patterns.filter((p) => p.category === category);
}

export function getPatternById(id: string): Pattern | undefined {
  return patterns.find((p) => p.id === id);
}
