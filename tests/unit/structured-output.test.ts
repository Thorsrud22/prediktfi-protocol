import { describe, expect, it } from "vitest";
import { extractStructuredOutput } from "@/lib/ai/structured-output";

describe("structured-output extractor", () => {
  it("extracts sub-scores, composition, confidence, and grounding citations from well-formed text", () => {
    const raw = `
## EVIDENCE
- [MARKET_SNAPSHOT] BTC dominance remains elevated.
- [TOKEN_SECURITY] Mint authority revoked.
- [COMPETITIVE_MEMO] Category is crowded.

## MARKET OPPORTUNITY
- Evidence: [MARKET_SNAPSHOT], [COMPETITIVE_MEMO]
- Reasoning: Demand exists but differentiation pressure is high.
- Uncertainty: No direct retention data.
- Sub-score: 6.5/10

## TECHNICAL FEASIBILITY
- Evidence: [TOKEN_SECURITY]
- Reasoning: Build is feasible with constrained scope.
- Uncertainty: Audit depth unknown.
- Sub-score: 7/10

## COMPETITIVE MOAT
- Evidence: [COMPETITIVE_MEMO]
- Reasoning: Differentiation appears narrow.
- Uncertainty: Distribution channel not validated.
- Sub-score: 5/10

## EXECUTION READINESS
- Evidence: [MARKET_SNAPSHOT]
- Reasoning: MVP scope is realistic.
- Uncertainty: Team bandwidth unclear.
- Sub-score: 6/10

## OVERALL
- Composition: (0.30 × market) + (0.25 × technical) + (0.25 × moat) + (0.20 × execution)
- Final score: 6.1/10
- Confidence: MEDIUM
`;

    const extracted = extractStructuredOutput(raw);
    expect(extracted.parsed).toBe(true);
    expect(extracted.subScores.marketOpportunity.score).toBe(6.5);
    expect(extracted.subScores.technicalFeasibility.score).toBe(7);
    expect(extracted.compositionFormula).toContain("0.30 × market");
    expect(extracted.confidenceLevel).toBe("MEDIUM");
    expect(extracted.groundingCitations).toEqual(
      expect.arrayContaining(["MARKET_SNAPSHOT", "TOKEN_SECURITY", "COMPETITIVE_MEMO"])
    );
  });

  it("degrades gracefully on partial structured text", () => {
    const raw = `
## MARKET OPPORTUNITY
- Evidence: [MARKET_SNAPSHOT]
- Reasoning: There is demand.
- Sub-score: 6/10

## OVERALL
- Confidence: LOW
`;
    const extracted = extractStructuredOutput(raw);
    expect(extracted.parsed).toBe(true);
    expect(extracted.subScores.marketOpportunity.score).toBe(6);
    expect(extracted.warnings.some((warning) => warning.includes("Missing section"))).toBe(true);
  });

  it("returns parsed=false for unstructured text without throwing", () => {
    const extracted = extractStructuredOutput(
      "This is a normal paragraph without section headers or explicit structure."
    );
    expect(extracted.parsed).toBe(false);
    expect(extracted.warnings.some((warning) => warning.toLowerCase().includes("headers"))).toBe(true);
  });
});
