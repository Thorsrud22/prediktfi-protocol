import { describe, expect, it } from "vitest";
import { extractNumericalClaims } from "@/lib/ai/parser";
import {
  runVerification,
  verifyClaimsAgainstGrounding,
  type VerificationCheck,
} from "@/lib/ai/verifier";
import type { IdeaEvaluationResult } from "@/lib/ideaEvaluationTypes";

function buildResult(overrides: Partial<IdeaEvaluationResult> = {}): IdeaEvaluationResult {
  return {
    overallScore: 65,
    summary: {
      title: "Test",
      oneLiner: "Solid baseline result.",
      mainVerdict: "Watchlist",
    },
    technical: {
      feasibilityScore: 60,
      keyRisks: ["Execution risk"],
      requiredComponents: ["MVP"],
      comments: "Clear tradeoffs and manageable execution complexity.",
    },
    tokenomics: {
      tokenNeeded: true,
      designScore: 55,
      mainIssues: ["Utility unclear"],
      suggestions: ["Define token sinks"],
    },
    market: {
      marketFitScore: 58,
      targetAudience: ["Traders"],
      competitorSignals: ["Crowded market"],
      goToMarketRisks: ["Distribution uncertainty"],
    },
    execution: {
      complexityLevel: "medium",
      founderReadinessFlags: ["Small team"],
      estimatedTimeline: "4-6 months",
      executionRiskScore: 52,
      executionRiskLabel: "medium",
      executionSignals: ["Achievable with focus"],
    },
    recommendations: {
      mustFixBeforeBuild: ["Clarify moat"],
      recommendedPivots: [],
      niceToHaveLater: ["Partnership plan"],
    },
    ...overrides,
  };
}

describe("rule-based verifier", () => {
  it("fails fatal check for out-of-range score", async () => {
    const result = buildResult({ overallScore: -1 });
    const verified = await runVerification(result);
    expect(verified.fatalFailure).toBe(true);
    expect(verified.qualityWarnings[0]).toContain("Fatal verification failure");
  });

  it("respects repair budget", async () => {
    const check: VerificationCheck = {
      id: "always_fail",
      name: "Always fail",
      severity: "major",
      autoRepairable: true,
      maxRepairAttempts: 5,
      check: () => ({ passed: false, detail: "forced failure" }),
    };

    const verified = await runVerification(buildResult(), {
      checks: [check],
      maxRepairs: 2,
      repairFn: async (draft) => draft,
    });

    expect(verified.repairsUsed).toBe(2);
    expect(verified.qualityWarnings.length).toBe(1);
  });

  it("detects contradicted numerical claims against grounding", () => {
    const claims = extractNumericalClaims({
      market: "The market is worth $45 billion and growing at 23%.",
    });
    const verification = verifyClaimsAgainstGrounding(claims, {
      market_size_usd: 12_000_000_000,
      growth_rate_pct: 23,
    });

    expect(verification.totalClaims).toBeGreaterThan(0);
    expect(verification.contradictedClaims).toBeGreaterThan(0);
  });
});
