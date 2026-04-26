-- Seed data for the feed_items table
-- Run this in the Supabase SQL editor or as a migration after 001_initial_schema.sql
-- Covers: Salt Typhoon, CHI 2024 alert fatigue, Colonial Pipeline, SOAR trust,
--         MITRE ATT&CK usability, MOVEit, Zero Trust UX, Threat Intel Visualisation

INSERT INTO feed_items (title, source, excerpt, url, lens, effort, topic, published_at, is_featured)
VALUES

(
  'CISA Advisory AA24-038A: Salt Typhoon Telecom Infrastructure Compromise',
  'CISA / NSA Joint Advisory',
  'Chinese state-sponsored actor Salt Typhoon achieved persistent access to major US telecommunications carriers by exploiting management plane interfaces and abusing legitimate administrative credentials. The advisory details lateral movement techniques across BGP routing infrastructure and highlights the absence of multi-factor authentication on network management systems as a critical enabler. Analysts are directed to review device authentication architecture and network segmentation posture.',
  'https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-038a',
  'analyst',
  '15min',
  'Telecom Infrastructure Attack',
  '2024-02-07',
  true
),

(
  'Alert Fatigue in Security Operations: Empirical Findings from CHI 2024',
  'ACM CHI 2024 — Human Factors in Security',
  'A controlled study of 48 SOC analysts found that alert queues exceeding 200 events per shift produced statistically significant increases in miss rate for critical severity alerts — peaking at 31% miss rate after hour four of a shift. The study also found that visual hierarchy redesigns (colour + position encoding for severity) reduced miss rate by 23% without increasing task time. Implications for SIEM dashboard design and analyst rotation scheduling are discussed.',
  'https://chi2024.acm.org',
  'hci',
  'deep',
  'Alert Fatigue in SOC',
  '2024-05-15',
  true
),

(
  'Colonial Pipeline Incident: Human Factors and Decision-Making Under Pressure',
  'Dragos / Idaho National Laboratory Analysis',
  'Post-incident reconstruction of the Colonial Pipeline ransomware response reveals multiple human-system interaction breakdowns: the decision to shut down OT systems was made without complete situational awareness; the control room lacked clear visualisation of IT/OT network boundaries; and incident responders worked from out-of-date network diagrams. The analysis highlights how decision latency was compounded by information asymmetry between IT security and pipeline operations personnel.',
  null,
  'commander',
  '15min',
  'Critical Infrastructure Response',
  '2023-11-20',
  false
),

(
  'Trust Calibration in SOAR-Augmented SOC Workflows',
  'IEEE S&P 2024 — Security & Privacy',
  'This longitudinal study embedded researchers in two enterprise SOCs for six months during SOAR platform rollout. Analysts initially over-trusted automated playbook verdicts, rubber-stamping isolation actions without review. After six weeks, over-trust shifted to systemic distrust following two false-positive host isolations that disrupted production services. The paper proposes a confidence transparency layer — displaying ML model certainty and contributing signals — as a calibration mechanism.',
  'https://www.ieee-security.org/TC/SP2024/',
  'hci',
  'deep',
  'Automation Trust Calibration',
  '2024-05-20',
  false
),

(
  'MITRE ATT&CK Framework: A Usability Study of Practitioner Navigation Patterns',
  'USENIX SOUPS 2023',
  'Eye-tracking and think-aloud sessions with 24 threat analysts revealed significant usability friction in ATT&CK Navigator: 63% of participants could not locate a relevant technique within 90 seconds without prior familiarity with the matrix layout. Search affordances were discovered late or not at all. The study recommends progressive disclosure of technique detail and intent-based search as alternatives to the current grid-first information architecture.',
  null,
  'hci',
  '15min',
  'Threat Framework UX',
  '2023-08-10',
  false
),

(
  'MOVEit Transfer Mass Exploitation: Post-Incident Technical and Organisational Analysis',
  'Mandiant / NCSC Joint Report',
  'The Cl0p ransomware group exploited a zero-day SQL injection vulnerability in MOVEit Transfer affecting over 2,500 organisations. The post-incident analysis identifies three systemic failure patterns: managed file transfer systems were excluded from vulnerability management programmes due to "appliance" classification; third-party risk assessments did not cover internet-facing file transfer endpoints; and initial exploitation went undetected for up to 30 days due to absence of dedicated file transfer audit logging.',
  null,
  'analyst',
  '15min',
  'Supply Chain Vulnerability',
  '2023-09-05',
  false
),

(
  'Zero Trust Architecture: UX Implications for Enterprise Analyst Workflows',
  'NIST / SANS Zero Trust Working Group',
  'Transitioning from perimeter-based to Zero Trust models introduces significant friction into analyst workflows: continuous re-authentication interrupts investigative flow; just-in-time privilege elevation adds latency to incident response; and microsegmentation makes lateral movement tracing more complex without adequate tooling. This report examines how five enterprise deployments balanced security posture improvements against analyst productivity, and recommends UX patterns for minimising workflow disruption during ZTA transitions.',
  'https://csrc.nist.gov/publications/detail/sp/800-207/final',
  'commander',
  '5min',
  'Zero Trust Architecture',
  '2024-01-15',
  true
),

(
  'Visualising Threat Intelligence: Cognitive Load and Graph Comprehension in Analyst Tasks',
  'VizSec 2023 — Workshop on Visualisation for Cyber Security',
  'An experiment presenting 36 analysts with network attack graphs of varying complexity found that node count exceeding 50 entities produced sharp drops in correct attribution of attacker infrastructure. Layered graph exploration — where analysts could toggle relationship categories — outperformed full-graph displays on both accuracy and time-to-conclusion metrics. Findings directly challenge the "more data = better analysis" assumption common in threat intelligence platform design.',
  null,
  'hci',
  'deep',
  'Threat Intel Visualization',
  '2023-10-30',
  false
);
