import { describe, expect, it } from "vitest";
import { calibrateScore } from "@/lib/ai/calibration";
import type { IdeaEvaluationResult } from "@/lib/ideaEvaluationTypes";

function buildBaseResult(): IdeaEvaluationResult {
  return {
    overallScore: 70,
    summary: {
      title: "Base",
      oneLiner: "Base",
      mainVerdict: "Watch",
    },
    technical: {
      feasibilityScore: 70,
      keyRisks: [],
      requiredComponents: [],
      comments: "Solid base assessment.",
    },
    tokenomics: {
      tokenNeeded: false,
      designScore: 50,
      mainIssues: [],
      suggestions: [],
    },
    market: {
      marketFitScore: 65,
      targetAudience: ["Builders"],
      competitorSignals: [],
      goToMarketRisks: [],
    },
    execution: {
      complexityLevel: "medium",
      founderReadinessFlags: [],
      estimatedTimeline: "3 months",
      executionRiskScore: 55,
      executionRiskLabel: "medium",
      executionSignals: [],
    },
    recommendations: {
      mustFixBeforeBuild: [],
      recommendedPivots: [],
      niceToHaveLater: [],
    },
    launchReadinessScore: 70,
    launchReadinessLabel: "high",
    launchReadinessSignals: ["MVP ready"],
    calibrationNotes: [],
  };
}

describe("calibration soft-required contextual inputs", () => {
  it("applies bounded penalties and recommendations when AI contextual fields are missing", () => {
    const raw = buildBaseResult();
    const result = calibrateScore({
      rawResult: raw,
      projectType: "ai",
      ideaSubmission: {
        projectType: "ai",
        description: "Build an AI assistant for product teams.",
        teamSize: "solo",
        resources: ["developers"],
        successDefinition: "Reach product-market fit",
        aiModelType: "",
        aiDataMoat: "",
      } as any,
    });

    expect(result.overallScore).toBeLessThan(raw.overallScore);
    expect(result.launchReadinessScore).toBeLessThan(raw.launchReadinessScore as number);
    expect(result.calibrationNotes?.some((note) => note.includes("Context quality"))).toBe(true);
    expect(result.recommendations.mustFixBeforeBuild.some((item) => item.includes("Model Type"))).toBe(true);
    expect(result.recommendations.mustFixBeforeBuild.some((item) => item.includes("Data Moat"))).toBe(true);
  });

  it("does not add contextual penalties when required fields are present", () => {
    const raw = buildBaseResult();
    const result = calibrateScore({
      rawResult: raw,
      projectType: "ai",
      ideaSubmission: {
        projectType: "ai",
        description: "Build an AI assistant for product teams.",
        teamSize: "solo",
        resources: ["developers"],
        successDefinition: "Reach product-market fit",
        aiModelType: "Fine-tuned vertical model",
        aiDataMoat: "Proprietary first-party feedback dataset",
      } as any,
    });

    expect(result.calibrationNotes?.some((note) => note.includes("Context quality"))).toBe(false);
    expect(result.recommendations.mustFixBeforeBuild.some((item) => item.includes("Model Type"))).toBe(false);
    expect(result.recommendations.mustFixBeforeBuild.some((item) => item.includes("Data Moat"))).toBe(false);
  });
});
