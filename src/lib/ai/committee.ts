import { IdeaSubmission } from "@/lib/ideaSchema";
import { IdeaEvaluationResult } from "@/lib/ideaEvaluationTypes";
import { openai } from "@/lib/openaiClient";
import { MarketSnapshot } from "@/lib/market/types";
import { EvidenceClaim, EvidencePack } from "@/lib/ai/evidenceTypes";
import {
  PERMABEAR_SYSTEM_PROMPT,
  PERMABULL_SYSTEM_PROMPT,
  JUDGE_SYSTEM_PROMPT,
  JSON_OUTPUT_SCHEMA,
} from "./prompts";
import { buildIdeaContextSummary, detectLaunchedStatus } from "./evaluator";
import { parseEvaluationResponse } from "./parser";
import { calibrateScore } from "./calibration";
import { verifyTokenSecurity } from "@/lib/solana/token-check";
import { fetchCompetitiveMemo } from "@/lib/market/competitive";
import { getEvaluationModelMap } from "@/lib/ai/model-routing";
import {
  buildModelRouteMeta,
  computeDebateDisagreementIndex,
  computeEvidenceCoverage,
  deriveConfidence,
  extractDataFreshness,
} from "@/lib/ai/trust-metrics";
import { runEvaluationVerifier } from "@/lib/ai/verifier";
import {
  getCategoryCommitteeIntelStep,
  sanitizeReasoningStepsForCategory,
} from "@/lib/ideaCategories";

interface BearAnalysis {
  bearAnalysis?: {
    fatalFlaws?: string[];
    riskScore?: number;
    verdict?: "KILL" | "AVOID" | "SHORT";
    roast?: string;
  };
}

interface BullAnalysis {
  bullAnalysis?: {
    alphaSignals?: string[];
    upsideScore?: number;
    verdict?: "ALL IN" | "APE" | "LONG";
    pitch?: string;
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

export async function evaluateWithCommittee(
  input: IdeaSubmission,
  options?: {
    market?: MarketSnapshot;
    onProgress?: ProgressCallback;
    onThought?: ThoughtCallback;
  }
): Promise<IdeaEvaluationResult> {
  const modelMap = getEvaluationModelMap();
  const contextSummary = buildIdeaContextSummary(input);
  const normalizedCategory = input.projectType.toLowerCase();

  options?.onProgress?.(getCategoryCommitteeIntelStep(input.projectType));

  const tokenCheckPromise = input.tokenAddress
    ? verifyTokenSecurity(input.tokenAddress).catch((err) => ({ valid: false, error: String(err) } as any))
    : Promise.resolve(null);

  const competitiveMemoPromise = ["memecoin", "defi", "ai"].includes(normalizedCategory)
    ? fetchCompetitiveMemo(input, normalizedCategory).catch((err) => ({ status: "error", error: err } as any))
    : Promise.resolve(null);

  const [tokenCheckRaw, competitiveMemoResult] = await Promise.all([
    tokenCheckPromise,
    competitiveMemoPromise,
  ]);

  let marketContext = "";
  if (options?.market && options.market.source !== "fallback") {
    marketContext = `Market Data:\n${JSON.stringify(options.market, null, 2)}`;
  }

  let verificationContext = "";
  if (tokenCheckRaw) {
    if (!tokenCheckRaw.valid) {
      verificationContext = `Token Check: FAILED (${tokenCheckRaw.error})`;
    } else {
      verificationContext = `Token Check: MINT=${tokenCheckRaw.mintAuthority ? "ACTIVE" : "REVOKED"}, FREEZE=${tokenCheckRaw.freezeAuthority ? "ACTIVE" : "REVOKED"
        }, LP=${tokenCheckRaw.isLiquidityLocked ? "LOCKED" : "UNLOCKED"}`;
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

  const baseUserContent = `
Input Data:
${contextSummary}
${marketContext}
${verificationContext}
${competitiveContext}

Idea:
${JSON.stringify(input, null, 2)}
`;

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
    callAgent<BearAnalysis>(modelMap.bear, PERMABEAR_SYSTEM_PROMPT, baseUserContent, 25000),
    callAgent<BullAnalysis>(modelMap.bull, PERMABULL_SYSTEM_PROMPT, baseUserContent, 25000),
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
${JSON_OUTPUT_SCHEMA}
`;

  let judgeResponse: any;
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
  const verifierOutcome = await runEvaluationVerifier({
    draftResult: result,
    evidencePack,
    claims: competitiveClaims,
    model: modelMap.verifier,
  });
  result = verifierOutcome.result;

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
  const confidence = deriveConfidence({
    evidenceCoverage,
    verifierStatus: verifierOutcome.status,
    fallbackUsed,
    externalDataAvailable,
    tavilyAvailable,
    defillamaRequired,
    defillamaAvailable,
    agentFailures,
  });

  result.confidenceLevel = confidence.level;
  result.meta = {
    confidenceLevel: confidence.level,
    confidenceReasons: confidence.reasons,
    debateDisagreementIndex,
    evidenceCoverage,
    modelRoute: buildModelRouteMeta(modelMap, fallbackUsed),
    fallbackUsed,
    verifierStatus: verifierOutcome.status,
    verifierIssues: verifierOutcome.issues,
    dataFreshness: extractDataFreshness(evidencePack),
  };
  result.evidence = {
    ...evidencePack,
    claims: competitiveClaims,
  };

  if (!result.calibrationNotes) result.calibrationNotes = [];
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
