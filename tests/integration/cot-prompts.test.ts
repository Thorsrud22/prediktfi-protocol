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
    wrapGrounding(
      {
        valid: true,
        mintAuthority: false,
        freezeAuthority: false,
        supply: 1_000_000,
        decimals: 9,
        isPumpFun: false,
        isLiquidityLocked: true,
      },
      "onchain_rpc",
      new Date(),
      1
    )
  ),
}));

vi.mock("@/lib/market/competitive", () => ({
  fetchCompetitiveMemo: vi.fn().mockResolvedValue({
    status: "ok",
    memo: {
      categoryLabel: "DeFi - Lending",
      crowdednessLevel: "high",
      shortLandscapeSummary: "Market is competitive with strong incumbents.",
      referenceProjects: [{ name: "Aave", chainOrPlatform: "Ethereum", note: "Benchmark" }],
      tractionDifficulty: { label: "high", explanation: "Crowded segment" },
      differentiationWindow: { label: "narrow", explanation: "Need stronger wedge" },
      noiseVsSignal: "mixed",
      evaluatorNotes: "Execution quality matters most.",
      claims: [],
      timestamp: new Date().toISOString(),
    },
    evidencePack: { evidence: [], generatedAt: new Date().toISOString(), unavailableSources: [] },
    grounding: wrapGrounding(
      { category: "defi", evidenceCount: 0, unavailableSources: [] },
      "competitive_memo",
      new Date(),
      72
    ),
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

describe("committee CoT prompt structure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ships explicit section-header CoT instructions for bear, bull, and judge", async () => {
    const bearPayload = {
      bearAnalysis: {
        fatalFlaws: ["No moat"],
        riskScore: 80,
        verdict: "AVOID",
        roast: "Weak moat and poor distribution edge.",
      },
    };
    const bullPayload = {
      bullAnalysis: {
        alphaSignals: ["Large market"],
        upsideScore: 72,
        verdict: "LONG",
        pitch: "Demand exists if execution is disciplined.",
      },
    };
    const judgePayload = {
      overallScore: 64,
      summary: {
        title: "Potential with constraints",
        oneLiner: "Opportunity exists but risk discipline is required.",
        mainVerdict: "Watchlist",
      },
      technical: {
        feasibilityScore: 63,
        keyRisks: ["Execution risk"],
        requiredComponents: ["Security plan"],
        comments: "Feasible with careful scope control.",
      },
      tokenomics: {
        tokenNeeded: true,
        designScore: 55,
        mainIssues: ["Utility unclear"],
        suggestions: ["Clarify token demand driver"],
      },
      market: {
        marketFitScore: 62,
        targetAudience: ["DeFi users"],
        competitorSignals: ["Strong incumbents"],
        goToMarketRisks: ["Acquisition cost"],
      },
      execution: {
        complexityLevel: "medium",
        founderReadinessFlags: ["Small team"],
        estimatedTimeline: "4-6 months",
        executionRiskScore: 60,
        executionRiskLabel: "medium",
        executionSignals: ["MVP feasible"],
      },
      recommendations: {
        mustFixBeforeBuild: ["Risk controls"],
        recommendedPivots: [],
        niceToHaveLater: ["Additional integrations"],
      },
      structuredAnalysis: "## EVIDENCE\n- [MARKET_SNAPSHOT] ...\n## OVERALL\n- Confidence: MEDIUM",
    };

    mockCreate
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify(bearPayload) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify(bullPayload) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify(judgePayload) } }] });

    const { evaluateWithCommittee } = await import("@/lib/ai/committee");
    await evaluateWithCommittee({
      description: "DeFi lending product with improved collateral efficiency.",
      projectType: "defi",
      teamSize: "team_2_5",
      resources: ["developers"],
      successDefinition: "PMF",
      responseStyle: "balanced",
      mvpScope: "Single-market launch",
    } as any);

    const bearSystem = mockCreate.mock.calls[0][0].messages[0].content as string;
    const bullSystem = mockCreate.mock.calls[1][0].messages[0].content as string;
    const judgeSystem = mockCreate.mock.calls[2][0].messages[0].content as string;
    const judgeUser = mockCreate.mock.calls[2][0].messages[1].content as string;

    expect(bearSystem).toContain("## EVIDENCE");
    expect(bearSystem).toContain("Sub-score: X/10");
    expect(bearSystem).toContain("structuredAnalysis");
    expect(bullSystem).toContain("## OVERALL");
    expect(bullSystem).toContain("evidence -> reasoning -> uncertainty -> sub-score");
    expect(judgeSystem).toContain("validate and calibrate committee scores");
    expect(judgeSystem).toContain("structuredAnalysis");

    expect(judgeUser).toContain("SCORING RUBRIC");
    expect(judgeUser).toContain("STRUCTURED GROUNDING BRIEF");
  });
});
