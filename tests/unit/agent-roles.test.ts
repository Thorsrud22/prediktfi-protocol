import { describe, expect, it } from "vitest";
import {
  COMMITTEE_ROLES,
  buildRoleSpecializationBlock,
  getRoleDimensions,
  getRoleDimensionOverlap,
} from "@/lib/ai/agent-roles";

describe("agent role specialization", () => {
  it("keeps dimension overlap below 50% between any two roles", () => {
    const overlapPairs: Array<["bear" | "bull" | "judge", "bear" | "bull" | "judge"]> = [
      ["bear", "bull"],
      ["bear", "judge"],
      ["bull", "judge"],
    ];

    for (const [left, right] of overlapPairs) {
      const overlap = getRoleDimensionOverlap(left, right);
      expect(overlap.overlapRatio).toBeLessThanOrEqual(0.5);
    }
  });

  it("builds role specialization block with dimensions, weight, and domain addendum", () => {
    const bearBlock = buildRoleSpecializationBlock("bear", "defi");
    expect(bearBlock).toContain(COMMITTEE_ROLES.bear.title);
    expect(bearBlock).toContain("Primary dimensions:");
    expect(bearBlock).toContain("Weight in committee aggregation");
    expect(bearBlock).toContain("Domain emphasis (DeFi)");

    const judgeBlock = buildRoleSpecializationBlock("judge", "ai");
    expect(judgeBlock).toContain(COMMITTEE_ROLES.judge.title);
    expect(judgeBlock).toContain("Domain emphasis (AI)");
  });

  it("adds domain overlays without replacing base dimensions", () => {
    const saasBearDimensions = getRoleDimensions("bear", "other", "saas");
    expect(saasBearDimensions).toContain("technicalFeasibility");
    expect(saasBearDimensions).toContain("churnRisk");
    expect(saasBearDimensions).toContain("cacPaybackRisk");
  });
});
