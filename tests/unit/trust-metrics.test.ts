import { describe, expect, it } from "vitest";
import {
  computeDataFreshness,
  computeDebateDisagreementIndex,
  computeEvidenceCoverage,
  deriveConfidence,
} from "@/lib/ai/trust-metrics";

describe("trust metrics", () => {
  it("computes evidence coverage from factual claims", () => {
    const coverage = computeEvidenceCoverage([
      { text: "Fact A", claimType: "fact", evidenceIds: ["tavily_1"], support: "corroborated" },
      { text: "Fact B", claimType: "fact", evidenceIds: [], support: "uncorroborated" },
      { text: "Inference C", claimType: "inference", evidenceIds: [], support: "uncorroborated" },
    ]);

    expect(coverage).toBe(0.5);
  });

  it("drops confidence when external sources are unavailable", () => {
    const highSignals = deriveConfidence({
      evidenceCoverage: 0.9,
      verifierStatus: "pass",
      fallbackUsed: false,
      externalDataAvailable: true,
      tavilyAvailable: true,
      defillamaRequired: false,
      defillamaAvailable: false,
      agentFailures: 0,
    });

    const degradedSignals = deriveConfidence({
      evidenceCoverage: 0.9,
      verifierStatus: "pass",
      fallbackUsed: false,
      externalDataAvailable: false,
      tavilyAvailable: false,
      defillamaRequired: false,
      defillamaAvailable: false,
      agentFailures: 0,
    });

    expect(degradedSignals.score).toBeLessThan(highSignals.score);
    expect(["low", "medium"]).toContain(degradedSignals.level);
  });

  it("captures high disagreement between bear and bull", () => {
    const disagreement = computeDebateDisagreementIndex(
      { bearAnalysis: { riskScore: 92, verdict: "KILL" } },
      { bullAnalysis: { upsideScore: 95, verdict: "ALL IN" } }
    );
    expect(disagreement).toBeGreaterThan(70);
  });

  it("computes freshness for stale and fresh sources", () => {
    const now = new Date();
    const staleEnvelope = {
      data: {},
      fetchedAt: now.toISOString(),
      stalenessHours: 2,
      source: "onchain_rpc",
      ttlHours: 1,
      isStale: true,
    };
    const freshEnvelope = {
      data: {},
      fetchedAt: now.toISOString(),
      stalenessHours: 0.5,
      source: "market_snapshot_api",
      ttlHours: 1,
      isStale: false,
    };

    const freshness = computeDataFreshness([staleEnvelope, freshEnvelope]);
    expect(freshness.staleSourceCount).toBe(1);
    expect(freshness.totalSourceCount).toBe(2);
    expect(freshness.worstSource?.source).toBe("onchain_rpc");
    expect(freshness.overallFreshness).toBeLessThan(0.8);
  });

  it("returns low default freshness when no sources are provided", () => {
    const freshness = computeDataFreshness([]);
    expect(freshness.overallFreshness).toBe(0.3);
    expect(freshness.totalSourceCount).toBe(0);
  });

  it("keeps overall freshness high when all sources are fresh", () => {
    const now = new Date();
    const freshness = computeDataFreshness([
      {
        data: {},
        fetchedAt: now.toISOString(),
        stalenessHours: 0,
        source: "market_snapshot_api",
        ttlHours: 72,
        isStale: false,
      },
      {
        data: {},
        fetchedAt: now.toISOString(),
        stalenessHours: 0,
        source: "competitive_memo",
        ttlHours: 72,
        isStale: false,
      },
    ]);

    expect(freshness.overallFreshness).toBeGreaterThanOrEqual(0.95);
  });

  it("penalizes confidence when stale data and claim contradictions exist", () => {
    const baseline = deriveConfidence({
      evidenceCoverage: 0.9,
      verifierStatus: "pass",
      fallbackUsed: false,
      externalDataAvailable: true,
      tavilyAvailable: true,
      defillamaRequired: false,
      defillamaAvailable: false,
      agentFailures: 0,
    });

    const degraded = deriveConfidence({
      evidenceCoverage: 0.9,
      verifierStatus: "pass",
      fallbackUsed: false,
      externalDataAvailable: true,
      tavilyAvailable: true,
      defillamaRequired: false,
      defillamaAvailable: false,
      agentFailures: 0,
      dataFreshness: {
        overallFreshness: 0.45,
        staleSourceCount: 2,
        totalSourceCount: 3,
        worstSource: { source: "competitive_memo", stalenessHours: 96 },
        details: [],
      },
      claimVerification: {
        totalClaims: 4,
        groundingRate: 0.25,
        contradictedClaims: 2,
      },
    });

    expect(degraded.score).toBeLessThan(baseline.score);
    expect(degraded.reasons.some((reason) => reason.toLowerCase().includes("stale"))).toBe(true);
  });
});
