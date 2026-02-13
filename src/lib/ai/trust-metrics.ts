import { EvidenceClaim, EvidencePack } from "@/lib/ai/evidenceTypes";
import { EvaluationModelMap } from "@/lib/ai/model-routing";

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
}

export interface ConfidenceResult {
  score: number;
  level: ConfidenceLevel;
  reasons: string[];
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
