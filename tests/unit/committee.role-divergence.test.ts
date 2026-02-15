import { beforeEach, describe, expect, it, vi } from "vitest";

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
  verifyTokenSecurityEnvelope: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/market/competitive", () => ({
  fetchCompetitiveMemo: vi.fn().mockResolvedValue({
    status: "not_available",
    reason: "No memo needed in this test",
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

describe("committee role divergence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies specialized role prompts and computes disagreement metadata", async () => {
    const bearPayload = {
      bearAnalysis: {
        riskScore: 90,
        verdict: "KILL",
        roast: "Downside risk is severe.",
      },
      roleScores: {
        technicalFeasibility: 2,
        failureModes: 2,
        competitiveThreats: 3,
        regulatoryRisk: 1,
      },
    };

    const bullPayload = {
      bullAnalysis: {
        upsideScore: 90,
        verdict: "ALL IN",
        pitch: "Huge upside if this lands.",
      },
      roleScores: {
        marketOpportunity: 9,
        growthTrajectory: 8,
        customerDemand: 9,
        timingWindow: 8,
      },
    };

    const judgePayload = {
      overallScore: 68,
      summary: {
        title: "Divergent committee",
        oneLiner: "Upside is large but execution risk is substantial.",
        mainVerdict: "Watchlist",
      },
      technical: {
        feasibilityScore: 60,
        keyRisks: ["Execution complexity"],
        requiredComponents: ["Focus"],
        comments: "Balanced with caution.",
      },
      tokenomics: {
        tokenNeeded: true,
        designScore: 58,
        mainIssues: ["Utility uncertainty"],
        suggestions: ["Tie value to usage"],
      },
      market: {
        marketFitScore: 70,
        targetAudience: ["Early adopters"],
        competitorSignals: ["Competitive market"],
        goToMarketRisks: ["Costly distribution"],
      },
      execution: {
        complexityLevel: "medium",
        founderReadinessFlags: [],
        estimatedTimeline: "4-6 months",
        executionRiskScore: 62,
        executionRiskLabel: "medium",
        executionSignals: ["Needs narrow scope"],
      },
      recommendations: {
        mustFixBeforeBuild: ["Risk controls"],
        recommendedPivots: [],
        niceToHaveLater: ["Expand later"],
      },
      structuredAnalysis: `
## EVIDENCE
- [MARKET_SNAPSHOT] Context is mixed.

## MARKET OPPORTUNITY
- Evidence: [MARKET_SNAPSHOT]
- Reasoning: Demand looks strong.
- Uncertainty: Limited retention proof.
- Sub-score: 8/10

## TECHNICAL FEASIBILITY
- Evidence: [MARKET_SNAPSHOT]
- Reasoning: Feasible but not trivial.
- Uncertainty: Team throughput unclear.
- Sub-score: 5/10

## COMPETITIVE MOAT
- Evidence: [MARKET_SNAPSHOT]
- Reasoning: Defensibility uncertain.
- Uncertainty: Distribution edge unproven.
- Sub-score: 5/10

## EXECUTION READINESS
- Evidence: [MARKET_SNAPSHOT]
- Reasoning: Can ship MVP with discipline.
- Uncertainty: Hiring timelines.
- Sub-score: 6/10

## OVERALL
- Composition: (0.30 × market) + (0.25 × technical) + (0.25 × moat) + (0.20 × execution)
- Final score: 6.1/10
- Confidence: MEDIUM
`,
    };

    mockCreate
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify(bearPayload) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify(bullPayload) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify(judgePayload) } }] });

    const { evaluateWithCommittee } = await import("@/lib/ai/committee");
    const result = await evaluateWithCommittee({
      description: "A project with high upside and high execution risk.",
      projectType: "ai",
      teamSize: "team_2_5",
      resources: ["developers"],
      successDefinition: "PMF",
      responseStyle: "balanced",
      mvpScope: "Focused MVP",
    } as any);

    const bearUserPrompt = mockCreate.mock.calls[0][0].messages[1].content as string;
    const bullUserPrompt = mockCreate.mock.calls[1][0].messages[1].content as string;

    expect(bearUserPrompt).toContain("Adversarial Critic + Technical Risk Assessor");
    expect(bullUserPrompt).toContain("Market Opportunity + Growth Analyst");
    expect(bearUserPrompt).not.toBe(bullUserPrompt);

    expect(result.meta?.weightedScore).toBeDefined();
    expect(result.meta?.committeeDisagreement).toBeDefined();
    expect(result.meta?.committeeDisagreement?.highDisagreementFlag).toBe(true);
    expect(result.meta?.committeeDisagreement?.overallScoreStdDev).toBeGreaterThan(2);
    expect(result.meta?.committeeDisagreement?.disagreementNote).toContain("Overall score sigma");
  });
});
