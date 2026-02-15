import { describe, expect, test } from "vitest";
import { extractNumericalClaims } from "@/lib/ai/parser";
import { groundingStalenessNote } from "@/lib/ai/prompts";
import {
  computeDataFreshness,
  deriveConfidence,
} from "@/lib/ai/trust-metrics";
import { runVerification, verifyClaimsAgainstGrounding } from "@/lib/ai/verifier";
import { wrapGrounding, type GroundingEnvelope } from "@/lib/market/types";
import type { IdeaEvaluationResult } from "@/lib/ideaEvaluationTypes";

function makeResult(overrides: Partial<IdeaEvaluationResult> = {}): IdeaEvaluationResult {
  return {
    overallScore: 65,
    summary: {
      title: "DeFi Lending Opportunity",
      oneLiner:
        "A targeted DeFi lending product with clear user demand and moderate execution complexity.",
      mainVerdict:
        "Watchlist: strong potential, but requires tighter risk controls before launch.",
    },
    technical: {
      feasibilityScore: 62,
      keyRisks: [
        "Smart contract vulnerabilities could impact user funds.",
        "Cross-chain complexity increases attack surface.",
      ],
      requiredComponents: [
        "Audited lending contracts",
        "Rate model and collateral engine",
      ],
      comments:
        "The architecture is feasible with a focused scope, but security and oracle handling are critical.",
    },
    tokenomics: {
      tokenNeeded: true,
      designScore: 54,
      mainIssues: ["Utility is still partially speculative."],
      suggestions: ["Tie token usage to clear product demand loops."],
    },
    market: {
      marketFitScore: 60,
      targetAudience: ["Yield-focused DeFi users", "Active cross-chain traders"],
      competitorSignals: [
        "Aave dominates established demand in the lending segment.",
        "Compound remains a core benchmark for collateralized lending.",
      ],
      goToMarketRisks: [
        "Liquidity bootstrapping may be slow without anchor integrations.",
        "User migration from incumbents is difficult without clear edge.",
      ],
      competitors: [
        {
          name: "Aave",
          metrics: { tvl: "$8.0B" },
        },
      ],
    },
    execution: {
      complexityLevel: "medium",
      founderReadinessFlags: ["Small team with limited audit budget"],
      estimatedTimeline: "4-6 months",
      executionRiskScore: 56,
      executionRiskLabel: "medium",
      executionSignals: ["MVP feasible if scope is constrained early."],
    },
    recommendations: {
      mustFixBeforeBuild: [
        "Complete external security audit before mainnet deployment.",
      ],
      recommendedPivots: [],
      niceToHaveLater: ["Expand to additional chains after PMF validation."],
    },
    ...overrides,
  };
}

function makeGroundingPayload(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    market_size_usd: 14_500_000_000,
    growth_rate_pct: 18,
    tvl_usd: 8_200_000_000,
    competitor_count: 15,
    ...overrides,
  };
}

function freshEnvelope<T>(
  data: T,
  source: string,
  ttlHours: number
): GroundingEnvelope<T> {
  return wrapGrounding(data, source, new Date(), ttlHours);
}

function staleEnvelope<T>(
  data: T,
  source: string,
  ttlHours: number,
  hoursAgo: number
): GroundingEnvelope<T> {
  return wrapGrounding(data, source, new Date(Date.now() - hoursAgo * 3_600_000), ttlHours);
}

describe("phase1 e2e", () => {
  test("clean evaluation with fresh data passes verification and claim checks", async () => {
    const envelopes = [
      freshEnvelope({ market_size_usd: 14_500_000_000 }, "market_snapshot", 72),
      freshEnvelope({ competitors: ["Aave", "Compound"] }, "competitive_api", 72),
      freshEnvelope({ isVerified: true }, "solana_rpc", 1),
    ];
    const freshness = computeDataFreshness(envelopes);
    expect(freshness.overallFreshness).toBeGreaterThan(0.9);
    expect(freshness.staleSourceCount).toBe(0);
    expect(groundingStalenessNote(freshness)).toBe("");

    const result = makeResult({
      technical: {
        ...makeResult().technical,
        comments:
          "The DeFi market opportunity is approximately $14.5 billion and growing near 18% annually with clear demand.",
      },
    });

    const verified = await runVerification(result, { maxRepairs: 2 });
    expect(verified.fatalFailure).toBe(false);
    expect(verified.qualityWarnings).toHaveLength(0);

    const claims = extractNumericalClaims({
      technical: result.technical.comments,
    });
    const claimResult = verifyClaimsAgainstGrounding(claims, makeGroundingPayload());
    expect(claimResult.contradictedClaims).toBe(0);
    expect(claimResult.groundedClaims).toBeGreaterThanOrEqual(1);
  });

  test("stale data lowers freshness and emits warning note", () => {
    const envelopes = [
      staleEnvelope({ market_size_usd: 14_500_000_000 }, "market_snapshot", 72, 168),
      staleEnvelope({ isVerified: true }, "solana_rpc", 1, 48),
    ];

    const freshness = computeDataFreshness(envelopes);
    expect(freshness.staleSourceCount).toBe(2);
    expect(freshness.overallFreshness).toBeLessThan(0.5);

    const note = groundingStalenessNote(freshness);
    expect(note).toContain("market_snapshot");
    expect(note).toContain("solana_rpc");
  });

  test("no grounding sources yields low baseline freshness", () => {
    const freshness = computeDataFreshness([]);
    expect(freshness.overallFreshness).toBe(0.3);
    expect(freshness.totalSourceCount).toBe(0);
    expect(freshness.worstSource).toBeNull();
  });

  test("fatal verification failure on invalid score", async () => {
    const verified = await runVerification(makeResult({ overallScore: -5 }), {
      maxRepairs: 2,
    });
    expect(verified.fatalFailure).toBe(true);
    expect(verified.qualityWarnings[0]).toContain("Fatal");
  });

  test("contradicted claim is detected against grounding data", () => {
    const claims = extractNumericalClaims({
      marketAnalysis: "The total addressable market is estimated at $50 billion.",
    });
    const claimResult = verifyClaimsAgainstGrounding(
      claims,
      makeGroundingPayload({ market_size_usd: 14_500_000_000 })
    );
    expect(claimResult.contradictedClaims).toBeGreaterThanOrEqual(1);
    expect(claimResult.contradictions.length).toBeGreaterThanOrEqual(1);
  });

  test("qualitative-only sections produce no numerical claims", () => {
    const claims = extractNumericalClaims({
      summary:
        "The team has strong domain expertise and the market timing appears favorable.",
      risks:
        "Regulatory uncertainty and distribution challenges are notable concerns.",
    });
    expect(claims).toHaveLength(0);

    const claimResult = verifyClaimsAgainstGrounding(claims, makeGroundingPayload());
    expect(claimResult.totalClaims).toBe(0);
    expect(claimResult.contradictedClaims).toBe(0);
  });

  test("repair budget is respected", async () => {
    const problematic = makeResult({
      overallScore: 90,
      summary: {
        ...makeResult().summary,
        mainVerdict: "Not recommended due to significant execution risk.",
      },
      market: {
        ...makeResult().market,
        competitorSignals: [],
        competitors: [],
      },
    });

    let repairCalls = 0;
    const verified = await runVerification(problematic, {
      maxRepairs: 2,
      repairFn: async (draft) => {
        repairCalls += 1;
        return draft;
      },
    });

    expect(verified.repairsUsed).toBeLessThanOrEqual(2);
    expect(repairCalls).toBeLessThanOrEqual(2);
    expect(verified.qualityWarnings.length).toBeGreaterThan(0);
  });

  test("freshness penalty impacts confidence while fresh data does not", () => {
    const baseSignals = {
      evidenceCoverage: 0.9,
      verifierStatus: "pass" as const,
      fallbackUsed: false,
      externalDataAvailable: true,
      tavilyAvailable: true,
      defillamaRequired: false,
      defillamaAvailable: false,
      agentFailures: 0,
    };

    const baseline = deriveConfidence(baseSignals);
    const withFresh = deriveConfidence({
      ...baseSignals,
      dataFreshness: computeDataFreshness([
        freshEnvelope({ value: 1 }, "market_snapshot", 72),
      ]),
    });
    const withStale = deriveConfidence({
      ...baseSignals,
      dataFreshness: computeDataFreshness([
        staleEnvelope({ value: 1 }, "market_snapshot", 72, 240),
      ]),
    });

    expect(withFresh.score).toBe(baseline.score);
    expect(withStale.score).toBeLessThan(withFresh.score);
  });
});
