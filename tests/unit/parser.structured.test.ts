import { describe, expect, it } from "vitest";
import { parseEvaluationResponse } from "@/lib/ai/parser";

function basePayload() {
  return {
    overallScore: 66,
    summary: {
      title: "Promising with caveats",
      oneLiner: "The idea is viable but needs sharper differentiation.",
      mainVerdict: "Watchlist",
    },
    technical: {
      feasibilityScore: 67,
      keyRisks: ["Security debt risk"],
      requiredComponents: ["Audit"],
      comments: "Feasible with constrained scope.",
    },
    tokenomics: {
      tokenNeeded: true,
      designScore: 55,
      mainIssues: ["Utility unclear"],
      suggestions: ["Tie utility to usage"],
    },
    market: {
      marketFitScore: 63,
      targetAudience: ["Active traders"],
      competitorSignals: ["Crowded market"],
      goToMarketRisks: ["Acquisition cost"],
    },
    execution: {
      complexityLevel: "medium",
      founderReadinessFlags: ["Small team"],
      estimatedTimeline: "4 months",
      executionRiskScore: 58,
      executionRiskLabel: "medium",
      executionSignals: ["MVP feasible"],
    },
    recommendations: {
      mustFixBeforeBuild: ["Security hardening"],
      recommendedPivots: [],
      niceToHaveLater: ["Additional integrations"],
    },
  };
}

describe("parser structured output integration", () => {
  it("extracts structured fields when structuredAnalysis is present", () => {
    const payload = {
      ...basePayload(),
      structuredAnalysis: `
## EVIDENCE
- [MARKET_SNAPSHOT] Growth remains positive.
- [COMPETITIVE_MEMO] High crowdedness.

## MARKET OPPORTUNITY
- Evidence: [MARKET_SNAPSHOT], [COMPETITIVE_MEMO]
- Reasoning: Demand exists but competition is intense.
- Uncertainty: No cohort retention data.
- Sub-score: 6/10

## TECHNICAL FEASIBILITY
- Evidence: [MARKET_SNAPSHOT]
- Reasoning: Scope is implementable.
- Uncertainty: Load profile unknown.
- Sub-score: 7/10

## COMPETITIVE MOAT
- Evidence: [COMPETITIVE_MEMO]
- Reasoning: Moat is narrow.
- Uncertainty: Distribution not validated.
- Sub-score: 5/10

## EXECUTION READINESS
- Evidence: [MARKET_SNAPSHOT]
- Reasoning: Team can ship MVP.
- Uncertainty: Hiring timeline unclear.
- Sub-score: 6/10

## OVERALL
- Composition: (0.30 × market) + (0.25 × technical) + (0.25 × moat) + (0.20 × execution)
- Final score: 6.0/10
- Confidence: LOW
`,
    };

    const response = {
      choices: [{ message: { content: JSON.stringify(payload) } }],
    };

    const parsed = parseEvaluationResponse(response);
    expect(parsed.meta?.structuredOutputParsed).toBe(true);
    expect(parsed.subScores?.marketOpportunity.score).toBe(6);
    expect(parsed.compositionFormula).toContain("0.30 × market");
    expect(parsed.modelConfidenceLevel).toBe("LOW");
    expect(parsed.groundingCitations).toContain("MARKET_SNAPSHOT");
  });

  it("falls back cleanly when structuredAnalysis is missing", () => {
    const response = {
      choices: [{ message: { content: JSON.stringify(basePayload()) } }],
    };
    const parsed = parseEvaluationResponse(response);
    expect(parsed.overallScore).toBe(66);
    expect(parsed.meta?.structuredOutputParsed).toBe(false);
    expect(parsed.meta?.structuredOutputWarnings?.length).toBeGreaterThan(0);
  });
});
