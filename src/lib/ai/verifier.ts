import { EvidenceClaim, EvidencePack } from "@/lib/ai/evidenceTypes";
import { ExtractedClaim, extractNumericalClaims } from "@/lib/ai/parser";
import { IdeaEvaluationResult } from "@/lib/ideaEvaluationTypes";

export type VerifierStatus = "pass" | "soft_fail" | "hard_fail" | "error";
export type Severity = "fatal" | "major" | "minor" | "cosmetic";

export interface CheckOutcome {
  passed: boolean;
  detail?: string;
}

export interface VerificationCheck {
  id: string;
  name: string;
  severity: Severity;
  autoRepairable: boolean;
  maxRepairAttempts: number;
  check: (result: IdeaEvaluationResult) => CheckOutcome;
}

export interface VerifiedResult {
  result: IdeaEvaluationResult;
  qualityWarnings: string[];
  internalWarnings: string[];
  repairsUsed: number;
  checksRun: number;
  checksFailed: number;
  fatalFailure: boolean;
}

export interface ClaimVerificationResult {
  totalClaims: number;
  groundedClaims: number;
  ungroundedClaims: number;
  contradictedClaims: number;
  groundingRate: number;
  contradictions: Array<{
    claim: ExtractedClaim;
    groundingValue: number;
    discrepancy: string;
  }>;
}

export interface VerifierOutcome {
  status: VerifierStatus;
  issues: string[];
  repaired: boolean;
  result: IdeaEvaluationResult;
  qualityWarnings?: string[];
  internalWarnings?: string[];
  repairsUsed?: number;
  checksRun?: number;
  checksFailed?: number;
  fatalFailure?: boolean;
  claimVerification?: ClaimVerificationResult;
}

function isNonEmptyString(value: unknown, minLength: number): boolean {
  return typeof value === "string" && value.trim().length >= minLength;
}

function getRequiredSections(result: IdeaEvaluationResult): Array<[string, unknown]> {
  return [
    ["summary.oneLiner", result.summary?.oneLiner],
    ["summary.mainVerdict", result.summary?.mainVerdict],
    ["technical.comments", result.technical?.comments],
    ["market.goToMarketRisks", result.market?.goToMarketRisks],
    ["recommendations.mustFixBeforeBuild", result.recommendations?.mustFixBeforeBuild],
  ];
}

const scoreRangeCheck: VerificationCheck = {
  id: "score_range",
  name: "Score within valid range",
  severity: "fatal",
  autoRepairable: false,
  maxRepairAttempts: 0,
  check: (result) => {
    const valid =
      typeof result.overallScore === "number" &&
      Number.isFinite(result.overallScore) &&
      result.overallScore >= 0 &&
      result.overallScore <= 100;
    return {
      passed: valid,
      detail: valid ? undefined : `overallScore=${String(result.overallScore)}`,
    };
  },
};

const requiredSectionsCheck: VerificationCheck = {
  id: "required_sections",
  name: "Required sections present and non-trivial",
  severity: "fatal",
  autoRepairable: false,
  maxRepairAttempts: 0,
  check: (result) => {
    const missing = getRequiredSections(result)
      .filter(([, value]) => {
        if (Array.isArray(value)) return value.length === 0;
        return !isNonEmptyString(value, 5);
      })
      .map(([key]) => key);
    return {
      passed: missing.length === 0,
      detail: missing.length > 0 ? `Missing/empty: ${missing.join(", ")}` : undefined,
    };
  },
};

const scoreJustificationAlignment: VerificationCheck = {
  id: "score_justification_alignment",
  name: "Score aligns with recommendation tone",
  severity: "major",
  autoRepairable: true,
  maxRepairAttempts: 1,
  check: (result) => {
    const recommendationText = [
      result.summary?.mainVerdict,
      result.technical?.comments,
      ...(result.recommendations?.mustFixBeforeBuild || []),
    ]
      .join(" ")
      .toLowerCase();

    const highScoreBadRecommendation =
      result.overallScore > 80 &&
      (recommendationText.includes("not recommended") ||
        recommendationText.includes("high risk") ||
        recommendationText.includes("avoid") ||
        recommendationText.includes("fatal flaw"));

    const lowScoreGreatRecommendation =
      result.overallScore < 30 &&
      (recommendationText.includes("strongly recommend") ||
        recommendationText.includes("excellent opportunity") ||
        recommendationText.includes("high potential"));

    const passed = !highScoreBadRecommendation && !lowScoreGreatRecommendation;
    return {
      passed,
      detail: passed
        ? undefined
        : `Score ${result.overallScore} conflicts with recommendation tone`,
    };
  },
};

const competitiveNotEmpty: VerificationCheck = {
  id: "competitive_not_empty",
  name: "Competitive analysis has substance",
  severity: "major",
  autoRepairable: true,
  maxRepairAttempts: 1,
  check: (result) => {
    const competitorSignals = result.market?.competitorSignals || [];
    const competitors = result.market?.competitors || [];
    const hasSubstance = competitorSignals.length > 0 || competitors.length > 0;
    return {
      passed: hasSubstance,
      detail: hasSubstance ? undefined : "Competitive analysis is empty or trivial",
    };
  },
};

const noTruncatedSentences: VerificationCheck = {
  id: "no_truncated_sentences",
  name: "No truncated narrative sections",
  severity: "minor",
  autoRepairable: true,
  maxRepairAttempts: 1,
  check: (result) => {
    const sections = extractTextSections(result);
    const truncated = Object.values(sections).some((text) => {
      const trimmed = text.trim();
      if (trimmed.length < 100) return false;
      return !/[.!?:"\)]$/.test(trimmed);
    });
    return {
      passed: !truncated,
      detail: truncated ? "One or more sections appear truncated." : undefined,
    };
  },
};

export const VERIFICATION_CHECKS: VerificationCheck[] = [
  scoreRangeCheck,
  requiredSectionsCheck,
  scoreJustificationAlignment,
  competitiveNotEmpty,
  noTruncatedSentences,
];

export async function runVerification(
  result: IdeaEvaluationResult,
  options: {
    checks?: VerificationCheck[];
    maxRepairs?: number;
    repairFn?: (
      draft: IdeaEvaluationResult,
      failedCheckId: string
    ) => Promise<IdeaEvaluationResult>;
  } = {}
): Promise<VerifiedResult> {
  const checks = options.checks || VERIFICATION_CHECKS;
  const maxRepairs = options.maxRepairs ?? 2;
  const draft = structuredClone(result);
  const qualityWarnings: string[] = [];
  const internalWarnings: string[] = [];
  let repairsUsed = 0;
  let checksFailed = 0;

  const sortedChecks = [...checks].sort((a, b) => {
    const order: Record<Severity, number> = {
      fatal: 0,
      major: 1,
      minor: 2,
      cosmetic: 3,
    };
    return order[a.severity] - order[b.severity];
  });

  let current = draft;

  for (const check of sortedChecks) {
    let outcome = check.check(current);
    if (outcome.passed) continue;

    checksFailed += 1;

    if (check.severity === "fatal") {
      return {
        result: current,
        qualityWarnings: [`Fatal verification failure: ${check.name}`],
        internalWarnings: [`FATAL ${check.id}: ${outcome.detail || "unknown"}`],
        repairsUsed,
        checksRun: sortedChecks.length,
        checksFailed,
        fatalFailure: true,
      };
    }

    if (check.autoRepairable && options.repairFn && repairsUsed < maxRepairs) {
      for (
        let attempt = 0;
        attempt < check.maxRepairAttempts && repairsUsed < maxRepairs;
        attempt += 1
      ) {
        try {
          current = await options.repairFn(current, check.id);
          repairsUsed += 1;
          outcome = check.check(current);
          if (outcome.passed) break;
        } catch {
          internalWarnings.push(`Repair attempt failed for ${check.id}`);
          break;
        }
      }
    }

    if (!outcome.passed) {
      const detail = outcome.detail || "unknown";
      if (check.severity === "major") {
        qualityWarnings.push(`${check.name}: ${detail}`);
      }
      internalWarnings.push(`Unresolved ${check.severity}: ${check.id} - ${detail}`);
    }
  }

  return {
    result: current,
    qualityWarnings,
    internalWarnings,
    repairsUsed,
    checksRun: sortedChecks.length,
    checksFailed,
    fatalFailure: false,
  };
}

export function extractTextSections(result: IdeaEvaluationResult): Record<string, string> {
  return {
    summary: [result.summary?.title, result.summary?.oneLiner, result.summary?.mainVerdict]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(". "),
    technical: [
      result.technical?.comments,
      ...(result.technical?.keyRisks || []),
      ...(result.technical?.requiredComponents || []),
    ]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(". "),
    market: [
      ...(result.market?.competitorSignals || []),
      ...(result.market?.goToMarketRisks || []),
      ...(result.market?.targetAudience || []),
    ]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(". "),
    execution: [
      result.execution?.estimatedTimeline,
      ...(result.execution?.executionSignals || []),
      ...(result.execution?.founderReadinessFlags || []),
    ]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(". "),
    recommendations: [
      ...(result.recommendations?.mustFixBeforeBuild || []),
      ...(result.recommendations?.recommendedPivots || []),
      ...(result.recommendations?.niceToHaveLater || []),
    ]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(". "),
  };
}

function flattenNumbers(
  value: unknown,
  prefix: string = ""
): Array<{ key: string; value: number }> {
  if (value === null || value === undefined) return [];

  if (typeof value === "number" && Number.isFinite(value)) {
    return [{ key: prefix || "value", value }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, idx) => flattenNumbers(item, `${prefix}[${idx}]`));
  }

  if (typeof value !== "object") return [];

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    return flattenNumbers(child, fullKey);
  });
}

function normalizeClaimValue(claim: ExtractedClaim): number | null {
  if (typeof claim.value !== "number" || Number.isNaN(claim.value)) return null;
  let normalized = claim.value;
  const unit = (claim.unit || "").toLowerCase();

  if (unit === "billion" || unit === "b") normalized *= 1_000_000_000;
  else if (unit === "million" || unit === "m") normalized *= 1_000_000;
  else if (unit === "trillion" || unit === "t") normalized *= 1_000_000_000_000;

  return normalized;
}

function findClosestGroundingMatch(
  claim: ExtractedClaim,
  groundingNumbers: Array<{ key: string; value: number }>
): { key: string; value: number } | null {
  const normalizedClaim = normalizeClaimValue(claim);
  if (normalizedClaim === null || normalizedClaim <= 0) return null;

  let bestMatch: { key: string; value: number } | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const groundingValue of groundingNumbers) {
    if (!Number.isFinite(groundingValue.value) || groundingValue.value <= 0) continue;
    const distance = Math.abs(Math.log(normalizedClaim / groundingValue.value));
    if (distance < bestDistance && distance < Math.log(5)) {
      bestDistance = distance;
      bestMatch = groundingValue;
    }
  }

  return bestMatch;
}

export function verifyClaimsAgainstGrounding(
  claims: ExtractedClaim[],
  groundingData: Record<string, unknown>
): ClaimVerificationResult {
  let groundedClaims = 0;
  let contradictedClaims = 0;
  const contradictions: ClaimVerificationResult["contradictions"] = [];
  const groundingNumbers = flattenNumbers(groundingData);

  const checkableClaims = claims.filter(
    (claim) => claim.checkable && typeof claim.value === "number"
  );

  for (const claim of checkableClaims) {
    const normalizedClaimValue = normalizeClaimValue(claim);
    if (normalizedClaimValue === null) continue;

    const match = findClosestGroundingMatch(claim, groundingNumbers);
    if (!match) continue;

    const ratio = normalizedClaimValue / match.value;
    if (ratio >= 0.7 && ratio <= 1.3) {
      groundedClaims += 1;
      continue;
    }

    contradictedClaims += 1;
    contradictions.push({
      claim,
      groundingValue: match.value,
      discrepancy: `Claim says ${normalizedClaimValue}, grounding says ${match.value} (${match.key})`,
    });
  }

  const totalClaims = checkableClaims.length;
  const ungroundedClaims = totalClaims - groundedClaims - contradictedClaims;
  const groundingRate = totalClaims > 0 ? groundedClaims / totalClaims : 0;

  return {
    totalClaims,
    groundedClaims,
    ungroundedClaims,
    contradictedClaims,
    groundingRate,
    contradictions,
  };
}

function makeClaimGroundingCheck(
  claimVerification: ClaimVerificationResult
): VerificationCheck {
  return {
    id: "claim_grounding",
    name: "Factual claims consistent with grounding data",
    severity: "major",
    autoRepairable: false,
    maxRepairAttempts: 0,
    check: () => {
      if (claimVerification.contradictedClaims > 0) {
        return {
          passed: false,
          detail: `${claimVerification.contradictedClaims} contradicted claim(s): ${claimVerification.contradictions
            .slice(0, 2)
            .map((entry) => entry.discrepancy)
            .join("; ")}`,
        };
      }

      if (
        claimVerification.totalClaims > 3 &&
        claimVerification.groundingRate < 0.2
      ) {
        return {
          passed: false,
          detail: `Only ${Math.round(
            claimVerification.groundingRate * 100
          )}% of numerical claims could be verified`,
        };
      }

      return { passed: true };
    },
  };
}

export async function runEvaluationVerifier(params: {
  draftResult: IdeaEvaluationResult;
  evidencePack: EvidencePack;
  claims: EvidenceClaim[];
  model?: string;
  groundingData?: Record<string, unknown>;
  maxRepairs?: number;
  repairFn?: (
    result: IdeaEvaluationResult,
    failedCheckId: string
  ) => Promise<IdeaEvaluationResult>;
}): Promise<VerifierOutcome> {
  const sections = extractTextSections(params.draftResult);
  const extractedClaims = extractNumericalClaims(sections);
  const claimVerification =
    params.groundingData && extractedClaims.length > 0
      ? verifyClaimsAgainstGrounding(extractedClaims, params.groundingData)
      : undefined;

  const checks = [...VERIFICATION_CHECKS];
  if (claimVerification) {
    checks.push(makeClaimGroundingCheck(claimVerification));
  }

  const verified = await runVerification(params.draftResult, {
    checks,
    maxRepairs: params.maxRepairs ?? 2,
    repairFn: params.repairFn,
  });

  const hasMajorWarnings = verified.qualityWarnings.length > 0;
  const status: VerifierStatus = verified.fatalFailure
    ? "hard_fail"
    : hasMajorWarnings
      ? "soft_fail"
      : "pass";

  const issues =
    verified.qualityWarnings.length > 0
      ? verified.qualityWarnings
      : verified.internalWarnings;

  return {
    status,
    issues,
    repaired: verified.repairsUsed > 0,
    result: verified.result,
    qualityWarnings: verified.qualityWarnings,
    internalWarnings: verified.internalWarnings,
    repairsUsed: verified.repairsUsed,
    checksRun: verified.checksRun,
    checksFailed: verified.checksFailed,
    fatalFailure: verified.fatalFailure,
    claimVerification,
  };
}
