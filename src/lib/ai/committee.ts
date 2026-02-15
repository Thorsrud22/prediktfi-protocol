import { IdeaSubmission } from "@/lib/ideaSchema";
import { IdeaEvaluationResult } from "@/lib/ideaEvaluationTypes";
import { openai } from "@/lib/openaiClient";
import { GroundingEnvelope, MarketSnapshot } from "@/lib/market/types";
import { EvidenceClaim, EvidencePack } from "@/lib/ai/evidenceTypes";
import {
  groundingStalenessNote,
  committeeScoringRubric,
  PERMABEAR_SYSTEM_PROMPT,
  PERMABULL_SYSTEM_PROMPT,
  JUDGE_SYSTEM_PROMPT,
  JSON_OUTPUT_SCHEMA,
} from "./prompts";
import { buildIdeaContextSummary, detectLaunchedStatus } from "./evaluator";
import { parseEvaluationResponse } from "./parser";
import { calibrateScore } from "./calibration";
import { TokenSecurityCheck } from "@/lib/solana/token-check";
import { verifyTokenSecurityEnvelope } from "@/lib/solana/token-check";
import { fetchCompetitiveMemo } from "@/lib/market/competitive";
import { getEvaluationModelMap } from "@/lib/ai/model-routing";
import {
  buildModelRouteMeta,
  computeCommitteeDisagreement,
  computeDataFreshness,
  computeDebateDisagreementIndex,
  computeEvidenceCoverage,
  computeWeightedCommitteeScore,
  deriveConfidence,
  extractDataFreshness,
} from "@/lib/ai/trust-metrics";
import { runEvaluationVerifier } from "@/lib/ai/verifier";
import {
  buildVerificationLogEntry,
  emitVerificationLog,
  type FailedCheckRecord,
} from "@/lib/ai/verification-log";
import {
  getCategoryCommitteeIntelStep,
  sanitizeReasoningStepsForCategory,
} from "@/lib/ideaCategories";
import { estimatePromptTokens, formatGroundingForPrompt } from "@/lib/ai/grounding-formatter";
import { buildRoleSpecializationBlock } from "@/lib/ai/agent-roles";
import { classifyDomain } from "@/lib/ai/domain-classifier";

interface BearAnalysis {
  bearAnalysis?: {
    fatalFlaws?: string[];
    riskScore?: number;
    verdict?: "KILL" | "AVOID" | "SHORT";
    roast?: string;
    structuredCase?: string;
  };
  roleScores?: {
    marketOpportunity?: number;
    technicalFeasibility?: number;
    competitiveMoat?: number;
    executionReadiness?: number;
  };
}

interface BullAnalysis {
  bullAnalysis?: {
    alphaSignals?: string[];
    upsideScore?: number;
    verdict?: "ALL IN" | "APE" | "LONG";
    pitch?: string;
    structuredCase?: string;
  };
  roleScores?: {
    marketOpportunity?: number;
    technicalFeasibility?: number;
    competitiveMoat?: number;
    executionReadiness?: number;
  };
}

export type ProgressCallback = (step: string) => void;
export type ThoughtCallback = (thought: string) => void;

interface AgentCallResult<T = Record<string, unknown>> {
  output: T;
  failed: boolean;
}

function buildFallbackEvidencePack(unavailableSources: string[] = []): EvidencePack {
  return {
    evidence: [],
    unavailableSources,
    generatedAt: new Date().toISOString(),
  };
}

function buildClaimsSummary(claims: EvidenceClaim[]): string {
  if (claims.length === 0) return "No competitive claims were generated.";
  return claims
    .slice(0, 16)
    .map(
      (claim, i) =>
        `${i + 1}. [${claim.claimType}] ${claim.support || "uncorroborated"} | ids=${claim.evidenceIds.join(",") || "none"
        } | ${claim.text}`
    )
    .join("\n");
}

function buildEvidenceSummary(evidencePack: EvidencePack): string {
  if (evidencePack.evidence.length === 0) return "No external evidence available.";
  return evidencePack.evidence
    .slice(0, 28)
    .map(
      (item) =>
        `- ${item.id} [${item.source}/${item.reliabilityTier}] ${item.title}${item.url ? ` (${item.url})` : ""}`
    )
    .join("\n");
}

function isGroundingEnvelope<T>(value: unknown): value is GroundingEnvelope<T> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GroundingEnvelope<T>>;
  return (
    typeof candidate.fetchedAt === "string" &&
    typeof candidate.source === "string" &&
    typeof candidate.ttlHours === "number" &&
    typeof candidate.stalenessHours === "number" &&
    typeof candidate.isStale === "boolean" &&
    "data" in candidate
  );
}

function inferSeverityFromWarning(warning: string): FailedCheckRecord["severity"] {
  const lower = warning.toLowerCase();
  if (lower.includes("fatal")) return "fatal";
  if (lower.includes("minor")) return "minor";
  if (lower.includes("cosmetic")) return "cosmetic";
  return "major";
}

function extractCheckIdFromWarning(warning: string): string {
  const match = warning.match(/^([^:]+):/);
  if (match) {
    return match[1].trim().toLowerCase().replace(/\s+/g, "_");
  }
  return "unknown_check";
}

function normalizeDimensionKey(rawKey: string): string {
  const cleaned = rawKey
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "unknown";
  return tokens
    .map((token, index) =>
      index === 0 ? token : `${token.charAt(0).toUpperCase()}${token.slice(1)}`
    )
    .join("");
}

function addDimensionScore(
  bucket: Record<string, number[]>,
  key: string,
  value: unknown
): void {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return;
  const normalized = normalizeDimensionKey(key);
  if (!bucket[normalized]) bucket[normalized] = [];
  bucket[normalized].push(Math.max(0, Math.min(10, numeric)));
}

export async function evaluateWithCommittee(
  input: IdeaSubmission,
  options?: {
    evaluationId?: string;
    market?: MarketSnapshot;
    marketGrounding?: GroundingEnvelope<MarketSnapshot>;
    onProgress?: ProgressCallback;
    onThought?: ThoughtCallback;
  }
): Promise<IdeaEvaluationResult> {
  const modelMap = getEvaluationModelMap();
  const contextSummary = buildIdeaContextSummary(input);
  const normalizedCategory = input.projectType.toLowerCase();
  const domainClassification = classifyDomain(
    `${input.description || ""}\n${contextSummary}`,
    input.projectType
  );
  const classifiedDomain = domainClassification.domain;

  options?.onProgress?.(getCategoryCommitteeIntelStep(input.projectType));

  const tokenCheckPromise = input.tokenAddress
    ? verifyTokenSecurityEnvelope(input.tokenAddress).catch((err) => {
      console.warn("Token security envelope fetch failed:", err);
      return null;
    })
    : Promise.resolve<GroundingEnvelope<TokenSecurityCheck> | null>(null);

  const competitiveMemoPromise = ["memecoin", "defi", "ai"].includes(normalizedCategory)
    ? fetchCompetitiveMemo(input, normalizedCategory).catch((err) => {
      console.warn("Competitive memo fetch failed:", err);
      return null;
    })
    : Promise.resolve<Awaited<ReturnType<typeof fetchCompetitiveMemo>> | null>(null);

  const [tokenCheckRaw, competitiveMemoResult] = await Promise.all([
    tokenCheckPromise,
    competitiveMemoPromise,
  ]);
  const tokenCheck = isGroundingEnvelope(tokenCheckRaw) ? tokenCheckRaw.data : tokenCheckRaw;

  let marketContext = "";
  if (options?.market && options.market.source !== "fallback") {
    marketContext = `Market Data:\n${JSON.stringify(options.market, null, 2)}`;
  }

  let verificationContext = "";
  if (tokenCheck) {
    if (!tokenCheck.valid) {
      verificationContext = `Token Check: FAILED (${tokenCheck.error})`;
    } else {
      verificationContext = `Token Check: MINT=${tokenCheck.mintAuthority ? "ACTIVE" : "REVOKED"}, FREEZE=${tokenCheck.freezeAuthority ? "ACTIVE" : "REVOKED"
        }, LP=${tokenCheck.isLiquidityLocked ? "LOCKED" : "UNLOCKED"}`;
    }
  } else if (detectLaunchedStatus(input)) {
    verificationContext = "INTELLIGENCE GAP: Claims live, no CA provided.";
  }

  let competitiveContext = "";
  let referenceProjects: {
    name: string;
    metrics?: {
      marketCap?: string;
      tvl?: string;
      dailyUsers?: string;
      funding?: string;
      revenue?: string;
    };
  }[] = [];
  let evidencePack: EvidencePack = buildFallbackEvidencePack(
    ["memecoin", "defi", "ai"].includes(normalizedCategory) ? ["competitive"] : []
  );
  let competitiveClaims: EvidenceClaim[] = [];

  if (competitiveMemoResult?.status === "ok") {
    competitiveContext = `Competitors: ${competitiveMemoResult.memo.shortLandscapeSummary}`;
    referenceProjects = competitiveMemoResult.memo.referenceProjects || [];
    evidencePack = competitiveMemoResult.evidencePack || buildFallbackEvidencePack();
    competitiveClaims = competitiveMemoResult.memo.claims || [];
  } else if (["memecoin", "defi", "ai"].includes(normalizedCategory)) {
    evidencePack = buildFallbackEvidencePack(["competitive"]);
  }

  const freshnessEnvelopes: GroundingEnvelope<unknown>[] = [];
  if (options?.marketGrounding && isGroundingEnvelope(options.marketGrounding)) {
    freshnessEnvelopes.push(options.marketGrounding);
  }
  if (isGroundingEnvelope(tokenCheckRaw)) {
    freshnessEnvelopes.push(tokenCheckRaw);
  }
  if (competitiveMemoResult?.status === "ok" && isGroundingEnvelope(competitiveMemoResult.grounding)) {
    freshnessEnvelopes.push(competitiveMemoResult.grounding);
  }
  const freshness = computeDataFreshness(freshnessEnvelopes);
  const stalenessNote = groundingStalenessNote(freshness);
  const scoringRubric = committeeScoringRubric(input.projectType, classifiedDomain);
  const formattedGroundingBrief = formatGroundingForPrompt({
    market: options?.market,
    marketGrounding: options?.marketGrounding || null,
    tokenGrounding: isGroundingEnvelope(tokenCheckRaw) ? tokenCheckRaw : null,
    competitiveResult: competitiveMemoResult,
    maxTokens: 800,
  });

  const baseUserContent = `
Input Data:
${contextSummary}
${marketContext}
${verificationContext}
${competitiveContext}
${stalenessNote}
Domain classification: ${classifiedDomain} (confidence: ${domainClassification.confidence}; signals: ${domainClassification.matchedSignals.join(", ") || "none"})

--- SCORING RUBRIC ---
${scoringRubric}

--- STRUCTURED GROUNDING BRIEF ---
${formattedGroundingBrief}

Idea:
${JSON.stringify(input, null, 2)}
`;
  const promptContextTokens = estimatePromptTokens(baseUserContent);
  if (promptContextTokens > 3000) {
    options?.onThought?.(
      `[WARN] Prompt context is ${promptContextTokens} tokens before committee debate; consider trimming rubric/grounding payload.\n`
    );
  }
  const bearRoleBlock = buildRoleSpecializationBlock("bear", input.projectType, classifiedDomain);
  const bullRoleBlock = buildRoleSpecializationBlock("bull", input.projectType, classifiedDomain);
  const judgeRoleBlock = buildRoleSpecializationBlock("judge", input.projectType, classifiedDomain);

  const callAgent = async <T extends object>(
    model: string,
    sysPrompt: string,
    userPrompt: string,
    timeoutMs: number
  ): Promise<AgentCallResult<T>> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await openai().chat.completions.create(
        {
          model,
          messages: [
            { role: "system", content: sysPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);
      const parsed = JSON.parse(response.choices[0]?.message?.content || "{}") as T;
      return { output: parsed, failed: false };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.warn(`Agent (${model}) failed or timed out:`, errMsg);
      options?.onThought?.(`[ERROR] Agent ${model} failed: ${errMsg}\n`);
      return { output: {} as T, failed: true };
    }
  };

  options?.onProgress?.("Kicking off committee debate (Bull vs Bear)...");

  const [bearResult, bullResult] = await Promise.all([
    callAgent<BearAnalysis>(
      modelMap.bear,
      PERMABEAR_SYSTEM_PROMPT,
      `${baseUserContent}\n\n--- ROLE BRIEF ---\n${bearRoleBlock}`,
      25000
    ),
    callAgent<BullAnalysis>(
      modelMap.bull,
      PERMABULL_SYSTEM_PROMPT,
      `${baseUserContent}\n\n--- ROLE BRIEF ---\n${bullRoleBlock}`,
      25000
    ),
  ]);

  const bearOutput = bearResult.output;
  const bullOutput = bullResult.output;
  const agentFailures = (bearResult.failed ? 1 : 0) + (bullResult.failed ? 1 : 0);

  options?.onProgress?.(
    `Debate concluded. Bear: "${bearOutput.bearAnalysis?.verdict || "N/A"}", Bull: "${bullOutput.bullAnalysis?.verdict || "N/A"
    }"`
  );

  options?.onThought?.(`[BEAR] "${bearOutput.bearAnalysis?.roast || "Analysis unavailable"}"\n`);
  options?.onThought?.(`[BULL] "${bullOutput.bullAnalysis?.pitch || "Analysis unavailable"}"\n`);

  options?.onProgress?.("The Judge is deliberating...");

  const judgeContent = `
${baseUserContent}

--- COMMITTEE REPORTS ---
THE BEAR REPORT (Risks):
${JSON.stringify(bearOutput, null, 2)}

THE BULL REPORT (Upside):
${JSON.stringify(bullOutput, null, 2)}

--- EVIDENCE PACK ---
${buildEvidenceSummary(evidencePack)}

Unavailable sources:
${(evidencePack.unavailableSources || []).join(", ") || "none"}

Competitive claims:
${buildClaimsSummary(competitiveClaims)}

--- INSTRUCTION ---
Synthesize a final decision based on these reports and JSON schema.
If any claim is uncorroborated, treat it as tentative.
Apply this role brief during synthesis:
${judgeRoleBlock}
${JSON_OUTPUT_SCHEMA}
`;

  let judgeResponse: unknown;
  let fallbackUsed = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    judgeResponse = await openai().chat.completions.create(
      {
        model: modelMap.judge,
        messages: [
          { role: "system", content: JUDGE_SYSTEM_PROMPT },
          { role: "user", content: judgeContent },
        ],
        response_format: { type: "json_object" },
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.warn(`Primary Judge (${modelMap.judge}) failed/timed out: ${errMsg}`);
    options?.onThought?.(`[ERROR] Primary Judge failed: ${errMsg}\n`);
    options?.onProgress?.("High traffic. Switching to backup judge...");
    fallbackUsed = true;

    try {
      judgeResponse = await openai().chat.completions.create({
        model: modelMap.judgeFallback,
        messages: [
          { role: "system", content: JUDGE_SYSTEM_PROMPT },
          { role: "user", content: judgeContent },
        ],
        response_format: { type: "json_object" },
      });
    } catch (fallbackError) {
      const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      options?.onThought?.(`[ERROR] Backup Judge also failed: ${fallbackMsg}\n`);
      throw fallbackError;
    }
  }

  options?.onProgress?.("Final verdict reached.");

  let result = parseEvaluationResponse(judgeResponse);
  const weightedScore = computeWeightedCommitteeScore({
    bearRiskScore: bearOutput.bearAnalysis?.riskScore,
    bullUpsideScore: bullOutput.bullAnalysis?.upsideScore,
    judgeScore: result.overallScore,
  });
  const judgeRawScoreBeforeWeighting = result.overallScore;
  result.overallScore = weightedScore.weightedScore;

  const perDimensionScores: Record<string, number[]> = {};
  for (const [dimension, value] of Object.entries(bearOutput.roleScores || {})) {
    addDimensionScore(perDimensionScores, dimension, value);
  }
  for (const [dimension, value] of Object.entries(bullOutput.roleScores || {})) {
    addDimensionScore(perDimensionScores, dimension, value);
  }
  for (const [dimension, value] of Object.entries(result.subScores || {})) {
    addDimensionScore(perDimensionScores, dimension, value?.score);
  }

  const committeeDisagreement = computeCommitteeDisagreement({
    overallScores: {
      bear: weightedScore.inputs.bear,
      bull: weightedScore.inputs.bull,
      judge: weightedScore.inputs.judge,
    },
    perDimensionScores,
    sigmaThreshold: 2.0,
  });

  const structuredWarnings = result.meta?.structuredOutputWarnings || [];
  const verificationStart = performance.now();
  const groundingPayload: Record<string, unknown> = {
    market: options?.market || null,
    tokenSecurity: tokenCheck || null,
    competitiveMemo: competitiveMemoResult?.status === "ok" ? competitiveMemoResult.memo : null,
    evidence: {
      count: evidencePack.evidence.length,
      unavailableSources: evidencePack.unavailableSources || [],
    },
  };
  const verifierOutcome = await runEvaluationVerifier({
    draftResult: result,
    evidencePack,
    claims: competitiveClaims,
    groundingData: groundingPayload,
    maxRepairs: 2,
  });
  const verificationDurationMs = performance.now() - verificationStart;
  result = verifierOutcome.result;
  if (verifierOutcome.qualityWarnings && verifierOutcome.qualityWarnings.length > 0) {
    result.qualityWarnings = verifierOutcome.qualityWarnings;
  }

  const failedChecks: FailedCheckRecord[] = (verifierOutcome.qualityWarnings || []).map(
    (warning) => ({
      checkId: extractCheckIdFromWarning(warning),
      severity: inferSeverityFromWarning(warning),
      detail: warning,
      repairAttempted: (verifierOutcome.repairsUsed || 0) > 0,
      repairSucceeded: false,
    })
  );
  const structuredParseRecords: FailedCheckRecord[] = structuredWarnings.map((warning) => ({
    checkId: "structured_output_parse",
    severity: "minor",
    detail: warning,
    repairAttempted: false,
    repairSucceeded: false,
  }));

  const evaluationId =
    options?.evaluationId ||
    `eval_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const verificationLogEntry = buildVerificationLogEntry({
    evaluationId,
    checksRun: verifierOutcome.checksRun || 0,
    checksFailed: verifierOutcome.checksFailed || 0,
    repairsUsed: verifierOutcome.repairsUsed || 0,
    fatalFailure: verifierOutcome.fatalFailure || false,
    qualityWarnings: verifierOutcome.qualityWarnings || [],
    failedChecks: [...failedChecks, ...structuredParseRecords],
    durationMs: verificationDurationMs,
  });
  emitVerificationLog(verificationLogEntry);

  if (!result.technical.comments) {
    result.technical.comments = "";
  }

  result.technical.comments += `\n\n[COMMITTEE LOG]\nBear Verdict: ${bearOutput.bearAnalysis?.verdict
    } ("${bearOutput.bearAnalysis?.roast}")\nBull Verdict: ${bullOutput.bullAnalysis?.verdict
    } ("${bullOutput.bullAnalysis?.pitch}")`;

  if (verifierOutcome.status !== "pass") {
    result.technical.comments += `\n[VERIFIER] ${verifierOutcome.status.toUpperCase()} - ${verifierOutcome.issues[0] || "No details"
      }`;
  }

  result = calibrateScore({
    projectType: input.projectType,
    market: options?.market,
    rawResult: result,
    ideaSubmission: input,
  });
  result.reasoningSteps = sanitizeReasoningStepsForCategory(input.projectType, result.reasoningSteps);

  if (referenceProjects.length > 0) {
    const mappedCompetitors = referenceProjects.map((project) => ({
      name: project.name,
      metrics: project.metrics || {},
    }));

    const existingNames = new Set((result.market?.competitors || []).map((c) => c.name.toLowerCase()));
    const uniqueNewCompetitors = mappedCompetitors.filter((c) => !existingNames.has(c.name.toLowerCase()));
    result.market = {
      ...result.market,
      competitors: [...(result.market?.competitors || []), ...uniqueNewCompetitors],
    };
  }

  const debateDisagreementIndex = computeDebateDisagreementIndex(bearOutput, bullOutput);
  const evidenceCoverage = computeEvidenceCoverage(competitiveClaims);
  const competitiveCategorySupported = ["memecoin", "defi", "ai"].includes(normalizedCategory);
  const tavilyAvailable = !competitiveCategorySupported || evidencePack.evidence.some((item) => item.source === "tavily");
  const defillamaAvailable = evidencePack.evidence.some((item) => item.source === "defillama");
  const defillamaRequired = normalizedCategory === "defi";
  const externalDataAvailable = !competitiveCategorySupported || evidencePack.evidence.length > 0;
  const latestGroundingTimestamp =
    freshnessEnvelopes.map((envelope) => envelope.fetchedAt).sort().pop() ||
    extractDataFreshness(evidencePack);
  const confidence = deriveConfidence({
    evidenceCoverage,
    verifierStatus: verifierOutcome.status,
    fallbackUsed,
    externalDataAvailable,
    tavilyAvailable,
    defillamaRequired,
    defillamaAvailable,
    agentFailures,
    dataFreshness: freshness,
    claimVerification: verifierOutcome.claimVerification
      ? {
        totalClaims: verifierOutcome.claimVerification.totalClaims,
        groundingRate: verifierOutcome.claimVerification.groundingRate,
        contradictedClaims: verifierOutcome.claimVerification.contradictedClaims,
      }
      : undefined,
    committeeDisagreement: {
      overallScoreStdDev: committeeDisagreement.overallScoreStdDev,
      highDisagreementFlag: committeeDisagreement.highDisagreementFlag,
      topDisagreementDimension: committeeDisagreement.topDisagreementDimension,
    },
  });

  result.confidenceLevel = confidence.level;
  result.classifiedDomain = classifiedDomain;
  result.meta = {
    confidenceLevel: confidence.level,
    confidenceReasons: confidence.reasons,
    debateDisagreementIndex,
    evidenceCoverage,
    modelRoute: buildModelRouteMeta(modelMap, fallbackUsed),
    fallbackUsed,
    verifierStatus: verifierOutcome.status,
    verifierIssues: verifierOutcome.issues,
    verifierChecksRun: verifierOutcome.checksRun,
    verifierChecksFailed: verifierOutcome.checksFailed,
    verifierRepairsUsed: verifierOutcome.repairsUsed,
    dataFreshness: latestGroundingTimestamp || null,
    freshness,
    claimVerification: verifierOutcome.claimVerification,
    structuredOutputParsed: result.meta?.structuredOutputParsed,
    structuredOutputWarnings: structuredWarnings,
    promptContextTokens,
    weightedScore: weightedScore.weightedScore,
    weightedScoreInputs: weightedScore.inputs,
    weightedScoreWeights: weightedScore.weightsUsed,
    committeeDisagreement,
    classifiedDomain,
    domainClassificationConfidence: domainClassification.confidence,
    domainClassificationSignals: domainClassification.matchedSignals,
  };
  result.evidence = {
    ...evidencePack,
    claims: competitiveClaims,
  };

  if (!result.calibrationNotes) result.calibrationNotes = [];
  result.calibrationNotes.push(
    `Committee weighting applied (bear=${weightedScore.weightsUsed.bear ?? 0}, bull=${weightedScore.weightsUsed.bull ?? 0}, judge=${weightedScore.weightsUsed.judge ?? 0}). Judge raw score: ${judgeRawScoreBeforeWeighting}. Weighted score: ${weightedScore.weightedScore}.`
  );
  if (committeeDisagreement.highDisagreementFlag) {
    result.calibrationNotes.push(`Committee disagreement: ${committeeDisagreement.disagreementNote}`);
  }
  result.calibrationNotes.push(
    `Domain routing: ${classifiedDomain} (${domainClassification.confidence} confidence).`
  );
  if (fallbackUsed) {
    result.calibrationNotes.push("Reliability: Backup judge model used due primary timeout/failure.");
  }
  if (verifierOutcome.status !== "pass") {
    result.calibrationNotes.push(
      `Reliability: Verifier ${verifierOutcome.status}. ${verifierOutcome.issues[0] || "Quality checks identified issues."
      }`
    );
  }

  return result;
}
