import { scenarios } from "@/lib/scenarios";
import ScenarioCard from "@/components/ScenarioCard";

export default function ScenariosPage() {
  return (
    <div style={{ padding: "48px 56px 80px", maxWidth: "980px" }}>

      {/* Header */}
      <div style={{ marginBottom: "40px", paddingBottom: "22px", borderBottom: "1px solid var(--border)" }}>
        <p style={{
          fontFamily: "var(--font-mono)", fontSize: "8px",
          letterSpacing: "0.28em", textTransform: "uppercase",
          color: "var(--text-dim)", marginBottom: "10px",
        }}>
          Module 01 — Scenarios
        </p>
        <h1 style={{
          fontSize: "26px", fontWeight: 600, color: "var(--text)",
          letterSpacing: "-0.02em", marginBottom: "10px",
        }}>
          Scenarios
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-mid)", lineHeight: 1.65, maxWidth: "480px" }}>
          Six landmark cyber incidents analysed through the Analyst, Commander,
          and HCI/UX lenses. Select a scenario to generate a full AI-powered breakdown.
        </p>
      </div>

      {/* Scenario grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1px",
        background: "var(--border)",
      }}>
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.slug}
            slug={scenario.slug}
            severity={scenario.severity}
            date={scenario.date}
            name={scenario.name}
            type={scenario.type}
            sector={scenario.sector}
            summary={scenario.summary}
            tags={scenario.tags}
          />
        ))}
      </div>

      {/* Footer note */}
      <p style={{
        marginTop: "20px", fontFamily: "var(--font-mono)", fontSize: "9px",
        color: "var(--text-dim)",
      }}>
        Analyses are AI-generated and cached for 7 days. First load may take a few seconds.
      </p>
    </div>
  );
}
