import { describe, expect, it } from "vitest";
import {
  buildCategoryPreflightSteps,
  getMissingContextualFields,
  sanitizeReasoningStepsForCategory,
} from "@/lib/ideaCategories";

describe("ideaCategories", () => {
  it("does not include SOL or market data feed wording for AI preflight", () => {
    const steps = buildCategoryPreflightSteps("ai");
    const joined = steps.join(" ").toLowerCase();

    expect(joined).not.toContain("market data feeds");
    expect(joined).not.toContain("sol $");
    expect(steps.length).toBeGreaterThan(0);
  });

  it("includes SOL market snapshot preflight for memecoin", () => {
    const steps = buildCategoryPreflightSteps("memecoin", { solPriceUsd: 84.9 });
    const joined = steps.join(" ");

    expect(joined).toContain("Connecting to market data feeds...");
    expect(joined).toContain("Market snapshot: SOL $84.9");
  });

  it("returns missing contextual fields for gaming when inputs are empty", () => {
    const missing = getMissingContextualFields("gaming", {
      gamingCoreLoop: "",
      gamingEconomyModel: undefined,
    });

    expect(missing.map((field) => field.label)).toEqual(["Core Gameplay Loop", "Economy Model"]);
  });

  it("sanitizes tokenomics-only AI reasoning steps and backfills AI fallbacks", () => {
    const steps = sanitizeReasoningStepsForCategory("ai", [
      "Checking tokenomics emissions and liquidity lock setup...",
      "Reviewing rug risk and mint authority status...",
    ]);

    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps.join(" ").toLowerCase()).not.toContain("rug risk");
    expect(steps.join(" ").toLowerCase()).not.toContain("liquidity lock");
  });
});
