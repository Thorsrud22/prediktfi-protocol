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
    reason: "No competitive memo for this test path",
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

function buildJudgePayload(overallScore: number) {
  return {
    overallScore,
    summary: {
      title: "Domain-adaptive response",
      oneLiner: "Synthetic payload for integration testing.",
      mainVerdict: "Watchlist",
    },
    technical: {
      feasibilityScore: overallScore,
      keyRisks: ["Execution risk"],
      requiredComponents: ["Focused scope"],
      comments: "Test payload.",
    },
    tokenomics: {
      tokenNeeded: false,
      designScore: Math.max(0, overallScore - 10),
      mainIssues: [],
      suggestions: [],
    },
    market: {
      marketFitScore: overallScore,
      targetAudience: ["Test users"],
      competitorSignals: ["Competitive market"],
      goToMarketRisks: ["Acquisition risk"],
    },
    execution: {
      complexityLevel: "medium" as const,
      founderReadinessFlags: [],
      estimatedTimeline: "3-5 months",
      executionRiskScore: Math.max(0, 100 - overallScore),
      executionRiskLabel: "medium" as const,
      executionSignals: ["Scope discipline"],
    },
    recommendations: {
      mustFixBeforeBuild: ["Clarify positioning"],
      recommendedPivots: [],
      niceToHaveLater: [],
    },
  };
}

function queueCommitteeResponses() {
  mockCreate
    .mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ bearAnalysis: { riskScore: 72, verdict: "SHORT" } }) } }],
    })
    .mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ bullAnalysis: { upsideScore: 70, verdict: "LONG" } }) } }],
    })
    .mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(buildJudgePayload(68)) } }],
    });
}

describe("domain-adaptive committee routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes SaaS-like input to saas overlays and rubric addendum", async () => {
    queueCommitteeResponses();
    const { evaluateWithCommittee } = await import("@/lib/ai/committee");

    const result = await evaluateWithCommittee({
      description:
        "B2B SaaS onboarding platform with ARR expansion, churn reduction, subscription pricing, and enterprise seats.",
      projectType: "other",
      teamSize: "team_2_5",
      resources: ["developers"],
      successDefinition: "Reduce churn by 25%",
      responseStyle: "balanced",
      mvpScope: "Pilot with 10 enterprise accounts",
    } as any);

    const bearPrompt = mockCreate.mock.calls[0][0].messages[1].content as string;
    const bullPrompt = mockCreate.mock.calls[1][0].messages[1].content as string;

    expect(bearPrompt).toContain("Domain routing: classifier=saas");
    expect(bearPrompt).toContain("Domain calibration (SaaS)");
    expect(bearPrompt).toContain("churnRisk");
    expect(bullPrompt).toContain("unitEconomicsUpside");
    expect(result.classifiedDomain).toBe("saas");
    expect(result.meta?.classifiedDomain).toBe("saas");
  });

  it("routes AI-like input to ai_ml overlays and keeps AI rubric", async () => {
    queueCommitteeResponses();
    const { evaluateWithCommittee } = await import("@/lib/ai/committee");

    const result = await evaluateWithCommittee({
      description:
        "AI copilot using LLM inference, fine-tune loops, proprietary dataset signals, and GPU-optimized training workflows.",
      projectType: "other",
      teamSize: "team_2_5",
      resources: ["developers"],
      successDefinition: "Reach 100 paid customers",
      responseStyle: "balanced",
      mvpScope: "Vertical beta with model guardrails",
    } as any);

    const bearPrompt = mockCreate.mock.calls[0][0].messages[1].content as string;
    const bullPrompt = mockCreate.mock.calls[1][0].messages[1].content as string;

    expect(bearPrompt).toContain("Domain routing: classifier=ai_ml");
    expect(bearPrompt).toContain("Domain calibration (AI)");
    expect(bearPrompt).toContain("modelCommoditizationRisk");
    expect(bullPrompt).toContain("dataMoatStrength");
    expect(result.meta?.classifiedDomain).toBe("ai_ml");
  });

  it("uses DeFi hint as primary routing signal when projectType is explicit", async () => {
    queueCommitteeResponses();
    const { evaluateWithCommittee } = await import("@/lib/ai/committee");

    const result = await evaluateWithCommittee({
      description: "Token utility platform with yield mechanics and basic protocol tooling.",
      projectType: "defi",
      teamSize: "team_2_5",
      resources: ["developers"],
      successDefinition: "Launch MVP",
      responseStyle: "balanced",
      mvpScope: "Single market rollout",
    } as any);

    const bearPrompt = mockCreate.mock.calls[0][0].messages[1].content as string;

    expect(bearPrompt).toContain("Domain routing: classifier=crypto_defi");
    expect(bearPrompt).toContain("Domain calibration (DeFi)");
    expect(bearPrompt).toContain("smartContractSecurity");
    expect(result.meta?.classifiedDomain).toBe("crypto_defi");
  });
});
