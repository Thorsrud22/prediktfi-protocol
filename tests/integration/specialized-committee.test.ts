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
      },
      "onchain_rpc",
      new Date(),
      1
    )
  ),
}));

vi.mock("@/lib/market/competitive", () => ({
  fetchCompetitiveMemo: vi.fn().mockResolvedValue({
    status: "not_available",
    reason: "Test path",
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

describe("specialized committee integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("produces disagreement metadata and weighted score using specialized roles", async () => {
    mockCreate
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                bearAnalysis: { riskScore: 88, verdict: "KILL", roast: "Failure risk is high." },
                roleScores: {
                  technicalFeasibility: 2,
                  failureModes: 1,
                  competitiveThreats: 3,
                  regulatoryRisk: 2,
                },
              }),
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                bullAnalysis: { upsideScore: 84, verdict: "APE", pitch: "Strong upside if executed." },
                roleScores: {
                  marketOpportunity: 9,
                  growthTrajectory: 8,
                  customerDemand: 8,
                  timingWindow: 8,
                },
              }),
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overallScore: 66,
                summary: { title: "Mixed", oneLiner: "Mixed view", mainVerdict: "Watchlist" },
                technical: {
                  feasibilityScore: 60,
                  keyRisks: ["Execution risk"],
                  requiredComponents: ["Audit"],
                  comments: "Feasible with caution",
                },
                tokenomics: {
                  tokenNeeded: true,
                  designScore: 55,
                  mainIssues: [],
                  suggestions: [],
                },
                market: {
                  marketFitScore: 64,
                  targetAudience: [],
                  competitorSignals: [],
                  goToMarketRisks: [],
                },
                execution: {
                  complexityLevel: "medium",
                  founderReadinessFlags: [],
                  estimatedTimeline: "4 months",
                  executionRiskScore: 58,
                  executionRiskLabel: "medium",
                  executionSignals: [],
                },
                recommendations: {
                  mustFixBeforeBuild: ["Risk plan"],
                  recommendedPivots: [],
                  niceToHaveLater: [],
                },
              }),
            },
          },
        ],
      });

    const { evaluateWithCommittee } = await import("@/lib/ai/committee");
    const result = await evaluateWithCommittee({
      description: "High-upside but execution-sensitive idea.",
      projectType: "defi",
      teamSize: "team_2_5",
      resources: ["developers"],
      successDefinition: "PMF",
      responseStyle: "balanced",
      mvpScope: "Focused scope",
    } as any);

    expect(result.meta?.weightedScore).toBeDefined();
    expect(result.meta?.weightedScoreInputs?.judge).toBe(66);
    expect(result.meta?.committeeDisagreement).toBeDefined();
    expect(result.meta?.committeeDisagreement?.comparedAgents).toBe(3);
    expect(result.meta?.committeeDisagreement?.overallScoreStdDev).toBeGreaterThan(2);
    expect(result.meta?.committeeDisagreement?.highDisagreementFlag).toBe(true);
    expect(result.confidenceLevel).not.toBe("high");
  });
});
