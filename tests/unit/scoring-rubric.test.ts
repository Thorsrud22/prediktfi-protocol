import { describe, expect, it } from "vitest";
import {
  CORE_SCORING_RUBRIC,
  buildScoringRubricPrompt,
} from "@/lib/ai/scoring-rubric";

describe("scoring-rubric", () => {
  it("exports core dimensions with complete score anchors", () => {
    expect(CORE_SCORING_RUBRIC.length).toBeGreaterThanOrEqual(4);
    for (const dimension of CORE_SCORING_RUBRIC) {
      expect(dimension.anchors["0-2"]).toBeTruthy();
      expect(dimension.anchors["3-4"]).toBeTruthy();
      expect(dimension.anchors["5-6"]).toBeTruthy();
      expect(dimension.anchors["7-8"]).toBeTruthy();
      expect(dimension.anchors["9-10"]).toBeTruthy();
    }
  });

  it("builds a rubric prompt with mandatory scoring discipline", () => {
    const prompt = buildScoringRubricPrompt("defi");
    expect(prompt).toContain("SCORING RUBRIC");
    expect(prompt).toContain("0-2");
    expect(prompt).toContain("9-10");
    expect(prompt).toContain("Final score must be a weighted synthesis");
    expect(prompt).toContain("Domain calibration (DeFi)");
  });

  it("returns generic calibration when project type is unknown", () => {
    const prompt = buildScoringRubricPrompt("unknown-category");
    expect(prompt).toContain("Domain calibration (Generic)");
  });

  it("allows classified domain to override unknown project type", () => {
    const prompt = buildScoringRubricPrompt("other", "saas");
    expect(prompt).toContain("Domain calibration (SaaS)");
  });
});
