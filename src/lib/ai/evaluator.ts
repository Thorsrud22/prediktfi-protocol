/**
 * Idea Evaluator
 *
 * Orchestrates the AI-powered idea evaluation pipeline:
 * 1. Builds context from user submission
 * 2. Fetches market data and competitive analysis
 * 3. Calls OpenAI for evaluation
 * 4. Calibrates scores with post-processing rules
 *
 * Refactored to use modular imports for prompts, parsing, and calibration.
 */

import { IdeaSubmission } from "@/lib/ideaSchema";
import { IdeaEvaluationResult } from "@/lib/ideaEvaluationTypes";
import { openai } from "@/lib/openaiClient";
import { Langfuse } from "langfuse";
import { MarketSnapshot } from "@/lib/market/types";
import { fetchCompetitiveMemo } from "@/lib/market/competitive";
import { verifyTokenSecurity } from "@/lib/solana/token-check";

// Modular imports
import { VALIDATOR_SYSTEM_PROMPT, JSON_OUTPUT_SCHEMA } from "./prompts";
import { calibrateScore, ScoreCalibrationContext } from "./calibration";
import { parseEvaluationResponse } from "./parser";

// Re-export for backwards compatibility
export type { ScoreCalibrationContext } from "./calibration";
export { calibrateScore } from "./calibration";

/**
 * Builds a summary of the idea context for the LLM prompt.
 */
export function buildIdeaContextSummary(idea: IdeaSubmission): string {
  const parts = [
    `Project Type: ${idea.projectType}`,
    `Team Size: ${idea.teamSize}`,
    `Resources: ${idea.resources?.join(', ') || 'None specified'}`,

    // Smart Fields
    idea.memecoinNarrative ? `Memecoin Narrative: "${idea.memecoinNarrative}"` : '',
    idea.memecoinVibe ? `Memecoin Vibe: "${idea.memecoinVibe}"` : '',
    idea.defiRevenue ? `DeFi Revenue Model: "${idea.defiRevenue}"` : '',
    idea.defiMechanism ? `DeFi Mechanism: "${idea.defiMechanism}"` : '',
    idea.aiModelType ? `AI Model Strategy: "${idea.aiModelType}"` : '',
    idea.aiDataMoat ? `AI Data Moat: "${idea.aiDataMoat}"` : '',

    // Checklists
    idea.memecoinLaunchPreparation?.length ? `Memecoin Prep: ${idea.memecoinLaunchPreparation.join(', ')}` : '',
    idea.defiSecurityMarks?.length ? `DeFi Security Marks: ${idea.defiSecurityMarks.join(', ')}` : '',
    idea.aiInfraReadiness?.length ? `AI Infra: ${idea.aiInfraReadiness.join(', ')}` : '',

    `Success Definition: "${idea.successDefinition}"`,
    `MVP Scope (6-12m): "${idea.mvpScope || 'Not provided - assume vague/undefined'}"`,
    `Go-to-Market / First Users: "${idea.goToMarketPlan || 'Not provided - assume no distribution plan'}"`,
    `Launch & Liquidity Plan: "${idea.launchLiquidityPlan || 'Not provided - assume high rug risk / no liquidity plan'}"`,
    `Response Style: ${idea.responseStyle}`,
    `Focus Hints: ${idea.focusHints?.join(', ') || 'None'}`
  ];

  return parts.filter(p => p).join('\n');
}

function getEnvModelConfig() {
  const modelEnv = process.env.EVAL_MODEL || "prediktfi-engine-v1";

  // Map internal aliases to real OpenAI models
  let model = modelEnv;
  if (modelEnv === "prediktfi-engine-v1" || modelEnv === "gpt-5.2") {
    model = "gpt-4o";
  }

  return {
    model,
    // For o1 models we might use reasoning_effort in future, currently undefined for gpt-4o
    reasoningEffort: process.env.EVAL_REASONING_FULL || "medium"
  };
}

/**
 * Evaluates an idea using OpenAI.
 *
 * @param input The idea submission data.
 * @param options Optional configuration including market context.
 * @returns A promise that resolves to the evaluation result.
 */
export async function evaluateIdea(
  input: IdeaSubmission,
  options?: { market?: MarketSnapshot }
): Promise<IdeaEvaluationResult> {
  const contextSummary = buildIdeaContextSummary(input);

  // 1. Market Context (Macro)
  let marketContext = "";
  if (options?.market && options.market.source !== 'fallback') {
    marketContext = `
Market Context (Live Snapshot):
${JSON.stringify(options.market, null, 2)}
Use this context to judge timing and market fit.
`;
  }

  // 2. On-Chain Verification (Anti-Rug)
  let verificationContext = "";
  if (input.tokenAddress) {
    try {
      const check = await verifyTokenSecurity(input.tokenAddress);
      verificationContext = `
ON-CHAIN VERIFICATION (Real-Time Data):
- Token Address: ${input.tokenAddress}
- Supply: ${check.supply}
- Mint Authority: ${check.mintAuthority ? "ACTIVE (High Risk)" : "REVOKED (Safe)"}
- Freeze Authority: ${check.freezeAuthority ? "ACTIVE (High Risk)" : "REVOKED (Safe)"}
- Is Pump.fun: ${check.isPumpFun}
${check.isLiquidityLocked !== undefined ? `- Liquidity Locked: ${check.isLiquidityLocked ? "YES (Safe)" : "NO (Risk)"}` : ""}
${check.top10HolderPercentage !== undefined ? `- Top 10 Holder Concentration: ${check.top10HolderPercentage.toFixed(2)}%` : ""}
${check.creatorPercentage !== undefined ? `- Creator Holding: ${check.creatorPercentage.toFixed(2)}%` : ""}
${check.ownerPercentage !== undefined ? `- Owner Holding: ${check.ownerPercentage.toFixed(2)}%` : ""}
${check.totalLiquidity !== undefined ? `- Total Liquidity (USD): $${check.totalLiquidity.toLocaleString()}` : ""}

INSTRUCTION: Flag "High Rug Risk" if Mint Authority is ACTIVE or if Holder Concentration is extremely high (>80%) without clear explanation.
`;
    } catch {
      verificationContext = `
ON-CHAIN VERIFICATION FAILED:
Could not verify token address: ${input.tokenAddress}. Assume "Unverified" status.
`;
    }
  }

  // 3. Competitive Memo (Micro / Landscape)
  let competitiveContext = "";
  const normalizedCategory = input.projectType.toLowerCase();

  if (['memecoin', 'defi', 'ai'].includes(normalizedCategory)) {
    try {
      const compResult = await fetchCompetitiveMemo(input, normalizedCategory);
      if (compResult.status === 'ok') {
        const memo = compResult.memo;
        const competitorList = memo.referenceProjects
          .map(p => `${p.name} (${p.note})`)
          .join(', ');

        competitiveContext = `
COMPETITIVE_MEMO:
- Category: ${memo.categoryLabel}
- Crowdedness: ${memo.crowdednessLevel}
- Landscape: ${memo.shortLandscapeSummary}
- Known Competitors: ${competitorList || "None specific listed"}
- Evaluator Note: ${memo.evaluatorNotes}

INSTRUCTION: Use this data to ground your 'Moat' and 'Market Fit' scores.
`;
      }
    } catch (err) {
      console.warn("Failed to fetch competitive memo (non-blocking):", err);
    }
  }

  // 4. Build final user prompt
  const userContent = `Idea Context:
${contextSummary}
${marketContext}
${verificationContext}
${competitiveContext}

Idea Submission:
${JSON.stringify(input, null, 2)}

${JSON_OUTPUT_SCHEMA}`;

  try {
    const { model, reasoningEffort } = getEnvModelConfig();

    // Langfuse Integration
    const langfuse = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_HOST
    });

    const trace = langfuse.trace({
      name: "idea-evaluation",
      sessionId: "session-" + Math.random().toString(36).substring(7),
      metadata: {
        projectType: input.projectType,
        teamSize: input.teamSize,
        tokenAddress: input.tokenAddress
      },
      input: {
        system: VALIDATOR_SYSTEM_PROMPT,
        user: userContent
      }
    });

    const generation = trace.generation({
      name: "evaluator-gpt",
      model: model,
      input: userContent
    });

    // Prepare messages
    const messages = [
      { role: "system", content: VALIDATOR_SYSTEM_PROMPT },
      { role: "user", content: userContent }
    ];

    // Use standard Chat Completions API with extra params if needed
    let response;
    try {
      const isReasoningModel = (model.startsWith('o1') || model.startsWith('gpt-5'));

      const params: any = {
        model: model,
        messages: messages,
        response_format: { type: "json_object" }
      };

      if (isReasoningModel) {
        params.reasoning_effort = reasoningEffort;
      }

      response = await openai().chat.completions.create(params);

    } catch (error: any) {
      // Fallback
      console.warn(`[Evaluator] Primary model '${model}' failed (${error.message || error.status}). Falling back to 'gpt-4o-mini'.`);

      // Retry with gpt-4o-mini as safe fallback
      const fallbackParams = {
        model: 'gpt-4o-mini',
        messages: messages,
        response_format: { type: "json_object" }
      };

      response = await openai().chat.completions.create(fallbackParams as any);
    }

    // Parse response
    let result = parseEvaluationResponse(response);

    // Calibrate scores
    result = calibrateScore({
      projectType: input.projectType,
      market: options?.market,
      rawResult: result,
      ideaSubmission: input
    });

    // Explicitly set project type for frontend logic
    result.projectType = input.projectType;

    // Log to Langfuse
    generation.end({ output: result });
    trace.update({ output: result });
    await langfuse.flushAsync();

    return result;
  } catch (error) {
    console.error("Error evaluating idea with OpenAI:", error);
    throw new Error(
      `Failed to evaluate idea: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
