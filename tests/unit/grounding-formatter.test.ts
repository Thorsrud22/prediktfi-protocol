import { describe, expect, it } from "vitest";
import { formatGroundingForPrompt, estimatePromptTokens } from "@/lib/ai/grounding-formatter";
import { wrapGrounding } from "@/lib/market/types";
import type { CompetitiveMemoResult } from "@/lib/market/competitiveTypes";

describe("grounding-formatter", () => {
  it("formats structured sections with inline freshness markers", () => {
    const marketGrounding = wrapGrounding(
      {
        timestamp: new Date().toISOString(),
        btcDominance: 54.3,
        solPriceUsd: 182.55,
        source: "coingecko",
      },
      "market_snapshot_api",
      new Date(),
      72
    );

    const tokenGrounding = wrapGrounding(
      {
        valid: true,
        mintAuthority: false,
        freezeAuthority: false,
        supply: 1_000_000_000,
        decimals: 9,
        isPumpFun: false,
        isLiquidityLocked: true,
      },
      "onchain_rpc",
      new Date(Date.now() - 6 * 3_600_000),
      1
    );

    const competitiveResult: CompetitiveMemoResult = {
      status: "ok",
      memo: {
        categoryLabel: "AI - Infra",
        crowdednessLevel: "high",
        shortLandscapeSummary: "The market is crowded but still has whitespace in vertical niches.",
        referenceProjects: [
          { name: "ProjectOne", chainOrPlatform: "Solana", note: "Benchmark" },
        ],
        tractionDifficulty: { label: "high", explanation: "High switching costs" },
        differentiationWindow: { label: "narrow", explanation: "Needs stronger wedge" },
        noiseVsSignal: "mixed",
        evaluatorNotes: "Differentiation is required.",
        claims: [],
        timestamp: new Date().toISOString(),
      },
      evidencePack: {
        evidence: [],
        generatedAt: new Date().toISOString(),
        unavailableSources: [],
      },
      grounding: wrapGrounding(
        { category: "ai", evidenceCount: 0, unavailableSources: [] },
        "competitive_memo",
        new Date(),
        72
      ),
    };

    const formatted = formatGroundingForPrompt({
      market: marketGrounding.data,
      marketGrounding,
      tokenGrounding,
      competitiveResult,
    });

    expect(formatted).toContain("GROUNDING BRIEF");
    expect(formatted).toContain("[MARKET_SNAPSHOT]");
    expect(formatted).toContain("[TOKEN_SECURITY]");
    expect(formatted).toContain("[COMPETITIVE_MEMO]");
    expect(formatted).toContain("STALE");
  });

  it("stays within configured token budget", () => {
    const formatted = formatGroundingForPrompt({
      market: {
        timestamp: new Date().toISOString(),
        btcDominance: 51.11,
        solPriceUsd: 135.22,
        totalAltVolume24hUsd: 1_000_000_000,
      },
      marketGrounding: wrapGrounding(
        {
          timestamp: new Date().toISOString(),
          btcDominance: 51.11,
          solPriceUsd: 135.22,
          totalAltVolume24hUsd: 1_000_000_000,
        },
        "market_snapshot_api",
        new Date(),
        72
      ),
      maxTokens: 800,
    });

    expect(estimatePromptTokens(formatted)).toBeLessThanOrEqual(800);
  });
});
