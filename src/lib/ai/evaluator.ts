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

/**
 * Gets safe model configuration from environment.
 */
function getEnvModelConfig() {
  const model = process.env.EVAL_MODEL || "gpt-5.2";
  // We used to enforce an allowlist here, but to support fallback logic 
  // and newer models without code changes, we now allow any string.
  // The API call will fail/fallback if invalid.

  return {
    model,
    reasoningEffort: process.env.EVAL_REASONING_FULL || "high"
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

INSTRUCTION: Flag "High Rug Risk" if Mint Authority is ACTIVE.
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

    // Call OpenAI
    // Call OpenAI
    // Construct parameters based on model type
    const isReasoningModel = model.startsWith('o1') || model.startsWith('gpt-5');

    const params: any = {
      model: model,
      messages: [
        { role: "system", content: VALIDATOR_SYSTEM_PROMPT },
        { role: "user", content: userContent }
      ],
    };

    if (isReasoningModel) {
      // Reasoning models (O1/GPT-5) handling
      // 1. Use max_completion_tokens (though we let it default to max if not set)
      // 2. reasoning_effort is supported on some O1 versions
      if (model.startsWith('o1') && !model.includes('mini')) {
        params.reasoning_effort = reasoningEffort;
      }

      // 3. Response Format
      // Our tests confirmed gpt-5.2 supports json_object, but o1-preview/mini might not.
      // We'll trust the config: if it's gpt-5.2, use JSON. If o1-preview, maybe skip.
      if (!model.startsWith('o1-preview')) {
        params.response_format = { type: "json_object" };
      }
    } else {
      // Standard models (GPT-4o)
      params.response_format = { type: "json_object" };
    }

    // Call OpenAI with Fallback Logic
    let response;
    try {
      response = await openai().chat.completions.create(params);
    } catch (error: any) {
      // Check for specific error codes suggesting model unavailability or invalid params
      const isModelError = error.status === 404 || error.status === 400 || (error.message && (error.message.includes('model') || error.message.includes('found')));

      if (isModelError && model !== 'gpt-4o') {
        console.warn(`[Evaluator] Primary model '${model}' failed (${error.status}). Falling back to 'gpt-4o'.`);

        // Retry with gpt-4o
        const fallbackParams = {
          model: 'gpt-4o',
          messages: params.messages,
          response_format: { type: "json_object" }
        };

        response = await openai().chat.completions.create(fallbackParams as any);
      } else {
        throw error; // Re-throw if it's not a recoverable model error
      }
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
