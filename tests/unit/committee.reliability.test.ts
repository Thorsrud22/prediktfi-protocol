import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCompetitiveMemo } from "@/lib/market/competitive";

const mockCreate = vi.fn();

vi.mock("@/lib/openaiClient", () => ({
  openai: () => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }),
}));

vi.mock("@/lib/solana/token-check", () => ({
  verifyTokenSecurity: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/market/competitive", () => ({
  fetchCompetitiveMemo: vi.fn().mockResolvedValue({
    status: "ok",
    memo: {
      categoryLabel: "Memecoin - Narrative",
      crowdednessLevel: "high",
      shortLandscapeSummary: "Competitive landscape is crowded.",
      referenceProjects: [
        {
          name: "CoinA",
          chainOrPlatform: "Solana",
          note: "Benchmark",
          metrics: { marketCap: "$10M", dailyUsers: "20k" },
        },
      ],
      tractionDifficulty: { label: "high", explanation: "Crowded market" },
      differentiationWindow: { label: "narrow", explanation: "Needs stronger wedge" },
      noiseVsSignal: "mixed",
      evaluatorNotes: "Moderate saturation.",
      claims: [
        {
          text: "CoinA has active traction.",
          evidenceIds: ["tavily_1"],
          claimType: "fact",
          support: "corroborated",
        },
      ],
      timestamp: new Date().toISOString(),
    },
    evidencePack: {
      evidence: [
        {
          id: "tavily_1",
          source: "tavily",
          title: "CoinA traction data",
          snippet: "CoinA reports user growth.",
          fetchedAt: new Date().toISOString(),
          reliabilityTier: "medium",
        },
      ],
      generatedAt: new Date().toISOString(),
    },
  }),
}));

vi.mock("@/lib/ai/calibration", () => ({
  calibrateScore: vi.fn().mockImplementation(({ rawResult }) => rawResult),
}));

vi.mock("@/lib/ai/verifier", () => ({
  runEvaluationVerifier: vi.fn().mockImplementation(async ({ draftResult }) => ({
    status: "pass",
    issues: [],
    repaired: false,
    result: draftResult,
  })),
}));

describe("committee reliability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("falls back to backup judge on primary timeout/failure and exposes fallback metadata", async () => {
    const bearPayload = {
      bearAnalysis: {
        fatalFlaws: ["No moat"],
        riskScore: 85,
        verdict: "AVOID",
        roast: "Weak defensibility.",
      },
    };

    const bullPayload = {
      bullAnalysis: {
        alphaSignals: ["Viral angle"],
        upsideScore: 78,
        verdict: "LONG",
        pitch: "Good narrative potential.",
      },
    };

    const finalEvaluation = {
      overallScore: 62,
      reasoningSteps: ["Reviewing Bear Case: moat risk", "Reviewing Bull Case: narrative alpha", "Synthesizing final verdict..."],
      summary: {
        title: "Balanced but risky",
        oneLiner: "Some upside, clear risk.",
        mainVerdict: "Watchlist",
      },
      technical: {
        feasibilityScore: 60,
        keyRisks: ["No moat"],
        requiredComponents: ["Distribution"],
        comments: "Needs clearer differentiation.",
      },
      tokenomics: {
        tokenNeeded: true,
        designScore: 58,
        mainIssues: ["Utility unclear"],
        suggestions: ["Tighten utility scope"],
      },
      market: {
        marketFitScore: 63,
        targetAudience: ["Speculative traders"],
        competitorSignals: ["Crowded category"],
        goToMarketRisks: ["Narrative fatigue"],
      },
      execution: {
        complexityLevel: "medium",
        founderReadinessFlags: ["Limited resources"],
        estimatedTimeline: "4-6 months",
        executionRiskScore: 55,
        executionRiskLabel: "medium",
        executionSignals: ["Possible with focus"],
      },
      recommendations: {
        mustFixBeforeBuild: ["Clarify moat"],
        recommendedPivots: [],
        niceToHaveLater: ["Community incentives"],
      },
      cryptoNativeChecks: {
        rugPullRisk: "medium",
        auditStatus: "none",
        liquidityStatus: "unclear",
        isAnonTeam: false,
      },
    };

    mockCreate
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(bearPayload) } }],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(bullPayload) } }],
      })
      .mockRejectedValueOnce(new Error("primary judge timeout"))
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(finalEvaluation) } }],
      });

    const { evaluateWithCommittee } = await import("@/lib/ai/committee");
    const result = await evaluateWithCommittee({
      description: "A memecoin utility dashboard with social loops and alpha terminal.",
      projectType: "memecoin",
      teamSize: "team_2_5",
      resources: ["developers", "budget"],
      successDefinition: "Reach 50k users",
      responseStyle: "balanced",
      mvpScope: "Token analytics and social leaderboard",
    } as any);

    expect(result.meta?.fallbackUsed).toBe(true);
    expect(result.meta?.modelRoute?.judgeFallback).toBe("gpt-4o-mini");
    expect(result.meta?.verifierStatus).toBe("pass");
    expect(result.evidence?.evidence.length).toBeGreaterThan(0);
    expect(result.confidenceLevel).toBeDefined();
  });

  it("returns a valid evaluation with degraded confidence when competitive sources are unavailable", async () => {
    (fetchCompetitiveMemo as any).mockResolvedValueOnce({
      status: "not_available",
      reason: "Upstream outage",
    });

    const bearPayload = {
      bearAnalysis: { riskScore: 60, verdict: "SHORT", roast: "Some risk remains." },
    };
    const bullPayload = {
      bullAnalysis: { upsideScore: 70, verdict: "LONG", pitch: "Still some upside." },
    };

    const finalEvaluation = {
      overallScore: 58,
      summary: { title: "Cautious setup", oneLiner: "Data gaps lower conviction.", mainVerdict: "Watchlist" },
      technical: { feasibilityScore: 55, keyRisks: ["Data gaps"], requiredComponents: [], comments: "Needs more evidence." },
      tokenomics: { tokenNeeded: true, designScore: 55, mainIssues: [], suggestions: [] },
      market: { marketFitScore: 57, targetAudience: [], competitorSignals: [], goToMarketRisks: ["Unclear data"] },
      execution: {
        complexityLevel: "medium",
        founderReadinessFlags: [],
        estimatedTimeline: "3-5 months",
        executionRiskScore: 52,
        executionRiskLabel: "medium",
        executionSignals: [],
      },
      recommendations: { mustFixBeforeBuild: ["Gather better market evidence"], recommendedPivots: [], niceToHaveLater: [] },
      cryptoNativeChecks: {
        rugPullRisk: "medium",
        auditStatus: "none",
        liquidityStatus: "unclear",
        isAnonTeam: false,
      },
    };

    mockCreate
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(bearPayload) } }],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(bullPayload) } }],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(finalEvaluation) } }],
      });

    const { evaluateWithCommittee } = await import("@/lib/ai/committee");
    const result = await evaluateWithCommittee({
      description: "A DeFi idea without market feeds available right now.",
      projectType: "defi",
      teamSize: "team_2_5",
      resources: ["developers"],
      successDefinition: "Ship MVP",
      responseStyle: "balanced",
      mvpScope: "Core lending flow",
    } as any);

    expect(result.overallScore).toBe(58);
    expect(result.evidence?.evidence.length).toBe(0);
    expect(result.meta?.confidenceLevel).not.toBe("high");
    expect(result.meta?.confidenceReasons?.some((reason) => reason.toLowerCase().includes("unavailable"))).toBe(true);
  });
});
