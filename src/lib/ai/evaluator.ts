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
import { gemini } from "@/lib/geminiClient"; // Gemini Support
import { Langfuse } from "langfuse";
import { MarketSnapshot } from "@/lib/market/types";
import { fetchCompetitiveMemo } from "@/lib/market/competitive";
import { verifyTokenSecurity } from "@/lib/solana/token-check";

// Modular imports
import { VALIDATOR_SYSTEM_PROMPT, JSON_OUTPUT_SCHEMA, ANALYSIS_STREAM_PROMPT } from "./prompts";
import { calibrateScore, ScoreCalibrationContext } from "./calibration";
import { parseEvaluationResponse } from "./parser";
import { SAFE_DEMO_RESULT } from "./safe-demo";

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

  const context = parts.filter(p => p).join('\n');
  return `<submission_data>\n${context}\n</submission_data>`;
}

function getEnvModelConfig() {
  const provider = process.env.EVAL_PROVIDER || "openai";
  const modelEnv = process.env.EVAL_MODEL || "prediktfi-engine-v1";

  // Google Gemini Configuration
  if (provider === "google") {
    // strict defaults for Gemini to ensure compatibility
    return {
      provider: "google",
      model: "gemini-1.5-flash", // fast, cheap, good for analysis
      displayName: "Gemini 1.5 Flash",
      reasoningEffort: "medium" // ignored by Gemini but kept for type compatibility
    };
  }

  // OpenAI Configuration
  // Map internal aliases to real OpenAI models
  // GPT-5.2 is now available as a real model (Jan 2026)
  let model = modelEnv;
  if (modelEnv === "prediktfi-engine-v1" || modelEnv === "gpt-5.2") {
    model = "gpt-5.2"; // REAL GPT-5.2 - flagship model
  }

  return {
    provider: "openai",
    model,
    displayName: "ChatGPT-5.2 (Deep Reasoning)", // Branded name for UI
    // GPT-5.2 supports: none (default), low, medium, high, xhigh
    // Using 'medium' for balanced reasoning depth on financial analysis
    reasoningEffort: (process.env.EVAL_REASONING_EFFORT || "medium") as "none" | "low" | "medium" | "high" | "xhigh"
  };
}

/**
 * Progress callback for streaming updates to client.
 */
export type ProgressCallback = (step: string) => void;

/**
 * Thought callback for streaming raw AI analysis to client.
 */
export type ThoughtCallback = (thought: string) => void;

/**
 * Evaluates an idea using OpenAI with optional real-time streaming.
 *
 * @param input The idea submission data.
 * @param options Optional configuration including market context and streaming callbacks.
 * @returns A promise that resolves to the evaluation result.
 */
export async function evaluateIdea(
  input: IdeaSubmission,
  options?: {
    market?: MarketSnapshot;
    onProgress?: ProgressCallback;
    onThought?: ThoughtCallback;  // NEW: for streaming analysis
  }
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

  // Helper to detect if project claims to be launched
  const isLaunched = detectLaunchedStatus(input);

  if (input.tokenAddress) {
    options?.onProgress?.(`Scanning token contract ${input.tokenAddress.slice(0, 8)}...`);
    try {
      const check = await verifyTokenSecurity(input.tokenAddress);

      // Check if verification actually succeeded
      if (!check.valid) {
        options?.onProgress?.(`⚠️ Token check failed: ${check.error || 'Unknown error'}`);
        verificationContext = `
ON-CHAIN CHECK FAILED:
- Token Address Provided: ${input.tokenAddress}
- Error: ${check.error || 'Invalid address or token not found'}
- Status: NOT VALIDATED
- INSTRUCTION: Flag as "Unvalidated Token" in the report. Do NOT display authority status.
`;
      } else {
        options?.onProgress?.(`✓ Authorities checked: Mint=${check.mintAuthority ? 'ACTIVE' : 'REVOKED'}, Freeze=${check.freezeAuthority ? 'ACTIVE' : 'REVOKED'}`);
        verificationContext = `
ON-CHAIN DATA (Real-Time):
- Token Address: ${input.tokenAddress}
- Supply: ${check.supply}
- Mint Authority: ${check.mintAuthority ? "ACTIVE (High Risk - Dev can print tokens)" : "REVOKED (Safe)"}
- Freeze Authority: ${check.freezeAuthority ? "ACTIVE (High Risk - Dev can freeze wallets)" : "REVOKED (Safe)"}
- Is Pump.fun: ${check.isPumpFun}
${check.isLiquidityLocked !== undefined ? `- Liquidity Locked: ${check.isLiquidityLocked ? "YES (Safe)" : "NO (Risk - potentially ruggable)"}` : ""}
${check.top10HolderPercentage !== undefined ? `- Top 10 Holder Concentration: ${check.top10HolderPercentage.toFixed(2)}%` : ""}
${check.creatorPercentage !== undefined ? `- Creator Holding: ${check.creatorPercentage.toFixed(2)}%` : ""}
${check.ownerPercentage !== undefined ? `- Owner Holding: ${check.ownerPercentage.toFixed(2)}%` : ""}
${check.totalLiquidity !== undefined ? `- Total Liquidity (USD): $${check.totalLiquidity.toLocaleString()}` : ""}
`;
      }
    } catch (error) {
      console.warn("Token check error:", error);
      // Don't fail the whole eval, just skip detailed token context
      options?.onProgress?.(`⚠️ Could not validate token: ${error instanceof Error ? error.message : 'Unknown error'}`);
      verificationContext = `
ON-CHAIN CHECK FAILED (System Error):
- Token Address: ${input.tokenAddress}
- Error: ${error instanceof Error ? error.message : String(error)}
- Status: NOT VALIDATED
`;
    }
  } else if (isLaunched) {
    // INTENTIONAL GAP: User claims launched but gave no CA
    verificationContext = `
INTELLIGENCE GAP ALERT:
- User claims project is "Launched" or "Live" but provided NO Contract Address (CA).
- CRITICAL: You MUST flag this in the report as a "Critical Intelligence Gap".
- STATE: "Project claims to be live but no contract address provided. Cannot verify on-chain data."
- PENALTY: Apply heavily penalty to 'Trust' and 'Launch Readiness' scores.
`;
  } else {
    verificationContext = `
ON-CHAIN DATA:
- No token address provided.
- Status: Pre-Launch / Unvalidated
`;
  }


  // 3. Competitive Memo (Micro / Landscape)
  let competitiveContext = "";
  const normalizedCategory = input.projectType.toLowerCase();

  // Store reference projects for later merging into result
  let referenceProjectsFromMemo: { name: string; chainOrPlatform: string; note: string; metrics?: { marketCap?: string; tvl?: string; dailyUsers?: string; funding?: string; revenue?: string } }[] = [];

  if (['memecoin', 'defi', 'ai'].includes(normalizedCategory)) {
    options?.onProgress?.(`Fetching competitive landscape for ${normalizedCategory}...`);
    try {
      const compResult = await fetchCompetitiveMemo(input, normalizedCategory);
      if (compResult.status === 'ok') {
        const memo = compResult.memo;

        // Capture referenceProjects for merging into final result
        referenceProjectsFromMemo = memo.referenceProjects || [];

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
      options?.onProgress?.(`Competitive memo skipped(non - blocking)`);
    }
  }

  // 4. Build final user prompt
  const baseUserContent = `Idea Context:
${contextSummary}
${marketContext}
${verificationContext}
${competitiveContext}

Idea Submission:
${JSON.stringify(input, null, 2)}`;

  const generationContent = `${baseUserContent}\n\n${JSON_OUTPUT_SCHEMA}`;

  // --- EARLY QUOTA CHECK: Fail fast before wasting user's time ---
  // This prevents the "bait and switch" where users wait through thinking phase
  // only to get a demo result at the end
  try {
    options?.onProgress?.("Validating API access...");
    await openai().chat.completions.create({
      model: 'gpt-4o-mini', // Cheapest model for validation
      messages: [{ role: 'user', content: 'ok' }],
      max_tokens: 1
    });
  } catch (pingError: any) {
    if (pingError.status === 429 || pingError.code === 'insufficient_quota' || pingError.message?.includes('429')) {
      console.warn("[Evaluator] Early quota check failed: 429. Returning demo mode immediately.");
      options?.onProgress?.("⚠️ API quota exhausted. Switching to demo mode...");
      await new Promise(r => setTimeout(r, 500)); // Brief pause for UX
      return SAFE_DEMO_RESULT;
    }
    // Other errors (network, auth) - log but continue, let the main flow handle
    console.warn("[Evaluator] Early quota check failed with non-429 error:", pingError.message);
  }

  try {
    const { provider, model, displayName, reasoningEffort } = getEnvModelConfig();

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
        tokenAddress: input.tokenAddress,
        provider: provider
      },
      input: {
        system: VALIDATOR_SYSTEM_PROMPT,
        user: generationContent
      }
    });

    const generation = trace.generation({
      name: `evaluator - ${provider} `,
      model: model,
      input: generationContent
    });

    let response;

    // --- GOOGLE GEMINI EXECUTION ---
    if (provider === "google") {
      options?.onProgress?.(`Initializing Gemini(${model})...`);

      try {
        const client = gemini();

        // PHASE 2: GENERATION
        options?.onProgress?.(`Synthesizing report via ${displayName}...`);

        const result = await client.models.generateContent({
          model: model,
          contents: [{ role: 'user', parts: [{ text: generationContent }] }],
          config: {
            responseMimeType: "application/json",
            systemInstruction: { parts: [{ text: VALIDATOR_SYSTEM_PROMPT }] }
          }
        });

        // Handle response text extraction safely
        let textResponse = "";
        // Try common patterns safely
        if ((result as any).text) {
          if (typeof (result as any).text === 'function') {
            textResponse = (result as any).text();
          } else {
            textResponse = (result as any).text;
          }
        } else if (result?.candidates?.[0]?.content?.parts?.[0]?.text) {
          textResponse = result.candidates[0].content.parts[0].text;
        } else {
          textResponse = JSON.stringify(result);
        }

        response = { output: textResponse };

      } catch (err: any) {
        console.error("Gemini Error:", err);
        throw err; // Trigger fallback or error handling
      }

    }
    // --- OPENAI EXECUTION (Default) ---
    else {
      // Prepare messages
      const messages = [
        { role: "system", content: VALIDATOR_SYSTEM_PROMPT },
        { role: "user", content: generationContent }
      ];

      // Use standard Chat Completions API with extra params if needed
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
        // --- PHASE 1: THOUGHT STREAMING (Raw Analysis) ---
        // The model "thinks out loud" first, streaming text to the user.
        let analysisContext = "";

        if (options?.onThought) {
          options?.onProgress?.(`Initiating deep dive analysis via ${displayName}...`);

          try {
            const streamParams = {
              model: model,
              messages: [
                { role: "system", content: ANALYSIS_STREAM_PROMPT },
                { role: "user", content: baseUserContent } // Use base content without schema for pure analysis
              ],
              stream: true
            };

            const stream = await openai().chat.completions.create(streamParams as any) as unknown as AsyncIterable<any>;

            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                analysisContext += content;
                options.onThought(content);
              }
            }

            // Add the thoughts to the context for Phase 2
            // This ensures the final JSON matches the streamed analysis
            messages.push({ role: "assistant", content: analysisContext });
            messages.push({ role: "user", content: "Based on your detailed analysis above, generate the final JSON report following the schema exactly." });

          } catch (err) {
            console.warn("[Evaluator] Thought stream failed, skipping to JSON phase:", err);
          }
        }

        // --- PHASE 2: JSON GENERATION (Final Report) ---
        options?.onProgress?.(`Synthesizing final report data...`);
        options?.onProgress?.(`AI synthesizing report via ${displayName}...`);
        response = await openai().chat.completions.create(params);

      } catch (error: any) {
        // Fallback to gpt-5-mini (cost-optimized GPT-5 variant)
        console.warn(`[Evaluator] Primary model '${model}' failed(${error.message || error.status}).Falling back to 'gpt-5-mini'.`);

        // Retry with gpt-5-mini as safe fallback
        const fallbackParams = {
          model: 'gpt-5-mini',
          messages: messages,
          response_format: { type: "json_object" },
          reasoning_effort: "low" // Lower reasoning for fallback
        };

        response = await openai().chat.completions.create(fallbackParams as any);
      }
    }
    options?.onProgress?.(`Report generated, calibrating scores...`);

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

    // CRITICAL FIX: Override estimatedTimeline if project is detected as launched
    if (detectLaunchedStatus(input)) {
      result.execution.estimatedTimeline = "Live / Deployed";
      if (!result.calibrationNotes) result.calibrationNotes = [];
      result.calibrationNotes.push("Timeline: Overridden to 'Live' loop due to detected launch status.");
    }

    // Set isVerified flag on cryptoNativeChecks based on whether token address was provided
    if (result.cryptoNativeChecks) {
      result.cryptoNativeChecks.isVerified = !!input.tokenAddress;
    }

    // Merge real competitor data from competitive memo into result
    // This ensures Market Intelligence displays actual competitors with metrics
    if (referenceProjectsFromMemo.length > 0) {
      // Map referenceProjects to the competitors format expected by the report
      const mappedCompetitors = referenceProjectsFromMemo.map(p => ({
        name: p.name,
        metrics: p.metrics || {}
      }));

      // Merge with any competitors the LLM may have returned (prefer real data)
      const existingNames = new Set((result.market?.competitors || []).map(c => c.name.toLowerCase()));
      const uniqueNewCompetitors = mappedCompetitors.filter(c => !existingNames.has(c.name.toLowerCase()));

      result.market = {
        ...result.market,
        competitors: [...(result.market?.competitors || []), ...uniqueNewCompetitors]
      };
    }

    // Log to Langfuse
    generation.end({ output: result });
    trace.update({ output: result });
    await langfuse.flushAsync();

    return result;
  } catch (error: any) {
    if (error.message?.includes('429') || error.status === 429 || error.code === 'insufficient_quota') {
      console.warn("OpenAI Quota Exceeded. Falling back to Safe Demo Result.");
      options?.onProgress?.("⚠️ API Quota limit reached. Switching to DEMO MODE...");

      // Simulate a short delay for realism
      await new Promise(r => setTimeout(r, 1500));

      return SAFE_DEMO_RESULT;
    }

    console.error("Error evaluating idea with OpenAI:", error);
    throw new Error(
      `Failed to evaluate idea: ${error instanceof Error ? error.message : "Unknown error"} `
    );
  }
}

/**
 * scanned text for launched status
 */
export function detectLaunchedStatus(idea: IdeaSubmission): boolean {
  const combinedText = (idea.description + " " + (idea.launchLiquidityPlan || "")).toLowerCase();
  const launchedKeywords = [
    "launched", "live on", "deployed", "contract address", "ca:", "token is live", "trading on"
  ];
  // Exclude future tense if possible (simple check)
  if (combinedText.includes("will launch") || combinedText.includes("planning to launch")) {
    return false;
  }
  return launchedKeywords.some(k => combinedText.includes(k));
}
