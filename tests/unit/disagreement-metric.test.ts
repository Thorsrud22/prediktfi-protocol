import { describe, expect, it } from "vitest";
import {
  computeCommitteeDisagreement,
  computeWeightedCommitteeScore,
  deriveConfidence,
} from "@/lib/ai/trust-metrics";

describe("committee disagreement + weighting", () => {
  it("computes weighted committee score with configured role weights", () => {
    const weighted = computeWeightedCommitteeScore({
      bearRiskScore: 80,
      bullUpsideScore: 70,
      judgeScore: 60,
    });

    // Bear riskScore=80 becomes positive score=20.
    // weighted=(0.3*20 + 0.3*70 + 0.4*60)=51
    expect(weighted.weightedScore).toBe(51);
    expect(weighted.weightsUsed.bear).toBe(0.3);
    expect(weighted.weightsUsed.bull).toBe(0.3);
    expect(weighted.weightsUsed.judge).toBe(0.4);
  });

  it("flags high disagreement when score sigma exceeds threshold", () => {
    const disagreement = computeCommitteeDisagreement({
      overallScores: {
        bear: 15,
        bull: 90,
        judge: 55,
      },
      perDimensionScores: {
        marketOpportunity: [2, 9, 6],
        technicalFeasibility: [8, 4, 6],
      },
      sigmaThreshold: 2,
    });

    expect(disagreement.highDisagreementFlag).toBe(true);
    expect(disagreement.overallScoreStdDev).toBeGreaterThan(2);
    expect(disagreement.topDisagreementDimension).toBe("marketOpportunity");
  });

  it("applies confidence penalty when disagreement is high", () => {
    const baseline = deriveConfidence({
      evidenceCoverage: 0.8,
      verifierStatus: "pass",
      fallbackUsed: false,
      externalDataAvailable: true,
      tavilyAvailable: true,
      defillamaRequired: false,
      defillamaAvailable: false,
      agentFailures: 0,
    });

    const penalized = deriveConfidence({
      evidenceCoverage: 0.8,
      verifierStatus: "pass",
      fallbackUsed: false,
      externalDataAvailable: true,
      tavilyAvailable: true,
      defillamaRequired: false,
      defillamaAvailable: false,
      agentFailures: 0,
      committeeDisagreement: {
        overallScoreStdDev: 2.5,
        highDisagreementFlag: true,
        topDisagreementDimension: "marketOpportunity",
      },
    });

    expect(penalized.score).toBeLessThan(baseline.score);
    expect(
      penalized.reasons.some((reason) =>
        reason.toLowerCase().includes("committee disagreement")
      )
    ).toBe(true);
  });
});
