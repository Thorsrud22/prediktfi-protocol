import { describe, expect, it } from "vitest";
import {
  computeDebateDisagreementIndex,
  computeEvidenceCoverage,
  deriveConfidence,
} from "@/lib/ai/trust-metrics";

describe("trust metrics", () => {
  it("computes evidence coverage from factual claims", () => {
    const coverage = computeEvidenceCoverage([
      { text: "Fact A", claimType: "fact", evidenceIds: ["tavily_1"], support: "corroborated" },
      { text: "Fact B", claimType: "fact", evidenceIds: [], support: "uncorroborated" },
      { text: "Inference C", claimType: "inference", evidenceIds: [], support: "uncorroborated" },
    ]);

    expect(coverage).toBe(0.5);
  });

  it("drops confidence when external sources are unavailable", () => {
    const highSignals = deriveConfidence({
      evidenceCoverage: 0.9,
      verifierStatus: "pass",
      fallbackUsed: false,
      externalDataAvailable: true,
      tavilyAvailable: true,
      defillamaRequired: false,
      defillamaAvailable: false,
      agentFailures: 0,
    });

    const degradedSignals = deriveConfidence({
      evidenceCoverage: 0.9,
      verifierStatus: "pass",
      fallbackUsed: false,
      externalDataAvailable: false,
      tavilyAvailable: false,
      defillamaRequired: false,
      defillamaAvailable: false,
      agentFailures: 0,
    });

    expect(degradedSignals.score).toBeLessThan(highSignals.score);
    expect(["low", "medium"]).toContain(degradedSignals.level);
  });

  it("captures high disagreement between bear and bull", () => {
    const disagreement = computeDebateDisagreementIndex(
      { bearAnalysis: { riskScore: 92, verdict: "KILL" } },
      { bullAnalysis: { upsideScore: 95, verdict: "ALL IN" } }
    );
    expect(disagreement).toBeGreaterThan(70);
  });
});
