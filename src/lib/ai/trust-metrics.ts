import { EvidenceClaim, EvidencePack } from "@/lib/ai/evidenceTypes";
import { COMMITTEE_WEIGHT_CONFIG } from "@/lib/ai/agent-roles";
import { EvaluationModelMap } from "@/lib/ai/model-routing";
import { GroundingEnvelope } from "@/lib/market/types";

type BearVerdict = "KILL" | "AVOID" | "SHORT";
type BullVerdict = "ALL IN" | "APE" | "LONG";

interface BearLike {
  bearAnalysis?: {
    riskScore?: number;
    verdict?: BearVerdict;
  };
}

interface BullLike {
  bullAnalysis?: {
    upsideScore?: number;
    verdict?: BullVerdict;
  };
}

export function clamp(min: number, value: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function mapVerdict(verdict: string | undefined, isBear: boolean): number {
  if (isBear) {
    if (verdict === "KILL") return 0;
    if (verdict === "AVOID") return 20;
    if (verdict === "SHORT") return 40;
    return 30;
  }

  if (verdict === "LONG") return 60;
  if (verdict === "APE") return 80;
  if (verdict === "ALL IN") return 100;
  return 70;
}

export function computeDebateDisagreementIndex(
  bearOutput: BearLike,
  bullOutput: BullLike
): number {
  const bearRisk = clamp(0, Number(bearOutput.bearAnalysis?.riskScore ?? 50), 100);
  const bullUpside = clamp(0, Number(bullOutput.bullAnalysis?.upsideScore ?? 50), 100);

  // High disagreement means Bear sees high risk while Bull still sees high upside.
  const riskUpsideTension = Math.abs(bearRisk - (100 - bullUpside));
  const verdictTension = Math.abs(
    mapVerdict(bearOutput.bearAnalysis?.verdict, true) -
      mapVerdict(bullOutput.bullAnalysis?.verdict, false)
  );

  return clamp(0, Math.round(riskUpsideTension * 0.6 + verdictTension * 0.4), 100);
}

function computeVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
}

function normalizeScore100(value: unknown): number | null {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return clamp(0, numeric, 100);
}

export interface CommitteeScoreInputs {
  bearRiskScore?: number;
  bullUpsideScore?: number;
  judgeScore?: number;
}

export interface CommitteeWeightedScore {
  weightedScore: number;
  inputs: {
    bear?: number;
    bull?: number;
    judge?: number;
  };
  weightsUsed: {
    bear?: number;
    bull?: number;
    judge?: number;
  };
}

export function computeWeightedCommitteeScore(
  inputs: CommitteeScoreInputs
): CommitteeWeightedScore {
  const judgeScore = normalizeScore100(inputs.judgeScore);
  const bullScore = normalizeScore100(inputs.bullUpsideScore);
  const normalizedBearRisk = normalizeScore100(inputs.bearRiskScore);
  const bearScore = normalizedBearRisk === null ? null : 100 - normalizedBearRisk;

  const weightedParts: Array<{ score: number; weight: number; key: "bear" | "bull" | "judge" }> = [];
  if (bearScore !== null) weightedParts.push({ key: "bear", score: bearScore, weight: COMMITTEE_WEIGHT_CONFIG.bear });
  if (bullScore !== null) weightedParts.push({ key: "bull", score: bullScore, weight: COMMITTEE_WEIGHT_CONFIG.bull });
  if (judgeScore !== null) weightedParts.push({ key: "judge", score: judgeScore, weight: COMMITTEE_WEIGHT_CONFIG.judge });

  const totalWeight = weightedParts.reduce((sum, part) => sum + part.weight, 0);
  const fallback = judgeScore ?? bullScore ?? bearScore ?? 50;
  const weightedScore =
    totalWeight > 0
      ? weightedParts.reduce((sum, part) => sum + part.score * part.weight, 0) / totalWeight
      : fallback;

  const weightsUsed: CommitteeWeightedScore["weightsUsed"] = {};
  for (const part of weightedParts) {
    weightsUsed[part.key] = part.weight;
  }

  return {
    weightedScore: Math.round(clamp(0, weightedScore, 100) * 10) / 10,
    inputs: {
      bear: bearScore ?? undefined,
      bull: bullScore ?? undefined,
      judge: judgeScore ?? undefined,
    },
    weightsUsed,
  };
}

export interface CommitteeDisagreementInputs {
  overallScores: {
    bear?: number;
    bull?: number;
    judge?: number;
  };
  perDimensionScores?: Record<string, number[]>;
  sigmaThreshold?: number;
}

export interface CommitteeDisagreementMetrics {
  overallScoreVariance: number;
  overallScoreStdDev: number;
  highDisagreementFlag: boolean;
  dimensionalDisagreement: Record<string, number>;
  topDisagreementDimension: string | null;
  comparedAgents: number;
  disagreementNote: string;
}

export function computeCommitteeDisagreement(
  inputs: CommitteeDisagreementInputs
): CommitteeDisagreementMetrics {
  const sigmaThreshold = inputs.sigmaThreshold ?? 2.0;
  const overallValues10Scale = [inputs.overallScores.bear, inputs.overallScores.bull, inputs.overallScores.judge]
    .map((value) => normalizeScore100(value))
    .filter((value): value is number => value !== null)
    .map((value) => value / 10);

  const variance = computeVariance(overallValues10Scale);
  const stdDev = Math.sqrt(variance);
  const highDisagreementFlag = stdDev > sigmaThreshold;

  const dimensionalDisagreement: Record<string, number> = {};
  if (inputs.perDimensionScores) {
    for (const [dimension, values] of Object.entries(inputs.perDimensionScores)) {
      const normalizedValues = values
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
        .map((value) => clamp(0, value, 10));
      if (normalizedValues.length < 2) continue;
      const spread = Math.max(...normalizedValues) - Math.min(...normalizedValues);
      dimensionalDisagreement[dimension] = Math.round(spread * 100) / 100;
    }
  }

  const topDisagreementEntry = Object.entries(dimensionalDisagreement).sort(
    (left, right) => right[1] - left[1]
  )[0];
  const topDisagreementDimension = topDisagreementEntry?.[0] || null;

  const disagreementNote = topDisagreementDimension
    ? `Agents disagreed most on ${topDisagreementDimension} (spread: ${topDisagreementEntry[1].toFixed(2)}). Overall score sigma: ${stdDev.toFixed(2)}.`
    : `Overall score sigma: ${stdDev.toFixed(2)} across ${overallValues10Scale.length} agent score(s).`;

  return {
    overallScoreVariance: Math.round(variance * 1000) / 1000,
    overallScoreStdDev: Math.round(stdDev * 1000) / 1000,
    highDisagreementFlag,
    dimensionalDisagreement,
    topDisagreementDimension,
    comparedAgents: overallValues10Scale.length,
    disagreementNote,
  };
}

export function computeEvidenceCoverage(claims: EvidenceClaim[]): number {
  const factualClaims = claims.filter((claim) => claim.claimType === "fact");
  if (factualClaims.length === 0) return 0;

  const corroboratedFacts = factualClaims.filter((claim) => claim.evidenceIds.length > 0);
  return Number((corroboratedFacts.length / factualClaims.length).toFixed(2));
}

export type ConfidenceLevel = "low" | "medium" | "high";

export interface ConfidenceInputs {
  evidenceCoverage: number;
  verifierStatus: "pass" | "soft_fail" | "hard_fail" | "error";
  fallbackUsed: boolean;
  externalDataAvailable: boolean;
  tavilyAvailable: boolean;
  defillamaRequired: boolean;
  defillamaAvailable: boolean;
  agentFailures: number;
  dataFreshness?: DataFreshnessSignal;
  claimVerification?: {
    totalClaims: number;
    groundingRate: number;
    contradictedClaims: number;
  };
  committeeDisagreement?: {
    overallScoreStdDev: number;
    highDisagreementFlag: boolean;
    topDisagreementDimension?: string | null;
  };
}

export interface ConfidenceResult {
  score: number;
  level: ConfidenceLevel;
  reasons: string[];
}

export interface DataFreshnessSignal {
  overallFreshness: number;
  staleSourceCount: number;
  totalSourceCount: number;
  worstSource: { source: string; stalenessHours: number } | null;
  details: Array<{
    source: string;
    stalenessHours: number;
    ttlHours: number;
    freshnessScore: number;
  }>;
}

export function computeDataFreshness(
  envelopes: GroundingEnvelope<unknown>[]
): DataFreshnessSignal {
  if (envelopes.length === 0) {
    return {
      overallFreshness: 0.3,
      staleSourceCount: 0,
      totalSourceCount: 0,
      worstSource: null,
      details: [],
    };
  }

  const details = envelopes.map((envelope) => {
    const ttl = envelope.ttlHours > 0 ? envelope.ttlHours : 1;
    const ratio = envelope.stalenessHours / ttl;
    const freshnessScore = Math.max(0.3, 1 - 0.5 * ratio);
    return {
      source: envelope.source,
      stalenessHours: envelope.stalenessHours,
      ttlHours: ttl,
      freshnessScore,
    };
  });

  const staleSourceCount = envelopes.filter((envelope) => envelope.isStale).length;
  const worst = details.reduce<typeof details[number] | null>(
    (currentWorst, detail) =>
      !currentWorst || detail.freshnessScore < currentWorst.freshnessScore
        ? detail
        : currentWorst,
    null
  );

  const avgFreshness =
    details.reduce((sum, detail) => sum + detail.freshnessScore, 0) / details.length;
  const overallFreshness = Math.round((0.6 * avgFreshness + 0.4 * (worst?.freshnessScore ?? avgFreshness)) * 1000) / 1000;

  return {
    overallFreshness,
    staleSourceCount,
    totalSourceCount: envelopes.length,
    worstSource: worst ? { source: worst.source, stalenessHours: worst.stalenessHours } : null,
    details,
  };
}

export function deriveConfidence(inputs: ConfidenceInputs): ConfidenceResult {
  const reasons: string[] = [];
  let score = 70;

  if (inputs.evidenceCoverage >= 0.8) {
    score += 15;
    reasons.push("High factual evidence coverage.");
  } else if (inputs.evidenceCoverage >= 0.5) {
    score += 5;
    reasons.push("Moderate factual evidence coverage.");
  } else {
    score -= 15;
    reasons.push("Low factual evidence coverage.");
  }

  if (inputs.verifierStatus === "pass") {
    score += 10;
    reasons.push("Verifier passed consistency checks.");
  } else if (inputs.verifierStatus === "soft_fail") {
    score -= 10;
    reasons.push("Verifier found moderate consistency issues.");
  } else if (inputs.verifierStatus === "hard_fail") {
    score -= 25;
    reasons.push("Verifier found severe factual or schema issues.");
  } else {
    score -= 15;
    reasons.push("Verifier unavailable; reliability reduced.");
  }

  if (inputs.fallbackUsed) {
    score -= 10;
    reasons.push("Backup judge model used due primary failure.");
  }

  if (!inputs.externalDataAvailable) {
    score -= 20;
    reasons.push("External data sources unavailable.");
  }

  if (!inputs.tavilyAvailable) {
    score -= 10;
    reasons.push("Web search evidence unavailable (Tavily).");
  }

  if (inputs.defillamaRequired && !inputs.defillamaAvailable) {
    score -= 10;
    reasons.push("DeFi TVL evidence unavailable (DeFiLlama).");
  }

  if (inputs.agentFailures > 0) {
    const penalty = Math.min(inputs.agentFailures * 5, 15);
    score -= penalty;
    reasons.push(`One or more scout agents failed (${inputs.agentFailures}).`);
  }

  if (inputs.dataFreshness) {
    const freshness = inputs.dataFreshness.overallFreshness;
    score *= 0.4 + 0.6 * freshness;
    if (inputs.dataFreshness.staleSourceCount > 0) {
      reasons.push(
        `Data freshness degraded: ${inputs.dataFreshness.staleSourceCount}/${inputs.dataFreshness.totalSourceCount} source(s) stale.`
      );
    } else {
      reasons.push("Grounding data is fresh.");
    }
  }

  if (inputs.claimVerification && inputs.claimVerification.totalClaims > 0) {
    const contradictionPenalty = inputs.claimVerification.contradictedClaims * 10;
    const groundingBonus = Math.round(inputs.claimVerification.groundingRate * 10);
    score = score + groundingBonus - contradictionPenalty;

    if (inputs.claimVerification.contradictedClaims > 0) {
      reasons.push(
        `${inputs.claimVerification.contradictedClaims} numerical claim(s) contradicted grounding data.`
      );
    } else if (inputs.claimVerification.groundingRate >= 0.6) {
      reasons.push("Most numerical claims align with available grounding data.");
    }
  }

  if (inputs.committeeDisagreement) {
    if (inputs.committeeDisagreement.highDisagreementFlag) {
      score *= 0.85;
      const topDimension = inputs.committeeDisagreement.topDisagreementDimension;
      reasons.push(
        topDimension
          ? `Confidence penalized due high committee disagreement on ${topDimension}.`
          : "Confidence penalized due high committee disagreement."
      );
    } else {
      reasons.push("Committee disagreement within expected bounds.");
    }
  }

  score = clamp(0, score, 100);

  let level: ConfidenceLevel = "low";
  if (score >= 75) level = "high";
  else if (score >= 45) level = "medium";

  // Hard cap confidence when critical grounding sources are missing.
  if ((!inputs.tavilyAvailable || (inputs.defillamaRequired && !inputs.defillamaAvailable)) && level === "high") {
    level = "medium";
    reasons.push("Confidence capped due missing grounding source.");
  }

  return { score, level, reasons };
}

export function extractDataFreshness(evidencePack: EvidencePack): string | null {
  if (evidencePack.evidence.length === 0) return null;
  const latest = evidencePack.evidence
    .map((item) => item.fetchedAt)
    .filter(Boolean)
    .sort()
    .pop();
  return latest || null;
}

export function buildModelRouteMeta(
  modelMap: EvaluationModelMap,
  fallbackUsed: boolean
): {
  bear: string;
  bull: string;
  competitive: string;
  judge: string;
  judgeFallback: string;
  verifier: string;
  fallbackUsed: boolean;
} {
  return {
    bear: modelMap.bear,
    bull: modelMap.bull,
    competitive: modelMap.competitive,
    judge: modelMap.judge,
    judgeFallback: modelMap.judgeFallback,
    verifier: modelMap.verifier,
    fallbackUsed,
  };
}
