import type { Resource } from "@/types";

export const resources: Resource[] = [

  // ── Courses ───────────────────────────────────────────────────────────────

  {
    id: "course-sans-sec504",
    type: "course",
    title: "SEC504: Hacker Tools, Techniques & Incident Handling",
    author: "SANS Institute",
    description: "One of the most respected incident response courses available. Covers attacker techniques, detection, and response from a practitioner perspective.",
    url: "https://www.sans.org/cyber-security-courses/hacker-techniques-incident-handling/",
    cost: "paid",
    topics: ["incident response", "threat hunting", "attacker techniques"],
    platform: "SANS",
  },
  {
    id: "course-coursera-ibm-cyber",
    type: "course",
    title: "IBM Cybersecurity Analyst Professional Certificate",
    author: "IBM / Coursera",
    description: "A solid entry-to-mid level certificate covering security fundamentals, threat intelligence, and incident response — accessible and self-paced.",
    url: "https://www.coursera.org/professional-certificates/ibm-cybersecurity-analyst",
    cost: "freemium",
    topics: ["security fundamentals", "threat intelligence", "incident response"],
    platform: "Coursera",
  },
  {
    id: "course-cybrary-soc",
    type: "course",
    title: "SOC Analyst Career Path",
    author: "Cybrary",
    description: "Practical training for security operations center roles, with labs and scenario-based learning covering detection, triage, and response workflows.",
    url: "https://www.cybrary.it/career-path/soc-analyst",
    cost: "freemium",
    topics: ["SOC", "detection", "triage", "alert management"],
    platform: "Cybrary",
  },
  {
    id: "course-coursera-ux-security",
    type: "course",
    title: "Usable Security",
    author: "University of Maryland / Coursera",
    description: "Rare academic course at the intersection of HCI and security — covers how to design systems that are both secure and usable. Directly relevant to UX security research.",
    url: "https://www.coursera.org/learn/usable-security",
    cost: "freemium",
    topics: ["usable security", "HCI", "security UX", "authentication"],
    platform: "Coursera",
  },
  {
    id: "course-tryhackme-soc1",
    type: "course",
    title: "SOC Level 1 Learning Path",
    author: "TryHackMe",
    description: "Hands-on, gamified learning path for SOC analyst skills. Great for building intuition for how attacks look from a defender's perspective.",
    url: "https://tryhackme.com/path/outline/soclevel1",
    cost: "freemium",
    topics: ["SOC", "detection", "SIEM", "malware analysis"],
    platform: "TryHackMe",
  },

  // ── Books ─────────────────────────────────────────────────────────────────

  {
    id: "book-countdown-to-zero-day",
    type: "book",
    title: "Countdown to Zero Day",
    author: "Kim Zetter",
    description: "The definitive account of Stuxnet — how the world's first cyber weapon was built and deployed. Essential reading for understanding nation-state operations.",
    url: "https://www.penguinrandomhouse.com/books/219931/countdown-to-zero-day-by-kim-zetter/",
    cost: "paid",
    topics: ["nation-state", "ICS/SCADA", "supply chain", "Stuxnet"],
    platform: "Book",
  },
  {
    id: "book-sandworm",
    type: "book",
    title: "Sandworm",
    author: "Andy Greenberg",
    description: "The story of Russia's most destructive cyber operations — NotPetya, the Ukraine grid attacks, and the Olympics attack. Reads like a thriller.",
    url: "https://www.penguinrandomhouse.com/books/597684/sandworm-by-andy-greenberg/",
    cost: "paid",
    topics: ["nation-state", "destructive malware", "critical infrastructure"],
    platform: "Book",
  },
  {
    id: "book-art-of-intrusion",
    type: "book",
    title: "The Art of Intrusion",
    author: "Kevin Mitnick",
    description: "Case studies of real intrusions told from the attacker's perspective — social engineering, physical access, and technical exploitation combined.",
    url: "https://www.wiley.com/en-us/The+Art+of+Intrusion-p-9780764569593",
    cost: "paid",
    topics: ["social engineering", "intrusion", "attacker mindset"],
    platform: "Book",
  },
  {
    id: "book-security-engineering",
    type: "book",
    title: "Security Engineering",
    author: "Ross Anderson",
    description: "The definitive textbook on building secure systems — deeply rooted in human factors and the reasons security fails at the human and organizational level.",
    url: "https://www.cl.cam.ac.uk/~rja14/book.html",
    cost: "free",
    topics: ["security engineering", "human factors", "system design", "HCI"],
    platform: "Book",
  },
  {
    id: "book-designing-with-the-mind",
    type: "book",
    title: "Designing with the Mind in Mind",
    author: "Jeff Johnson",
    description: "Cognitive science foundations for UX designers — directly applicable to understanding why security interfaces fail and how to improve them.",
    url: "https://www.elsevier.com/books/designing-with-the-mind-in-mind/johnson/978-0-12-818202-4",
    cost: "paid",
    topics: ["cognitive load", "HCI", "UX design", "human factors"],
    platform: "Book",
  },

  // ── Tools / Labs ──────────────────────────────────────────────────────────

  {
    id: "tool-hackthebox",
    type: "tool",
    title: "Hack The Box",
    author: "Hack The Box",
    description: "Industry-standard penetration testing lab environment. Excellent for building an attacker's mental model — essential context for defensive and UX security work.",
    url: "https://www.hackthebox.com",
    cost: "freemium",
    topics: ["penetration testing", "attacker mindset", "hands-on labs"],
    platform: "Hack The Box",
  },
  {
    id: "tool-splunk-free",
    type: "tool",
    title: "Splunk Free Training",
    author: "Splunk",
    description: "Free access to Splunk's core SIEM training. Understanding how analysts work with SIEM dashboards is critical context for designing better security interfaces.",
    url: "https://www.splunk.com/en_us/training/free-courses/overview.html",
    cost: "free",
    topics: ["SIEM", "log analysis", "SOC tooling", "detection"],
    platform: "Splunk",
  },
  {
    id: "tool-cyberdefenders",
    type: "tool",
    title: "CyberDefenders",
    author: "CyberDefenders",
    description: "Blue team focused labs with realistic incident response scenarios. Excellent for understanding the defender experience — what analysts actually see and do.",
    url: "https://cyberdefenders.org",
    cost: "freemium",
    topics: ["blue team", "incident response", "forensics", "detection"],
    platform: "CyberDefenders",
  },
  {
    id: "tool-mitre-attack",
    type: "tool",
    title: "MITRE ATT&CK Framework",
    author: "MITRE",
    description: "The canonical knowledge base of adversary tactics and techniques. Invaluable for mapping incident scenarios to structured threat intelligence.",
    url: "https://attack.mitre.org",
    cost: "free",
    topics: ["threat intelligence", "attacker techniques", "TTPs", "incident mapping"],
    platform: "MITRE",
  },

  // ── YouTube ───────────────────────────────────────────────────────────────

  {
    id: "yt-darknet-diaries",
    type: "youtube",
    title: "Darknet Diaries",
    author: "Jack Rhysider",
    description: "Narrative podcast and YouTube channel covering real cybercrime, espionage, and hacking stories. Exceptional storytelling that makes complex incidents accessible.",
    url: "https://www.youtube.com/@darknetdiaries",
    cost: "free",
    topics: ["incident stories", "social engineering", "nation-state", "cybercrime"],
    platform: "YouTube",
  },
  {
    id: "yt-john-hammond",
    type: "youtube",
    title: "John Hammond",
    author: "John Hammond",
    description: "Malware analysis, CTF walkthroughs, and threat intelligence breakdowns. One of the clearest technical explainers on YouTube for security concepts.",
    url: "https://www.youtube.com/@_JohnHammond",
    cost: "free",
    topics: ["malware analysis", "CTF", "threat intelligence", "hands-on"],
    platform: "YouTube",
  },
  {
    id: "yt-liveoverflow",
    type: "youtube",
    title: "LiveOverflow",
    author: "LiveOverflow",
    description: "Deep technical security content — binary exploitation, web vulnerabilities, and CTF challenges explained with exceptional clarity and intellectual honesty.",
    url: "https://www.youtube.com/@LiveOverflow",
    cost: "free",
    topics: ["exploitation", "web security", "CTF", "vulnerability research"],
    platform: "YouTube",
  },
  {
    id: "yt-hak5",
    type: "youtube",
    title: "Hak5",
    author: "Hak5",
    description: "Hands-on hardware hacking, pentesting tools, and practical security demonstrations. Great for understanding physical and social engineering attack vectors.",
    url: "https://www.youtube.com/@hak5",
    cost: "free",
    topics: ["hardware hacking", "social engineering", "pentesting tools"],
    platform: "YouTube",
  },

  // ── Reddit ────────────────────────────────────────────────────────────────

  {
    id: "reddit-netsec",
    type: "reddit",
    title: "r/netsec",
    author: "reddit.com/r/netsec",
    description: "The highest signal security subreddit — technical vulnerability disclosures, research papers, and incident analyses. Low noise, high quality.",
    url: "https://www.reddit.com/r/netsec/",
    cost: "free",
    topics: ["vulnerability research", "incident analysis", "security research"],
    platform: "Reddit",
  },
  {
    id: "reddit-cybersecurity",
    type: "reddit",
    title: "r/cybersecurity",
    author: "reddit.com/r/cybersecurity",
    description: "Broader security community discussion — news, career advice, tool recommendations, and incident commentary. Good for staying current on the field.",
    url: "https://www.reddit.com/r/cybersecurity/",
    cost: "free",
    topics: ["security news", "career", "tools", "community"],
    platform: "Reddit",
  },
  {
    id: "reddit-securityux",
    type: "reddit",
    title: "r/UXDesign (security threads)",
    author: "reddit.com/r/UXDesign",
    description: "While not security-specific, this community regularly surfaces threads on security UX, authentication design, and privacy-by-design — worth following for HCI angles.",
    url: "https://www.reddit.com/r/UXDesign/",
    cost: "free",
    topics: ["UX design", "security UX", "authentication", "privacy"],
    platform: "Reddit",
  },
  {
    id: "reddit-blueteamsec",
    type: "reddit",
    title: "r/blueteamsec",
    author: "reddit.com/r/blueteamsec",
    description: "Focused on defensive security — detection engineering, threat hunting, and incident response. Shares high quality research and tooling.",
    url: "https://www.reddit.com/r/blueteamsec/",
    cost: "free",
    topics: ["blue team", "detection", "threat hunting", "incident response"],
    platform: "Reddit",
  },

  // ── Experts ───────────────────────────────────────────────────────────────

  {
    id: "expert-krebs",
    type: "expert",
    title: "Brian Krebs",
    author: "Brian Krebs",
    description: "Investigative journalist and the foremost chronicler of cybercrime — his reporting on incidents is often the most detailed available anywhere.",
    url: "https://krebsonsecurity.com",
    cost: "free",
    topics: ["cybercrime", "incident reporting", "ransomware", "fraud"],
    platform: "Blog / Social",
    socials: {
      twitter: "https://twitter.com/briankrebs",
      website: "https://krebsonsecurity.com",
    },
  },
  {
    id: "expert-schneier",
    type: "expert",
    title: "Bruce Schneier",
    author: "Bruce Schneier",
    description: "Security technologist and policy expert whose work consistently bridges technical security with human, organizational, and societal factors.",
    url: "https://www.schneier.com",
    cost: "free",
    topics: ["security policy", "human factors", "cryptography", "risk"],
    platform: "Blog / Social",
    socials: {
      twitter: "https://twitter.com/schneierblog",
      website: "https://www.schneier.com",
    },
  },
  {
    id: "expert-grugq",
    type: "expert",
    title: "The Grugq",
    author: "@thegrugq",
    description: "Operational security researcher and threat intelligence analyst with sharp, practical takes on attacker tradecraft and OPSEC.",
    url: "https://twitter.com/thegrugq",
    cost: "free",
    topics: ["OPSEC", "threat intelligence", "attacker tradecraft", "nation-state"],
    platform: "Twitter/X",
    socials: {
      twitter: "https://twitter.com/thegrugq",
    },
  },
  {
    id: "expert-tavita",
    type: "expert",
    title: "Lesley Carhart (hacks4pancakes)",
    author: "Lesley Carhart",
    description: "ICS/SCADA security expert and incident responder at Dragos. Exceptionally clear communicator on critical infrastructure threats and defender workflows.",
    url: "https://twitter.com/hacks4pancakes",
    cost: "free",
    topics: ["ICS/SCADA", "critical infrastructure", "incident response", "blue team"],
    platform: "Twitter/X",
    socials: {
      twitter: "https://twitter.com/hacks4pancakes",
      website: "https://tisiphone.net",
    },
  },
  {
    id: "expert-swiftonsecurity",
    type: "expert",
    title: "SwiftOnSecurity",
    author: "@SwiftOnSecurity",
    description: "Influential security practitioner known for sharp, accessible takes on detection engineering, Windows security, and enterprise defense.",
    url: "https://twitter.com/SwiftOnSecurity",
    cost: "free",
    topics: ["detection engineering", "Windows security", "enterprise defense"],
    platform: "Twitter/X",
    socials: {
      twitter: "https://twitter.com/SwiftOnSecurity",
    },
  },
];

export const RESOURCE_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; bdr: string }> = {
  course:  { label: "Course",   icon: "◈", color: "#5a7c3a", bg: "#edf4e4", bdr: "#b0cc90" },  // leaf
  book:    { label: "Book",     icon: "◇", color: "#c8924a", bg: "#f5ede0", bdr: "#d8c4a4" },  // oak
  tool:    { label: "Tool",     icon: "⬡", color: "#3d7a8a", bg: "#e8f2f5", bdr: "#a8ccd8" },  // pool
  youtube: { label: "YouTube", icon: "▷", color: "var(--clay)", bg: "var(--clay-bg)", bdr: "var(--clay-bdr)" }, // new clay which is kelly green
  reddit:  { label: "Reddit",   icon: "◎", color: "#3d7a8a", bg: "#e8f2f5", bdr: "#a8ccd8" },  // pool
  expert:  { label: "Expert",   icon: "◉", color: "#c8924a", bg: "#f5ede0", bdr: "#d8c4a4" },  // oak
};

export const RESOURCE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; bdr: string }> = {
  saved:          { label: "Saved",          color: "#3d7a8a", bg: "#e8f2f5", bdr: "#a8ccd8" },  // pool
  in_progress:    { label: "In Progress",    color: "#c8924a", bg: "#f5ede0", bdr: "#d8c4a4" },  // oak
  completed:      { label: "Completed",      color: "#5a7c3a", bg: "#edf4e4", bdr: "#b0cc90" },  // leaf
  not_interested: { label: "Not Interested", color: "#6b6560", bg: "#e8e5e1", bdr: "#b8b4ac" },  // concrete dim
};

export const COST_CONFIG: Record<string, { label: string; color: string }> = {
  free:     { label: "Free",     color: "#5a7c3a" },  // leaf
  freemium: { label: "Freemium", color: "#c8924a" },  // oak
  paid:     { label: "Paid",     color: "#6b6560" },  // concrete dim
};
