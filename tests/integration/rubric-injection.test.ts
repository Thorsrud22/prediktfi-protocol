import { beforeEach, describe, expect, it, vi } from "vitest";
import { wrapGrounding } from "@/lib/market/types";

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
  verifyTokenSecurityEnvelope: vi.fn().mockResolvedValue(
    {
      data: {
        valid: true,
        mintAuthority: false,
        freezeAuthority: false,
        supply: 1_000_000,
        decimals: 9,
        isPumpFun: false,
        isLiquidityLocked: true,
      },
      fetchedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
      stalenessHours: 2,
      source: "onchain_rpc",
      ttlHours: 1,
      isStale: true,
    }
  ),
}));

vi.mock("@/lib/market/competitive", () => ({
  fetchCompetitiveMemo: vi.fn().mockResolvedValue({
    status: "ok",
    memo: {
      categoryLabel: "DeFi - Lending",
      crowdednessLevel: "high",
      shortLandscapeSummary: "Competitive but still room for focused execution.",
      referenceProjects: [
        {
          name: "Aave",
          chainOrPlatform: "Ethereum",
          note: "Market leader",
          metrics: { tvl: "$8B" },
        },
      ],
      tractionDifficulty: { label: "high", explanation: "Incumbents are entrenched." },
      differentiationWindow: { label: "narrow", explanation: "Need sharper wedge." },
      noiseVsSignal: "mixed",
      evaluatorNotes: "Distribution and risk controls are key.",
      claims: [],
      timestamp: new Date().toISOString(),
    },
    evidencePack: {
      evidence: [],
      generatedAt: new Date().toISOString(),
      unavailableSources: [],
    },
    grounding: {
      data: { category: "defi", evidenceCount: 0, unavailableSources: [] },
      fetchedAt: new Date().toISOString(),
      stalenessHours: 0,
      source: "competitive_memo",
      ttlHours: 72,
      isStale: false,
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
    qualityWarnings: [],
    internalWarnings: [],
    repairsUsed: 0,
    checksRun: 0,
    checksFailed: 0,
    fatalFailure: false,
  })),
}));

describe("rubric + grounding prompt injection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("injects scoring rubric and structured grounding brief into committee prompts", async () => {
    const bearPayload = {
      bearAnalysis: {
        fatalFlaws: ["No clear moat"],
        riskScore: 82,
        verdict: "AVOID",
        roast: "Distribution looks fragile and moat is weak.",
      },
    };

    const bullPayload = {
      bullAnalysis: {
        alphaSignals: ["Clear user pain in lending UX"],
        upsideScore: 73,
        verdict: "LONG",
        pitch: "A narrow but credible wedge if execution is disciplined.",
      },
    };

    const judgePayload = {
      overallScore: 64,
      reasoningSteps: ["Reviewing Bear Case: moat risk...", "Reviewing Bull Case: user pain...", "Synthesizing final verdict..."],
      summary: {
        title: "High potential, high execution burden",
        oneLiner: "Credible wedge with meaningful execution risk.",
        mainVerdict: "Watchlist with strict milestone gating",
      },
      technical: {
        feasibilityScore: 63,
        keyRisks: ["Smart contract safety", "Distribution risk"],
        requiredComponents: ["Audit", "Liquidity strategy"],
        comments: "Technically feasible with disciplined scope.",
      },
      tokenomics: {
        tokenNeeded: true,
        designScore: 58,
        mainIssues: ["Utility needs tighter definition"],
        suggestions: ["Tie incentives to verifiable usage"],
      },
      market: {
        marketFitScore: 66,
        targetAudience: ["Active DeFi users"],
        competitorSignals: ["Incumbents are strong"],
        goToMarketRisks: ["Acquisition cost could be high"],
      },
      execution: {
        complexityLevel: "medium",
        founderReadinessFlags: ["Team is lean"],
        estimatedTimeline: "4-6 months",
        executionRiskScore: 60,
        executionRiskLabel: "medium",
        executionSignals: ["Feasible if scope is narrow"],
      },
      recommendations: {
        mustFixBeforeBuild: ["Security and liquidity plan"],
        recommendedPivots: [],
        niceToHaveLater: ["Expand cross-chain support"],
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
        choices: [{ message: { content: JSON.stringify(judgePayload) } }],
      });

    const { evaluateWithCommittee } = await import("@/lib/ai/committee");
    const marketGrounding = wrapGrounding(
      {
        timestamp: new Date().toISOString(),
        btcDominance: 53.2,
        solPriceUsd: 172.4,
        source: "coingecko",
      },
      "market_snapshot_api",
      new Date(),
      72
    );

    await evaluateWithCommittee(
      {
        description: "A DeFi product that improves collateral efficiency for under-served users.",
        projectType: "defi",
        teamSize: "team_2_5",
        resources: ["developers"],
        successDefinition: "Reach PMF in one lending segment",
        responseStyle: "balanced",
        mvpScope: "Single-market launch with conservative risk params",
      } as any,
      {
        market: marketGrounding.data,
        marketGrounding,
      }
    );

    const bearUserPrompt = mockCreate.mock.calls[0][0].messages[1].content as string;
    const judgeUserPrompt = mockCreate.mock.calls[2][0].messages[1].content as string;

    expect(bearUserPrompt).toContain("SCORING RUBRIC");
    expect(bearUserPrompt).toContain("Market Opportunity");
    expect(bearUserPrompt).toContain("Domain calibration (DeFi)");
    expect(bearUserPrompt).toContain("STRUCTURED GROUNDING BRIEF");
    expect(bearUserPrompt).toContain("[MARKET_SNAPSHOT]");
    expect(bearUserPrompt).toContain("[TOKEN_SECURITY]");
    expect(bearUserPrompt).toContain("[COMPETITIVE_MEMO]");

    expect(judgeUserPrompt).toContain("SCORING RUBRIC");
    expect(judgeUserPrompt).toContain("STRUCTURED GROUNDING BRIEF");
  });
});
