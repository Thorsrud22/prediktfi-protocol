import { IdeaSubmission } from "@/lib/ideaSchema";
import { IdeaEvaluationResult } from "@/lib/ideaEvaluationTypes";
import { openai } from "@/lib/openaiClient";
import { Langfuse } from "langfuse";

const WEB3_EVALUATION_GUIDE = `
When evaluating Web3, crypto and AI projects, you MUST always think about:

1. Token necessity:
   - Is a token actually required for the product to work, or is it just speculation and fundraising.
   - If the idea works just as well without a token, strongly penalize tokenomics.

2. Real users vs speculation:
   - Who are the concrete users, and what painful problem are they solving.
   - Pure price speculation or "number go up" is not a real user problem.

3. Moat and differentiation:
   - What is the wedge that makes this idea hard to copy (distribution, data, regulation, network effect, brand, infra).
   - If the idea is an undifferentiated clone of existing protocols or memecoins, scores should be low.

4. Regulatory and trust risk:
   - If the project touches finance, yield, leverage, custody or KYC/AML sensitive flows, you MUST consider regulatory and trust risk.
   - Conservative scores unless the founder clearly understands and mitigates this.

5. Execution complexity:
   - Solo founders should be penalized for highly complex infra, multi-chain, or capital-intensive ideas.
   - Simple, focused scopes with a clear path to MVP should be rewarded.

6. Token design and incentives:
   - If a token is used, check whether value accrual and incentive design are coherent.
   - Avoid vague "governance tokens" without clear, non-ponzinomic demand drivers.

7. On-chain vs off-chain reality:
   - Do not overestimate what can realistically be done fully on-chain.
   - Consider data, latency, oracle and infra constraints.

Use these heuristics consistently when scoring and writing recommendations.
`;

const VALIDATOR_SYSTEM_PROMPT = `You are The Validator, a strict, financially driven evaluator for Web3 and AI ideas.
Your goal is to determine 'Investability'. You must facilitate a clear financial decision (Buy, Watch, or Pass).

TONE INSTRUCTIONS (Context-Aware):
- IF PROJECT TYPE IS 'AI' OR 'DEFI' OR 'INFRA':
  - Use professional, Venture Capital terminology.
  - Focus on: Moat, Defensibility, Unit Economics, Technical Debt, Security, Audit.
  - Be sharp and strategic but professional. Avoid slang.
  - "Is the tech proprietary?" "Is there a real moat?"

- IF PROJECT TYPE IS 'MEMECOIN' OR 'CONSUMER':
  - Use Crypto-native, narrative-driven terminology.
  - Focus on: Liquidity, Distribution, Rug Risk, Narrative Stickiness, Community Hype.
  - "Is the distribution fair?" "Will the team rug?" "Is the meme alpha?"

CRITICAL:
- Your "mainVerdict" MUST be a direct thesis statement (e.g., "Pass - Liquidity risk too high" or "Watchlist - Strong tech but early").
- Frame risks as "Investor Worries" (Deal Killers).
- Frame market fit as "The Alpha" (Competitive Edge).

You must explicitly assess "Crypto-Native Checks" in your output (keyRisks, launchReadinessSignals, executionSignals).
Note: Only include the 'cryptoNativeChecks' JSON block if the project involves a token, DeFi, or explicitly mentions on-chain components.

1. RUG RISK (Crucial for Memecoins/DeFi):
   - Look for LP lock plans, ownership renouncement, dev wallet transparency, and mint authority.
   - If NO LP/ownership plan is mentioned for a token project, flag this as "High Rug Risk" or "Unclear Ownership".
   - Be blunt: "No LP lock plan = high risk".

2. SECURITY POSTURE (Crucial for DeFi/Infra):
   - Look for audits, battle-tested templates, multisig usage, and access control.
   - If a complex protocol has no security plan, flag it: "Security: Non-existent".

3. LIQUIDITY & LAUNCH QUALITY:
   - Where does liquidity come from? Is the distribution fair?
   - Vague plans ("we will market it") should be penalized.
   - Concrete plans ("100% LP burned", "Treasury multisig") should be rewarded.

Always evaluate along these axes:
- Technical feasibility (Moat)
- Tokenomics (Value Accrual)
- Market and real users (Alpha)
- Execution difficulty (Team Delivery)
- Clear recommendations (Critical Fixes)

You also have an internal Web3 evaluation guide you must follow strictly:
${WEB3_EVALUATION_GUIDE}

Always return a JSON object that matches the IdeaEvaluationResult type used in this project.
Do not output anything outside the JSON.
If the idea is mostly hype or a meme coin with no real value, say it clearly in the JSON fields and lower the scores.`;

export function buildIdeaContextSummary(idea: IdeaSubmission): string {
  const parts = [
    `Project Type: ${idea.projectType}`,
    `Team Size: ${idea.teamSize}`,
    `Resources: ${idea.resources.join(', ')}`,
    `Success Definition: "${idea.successDefinition}"`,
    `MVP Scope (6-12m): "${idea.mvpScope || 'Not provided - assume vague/undefined'}"`,
    `Go-to-Market / First Users: "${idea.goToMarketPlan || 'Not provided - assume no distribution plan'}"`,
    `Launch & Liquidity Plan: "${idea.launchLiquidityPlan || 'Not provided - assume high rug risk / no liquidity plan'}"`,
    `Response Style: ${idea.responseStyle}`,
    `Focus Hints: ${idea.focusHints?.join(', ') || 'None'}`
  ];

  return parts.join('\n');
}

import { MarketSnapshot } from "@/lib/market/types";

// ... existing imports

import { fetchCompetitiveMemo } from "@/lib/market/competitive";

// ... existing imports

import { verifyTokenSecurity } from "@/lib/solana/token-check";

// ... existing imports

/**
 * Evaluates an idea using OpenAI (Model configurable via env).
 * 
 * @param input The idea submission data.
 * @param options Optional configuration including market context.
 * @returns A promise that resolves to the evaluation result.
 */
// Helper to get safe model config
function getEnvModelConfig() {
  const model = process.env.EVAL_MODEL || "gpt-5.2";
  const approvedModels = ["gpt-5.2", "gpt-5.2-pro", "o1-preview", "o1"]; // strict allowlist

  if (!approvedModels.includes(model)) {
    throw new Error(`Configured model '${model}' is not in the allowlist. Aborting safety check.`);
  }

  return {
    model,
    reasoningEffort: process.env.EVAL_REASONING_FULL || "high"
  };
}

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

  // 1.5 On-Chain Verification (Anti-Rug)
  let verificationContext = "";
  if (input.tokenAddress) {
    try {
      const check = await verifyTokenSecurity(input.tokenAddress);
      verificationContext = `
ON-CHAIN VERIFICATION (Real-Time Data):
- Token Address: ${input.tokenAddress}
- Supply: ${check.supply}
- Mint Authority: ${check.mintAuthority ? "ACTIVE (High Risk - Dev can print tokens)" : "REVOKED (Safe)"}
- Freeze Authority: ${check.freezeAuthority ? "ACTIVE (High Risk - Dev can freeze wallets)" : "REVOKED (Safe)"}
- Is Pump.fun: ${check.isPumpFun}

INSTRUCTION: 
If Mint Authority is ACTIVE, you MUST flag this as "High Rug Risk" in 'cryptoNativeChecks'.
If Mint Authority is REVOKED, reward this in the 'Rug Risk' score.
`;
    } catch (e) {
      verificationContext = `
ON-CHAIN VERIFICATION FAILED:
Could not verify token address: ${input.tokenAddress}. 
Assume "Unverified" status.
`;
    }
  }

  // 2. Competitive Memo (Micro / Landscape)
  let competitiveContext = "";
  const normalizedCategory = input.projectType.toLowerCase();

  // Only fetch for supported categories to save tokens/time
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
If the memo says the space is saturated, be very skeptical of "revolutionary" claims.
Do NOT invent new competitors not listed here or known to you.
`;
      }
    } catch (err) {
      // Silently fail to avoid blocking the main evaluation
      console.warn("Failed to fetch competitive memo (non-blocking):", err);
    }
  }

  const userContent = `Idea Context:
${contextSummary}
${marketContext}
${verificationContext}
${competitiveContext}

Idea Submission:
${JSON.stringify(input, null, 2)}

IMPORTANT: You MUST return the result as a JSON object with the EXACT following structure. Do not use any other schema.
{
  "overallScore": <number 0-100>,
  "summary": {
    "title": "<short catchy title>",
    "oneLiner": "<one sentence summary>",
    "mainVerdict": "<direct verdict>"
  },
  "technical": {
    "feasibilityScore": <number 0-100>,
    "keyRisks": ["<risk1>", "<risk2>"],
    "requiredComponents": ["<component1>", "<component2>"],
    "comments": "<technical assessment>"
  },
  "tokenomics": {
    "tokenNeeded": <boolean>,
    "designScore": <number 0-100>,
    "mainIssues": ["<issue1>", "<issue2>"],
    "suggestions": ["<suggestion1>", "<suggestion2>"]
  },
  "market": {
    "marketFitScore": <number 0-100>,
    "targetAudience": ["<audience1>", "<audience2>"],
    "competitorSignals": ["<competitor1>", "<competitor2>"],
    "goToMarketRisks": ["<risk1>", "<risk2>"]
  },
  "execution": {
    "complexityLevel": "low" | "medium" | "high",
    "founderReadinessFlags": ["<flag1>", "<flag2>"],
    "estimatedTimeline": "<timeline>",
    "executionRiskScore": <number 0-100>,
    "executionRiskLabel": "low" | "medium" | "high",
    "executionSignals": ["<signal1>", "<signal2>"]
  },
  "recommendations": {
    "mustFixBeforeBuild": ["<item1>", "<item2>"],
    "recommendedPivots": ["<pivot1>", "<pivot2>"],
    "niceToHaveLater": ["<item1>", "<item2>"]
  },
  "cryptoNativeChecks": {
    "rugPullRisk": "low" | "medium" | "high",
    "auditStatus": "audited" | "planned" | "none" | "not_applicable",
    "liquidityStatus": "locked" | "burned" | "unclear" | "not_applicable",
    "isAnonTeam": <boolean>
  },
  "launchReadinessScore": <number 0-100>,
  "launchReadinessLabel": "low" | "medium" | "high",
  "launchReadinessSignals": ["<signal1>", "<signal2>"]
}`;

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
      sessionId: "session-" + Math.random().toString(36).substring(7), // Simple session ID for now
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

    // @ts-ignore - responses API might not be in the types yet
    const response = await openai().responses.create({
      model: model,
      input: [
        { role: "system", content: VALIDATOR_SYSTEM_PROMPT },
        { role: "user", content: userContent }
      ],
      // Activate "Thinking" logic via parameter, not model name
      reasoning: {
        effort: reasoningEffort
      },
      text: {
        format: { type: "json_object" }
      },
    } as any);

    // Assuming the response structure matches the new API
    // If it returns a direct object or has a different structure, we might need to adjust
    // For now, using the standard choice/message pattern or the direct output if documented
    // The user didn't specify the return shape, so I'll assume it returns content directly or in choices

    // Based on "Responses API", it might return the content directly or in a 'output' field
    // But to be safe and follow the user's "Parse the JSON" instruction:

    let responseContent;
    const anyResponse = response as any;

    if (anyResponse.output_text) {
      responseContent = anyResponse.output_text;
    } else if (anyResponse.output) {
      responseContent = anyResponse.output;
    } else if (anyResponse.choices && anyResponse.choices[0]?.message?.content) {
      responseContent = anyResponse.choices[0].message.content;
    } else {
      // Fallback/Best guess for new API structure
      responseContent = JSON.stringify(response);
    }

    // Let's try to handle both string and object
    let result: IdeaEvaluationResult;

    if (typeof responseContent === 'string') {
      try {
        result = JSON.parse(responseContent) as IdeaEvaluationResult;
      } catch (e) {
        // If it's already an object but stringified weirdly, or if responseContent was just the object
        if (typeof response === 'object') {
          result = response as unknown as IdeaEvaluationResult;
        } else {
          throw e;
        }
      }
    } else if (typeof responseContent === 'object') {
      result = responseContent as IdeaEvaluationResult;
    } else {
      // If we couldn't find content in standard places, maybe the response IS the result
      result = response as unknown as IdeaEvaluationResult;
    }

    // Basic validation to ensure required fields exist
    if (!result.overallScore || !result.summary || !result.technical) {
      throw new Error("Invalid response structure from OpenAI");
    }

    // Post-process the score with opinionated rules
    result = calibrateScore({
      projectType: input.projectType,
      market: options?.market,
      rawResult: result,
      ideaSubmission: input
    });

    // Log the final result to Langfuse
    generation.end({
      output: result
    });

    // ALSO update the parent trace so it shows up in the main list
    trace.update({
      output: result
    });

    // Important: Flush async in serverless
    await langfuse.flushAsync();

    return result;
  } catch (error) {
    console.error("Error evaluating idea with OpenAI:", error);
    throw new Error(
      `Failed to evaluate idea: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export interface ScoreCalibrationContext {
  rawResult: IdeaEvaluationResult;
  projectType: string;
  market?: MarketSnapshot;
  ideaSubmission?: IdeaSubmission;
}

/**
 * Adjusts the overall score based on specific rules to handle edge cases
 * like meme coins (cap score) or strong infra ideas (boost score).
 * 
 * @param context The calibration context containing raw result, project type, and market data
 * @returns The adjusted evaluation result
 */
export function calibrateScore(context: ScoreCalibrationContext): IdeaEvaluationResult {
  const { rawResult, projectType, ideaSubmission } = context;
  const newResult = JSON.parse(JSON.stringify(rawResult)) as IdeaEvaluationResult;
  const calibrationNotes: string[] = newResult.calibrationNotes || [];

  // Rule 1: Cap hype / meme ideas
  // If it looks like a meme coin or pure hype, cap the score at 40.
  // We can now also check projectType explicitly if needed, but keeping logic similar for now
  // as per instructions to not change scoring behavior yet.
  const lowerSummary = (newResult.summary.oneLiner + " " + newResult.summary.mainVerdict).toLowerCase();
  const isMemeOrHype =
    projectType === 'memecoin' || // Explicit check now possible
    lowerSummary.includes("meme") ||
    lowerSummary.includes("memecoin") ||
    lowerSummary.includes("pure hype") ||
    lowerSummary.includes("no real utility") ||
    lowerSummary.includes("speculative");

  if (isMemeOrHype) {
    // Start with the raw score
    let score = newResult.overallScore;

    // Penalty 1: IP / Legal Risk
    // If the model flagged specific risks in text, apply a heavy penalty
    const riskText = [
      ...(newResult.technical.keyRisks || []),
      ...(newResult.market.goToMarketRisks || [])
    ].join(" ").toLowerCase();

    const hasLegalRisk =
      riskText.includes("legal") ||
      riskText.includes("copyright") ||
      riskText.includes("ip infringement") ||
      riskText.includes("trademark") ||
      riskText.includes("scam");

    if (hasLegalRisk) {
      score -= 20;
      calibrationNotes.push("Memecoin: minus points for heavy dependence on one celebrity/brand without a twist.");
    }

    // Penalty 2: Weak Narrative / Differentiation
    // Use marketFitScore as a proxy for narrative strength
    if (newResult.market.marketFitScore < 50) {
      score -= 10;
      calibrationNotes.push("Memecoin: minus points for weak or generic meme narrative.");
    }

    // Apply bounds
    // Cap at 90 (conservative for memecoins)
    // Floor at 10
    newResult.overallScore = Math.max(10, Math.min(90, score));

    // Market-Aware Calibration (Memecoin)
    // Mission 17: "A good meme is a good meme."
    // - Removed BTC Dominance penalties (irrelevant).
    // - Added SOL Price Bonus (Mania Mode).
    if (context.market && context.market.source !== 'fallback') {
      const { solPriceUsd } = context.market;

      // Solana Mania Bonus (> $150 matches "Vibes are good")
      // Only a bonus, never a penalty.
      if (solPriceUsd > 150) {
        newResult.overallScore += 2;
        calibrationNotes.push("Market: + points for launching during strong Solana price action (> $150).");
      }
    }
  }

  // Rule 1.5: DeFi Calibration
  // Adjust scores for DeFi projects based on security awareness and complexity.
  if (projectType === 'defi') {
    let score = newResult.overallScore;
    const riskText = [
      ...(newResult.technical.keyRisks || []),
      ...(newResult.technical.comments ? [newResult.technical.comments] : []),
      ...(newResult.market.goToMarketRisks || [])
    ].join(" ").toLowerCase();

    const hasSecurityKeywords =
      riskText.includes("audit") ||
      riskText.includes("security") ||
      riskText.includes("regulation") ||
      riskText.includes("compliance");

    const isComplex = newResult.execution.complexityLevel === 'high';
    const isSimpleOrMedium = newResult.execution.complexityLevel === 'low' || newResult.execution.complexityLevel === 'medium';
    const hasSpecificAudience = newResult.market.targetAudience && newResult.market.targetAudience.length > 0 && newResult.market.targetAudience[0].length > 3; // Basic check for non-empty

    // Negative Adjustment (-5)
    // Complex but no security mentions, OR token needed but vague audience
    if ((isComplex && !hasSecurityKeywords) || (newResult.tokenomics.tokenNeeded && !hasSpecificAudience)) {
      score -= 5;
      calibrationNotes.push("DeFi: minus points for high complexity and no audit/security plan mentioned.");
    }

    // Positive Adjustment (+5)
    // Simple/Medium complexity AND security aware AND specific audience
    if (isSimpleOrMedium && hasSecurityKeywords && hasSpecificAudience) {
      score += 5;
      calibrationNotes.push("DeFi: plus points for explicit audit/security thinking and a concrete target user.");
    }

    // Bounds 10-95
    newResult.overallScore = Math.max(10, Math.min(95, score));

    // Market-Aware Calibration (DeFi)
    if (context.market && context.market.source !== 'fallback') {
      const { btcDominance } = context.market;

      // Weak Market / Risk Off (BTC Dominance > 60%)
      // Harder for complex DeFi to get traction/liquidity
      if (btcDominance > 60 && isComplex) {
        newResult.overallScore -= 2;
        calibrationNotes.push("DeFi: minus points for high complexity during risk-off market conditions.");
      }

      // Strong Market / Risk On (BTC Dominance < 40%)
      // Good environment for secure DeFi
      if (btcDominance < 40 && hasSecurityKeywords) {
        newResult.overallScore += 3;
        calibrationNotes.push("DeFi: plus points for launching during favorable risk-on market conditions.");
      }
    }
  }

  // Rule 2: Don't under-score strong infra ideas
  // If technical and market are strong (>= 75), and token is not needed, ensure score is decent (60-90).
  const isStrongTech = newResult.technical.feasibilityScore >= 75;
  const isStrongMarket = newResult.market.marketFitScore >= 75;
  const noTokenNeeded = newResult.tokenomics.tokenNeeded === false;

  if (isStrongTech && isStrongMarket && noTokenNeeded) {
    // Boost to at least 60
    if (newResult.overallScore < 60) {
      newResult.overallScore = 60;
      calibrationNotes.push("AI: plus points for a clear pain point and realistic data/infra story.");
    }
    // Cap at 90 (don't let it get too crazy just because it's solid infra)
    if (newResult.overallScore > 90) {
      newResult.overallScore = 90;
      calibrationNotes.push("AI: capped at 90 to maintain realism.");
    }
  }

  // Rule 3: Execution & Team Risk Calibration
  // Adjust executionRiskScore and overallScore based on team signals
  const executionSignals = (newResult.execution.executionSignals || []).join(" ").toLowerCase();
  const readinessFlags = (newResult.execution.founderReadinessFlags || []).join(" ").toLowerCase();
  const combinedExecutionText = executionSignals + " " + readinessFlags;

  // Memecoin Execution Rules
  if (projectType === 'memecoin') {
    const isAnon = combinedExecutionText.includes("anon") || combinedExecutionText.includes("anonymous");
    const hasTrackRecord = combinedExecutionText.includes("shipped") || combinedExecutionText.includes("track record") || combinedExecutionText.includes("previous exit");

    if (isAnon && !hasTrackRecord) {
      newResult.execution.executionRiskScore = Math.max(0, newResult.execution.executionRiskScore - 10);
      newResult.execution.executionRiskLabel = 'high';
      calibrationNotes.push("Execution: minus points for anon team with no prior shipped products.");
    }

    if (hasTrackRecord) {
      newResult.execution.executionRiskScore = Math.min(100, newResult.execution.executionRiskScore + 10);
      calibrationNotes.push("Execution: plus points for proven domain experience and previous launches.");
    }
  }

  // DeFi Execution Rules
  if (projectType === 'defi') {
    const isComplex = newResult.execution.complexityLevel === 'high';
    const hasExperience = combinedExecutionText.includes("defi experience") || combinedExecutionText.includes("solidity") || combinedExecutionText.includes("rust");
    const hasAudit = combinedExecutionText.includes("audit") || combinedExecutionText.includes("security partner");

    if (isComplex && !hasExperience && !hasAudit) {
      newResult.execution.executionRiskScore = Math.max(0, newResult.execution.executionRiskScore - 15);
      newResult.execution.executionRiskLabel = 'high';
      newResult.overallScore = Math.max(10, newResult.overallScore - 5); // Hard penalty on overall score too
      calibrationNotes.push("Execution: minus points for complex DeFi protocol without specific experience or audits.");
    }

    if (hasExperience || hasAudit) {
      newResult.execution.executionRiskScore = Math.min(100, newResult.execution.executionRiskScore + 10);
      calibrationNotes.push("Execution: plus points for DeFi experience or security partners.");
    }
  }

  // AI Execution Rules
  if (projectType === 'ai') {
    const isAmbitious = newResult.execution.complexityLevel === 'high';
    const hasMLBackground = combinedExecutionText.includes("ml engineer") || combinedExecutionText.includes("phd") || combinedExecutionText.includes("faang") || combinedExecutionText.includes("research");

    if (isAmbitious && !hasMLBackground) {
      newResult.execution.executionRiskScore = Math.max(0, newResult.execution.executionRiskScore - 10);
      newResult.execution.executionRiskLabel = 'high';
      calibrationNotes.push("Execution: minus points for ambitious AI project without clear ML/engineering background.");
    }

    if (hasMLBackground) {
      newResult.execution.executionRiskScore = Math.min(100, newResult.execution.executionRiskScore + 10);
      calibrationNotes.push("Execution: plus points for strong technical/ML background.");
    }
  }



  // Rule 4: Launch Readiness Calibration
  // Adjust launchReadinessScore and overallScore based on launch signals
  if (newResult.launchReadinessScore !== undefined) {
    const launchSignals = (newResult.launchReadinessSignals || []).join(" ").toLowerCase();

    // Memecoin Launch Rules
    if (projectType === 'memecoin') {
      const hasLiquidityPlan = launchSignals.includes("liquidity") || launchSignals.includes("lp") || launchSignals.includes("treasury") || (ideaSubmission?.launchLiquidityPlan && ideaSubmission.launchLiquidityPlan.length > 10);
      const hasCommunityPlan = launchSignals.includes("community") || launchSignals.includes("content") || launchSignals.includes("viral") || (ideaSubmission?.goToMarketPlan && ideaSubmission.goToMarketPlan.length > 10);

      if (!hasLiquidityPlan) {
        newResult.launchReadinessScore = Math.max(0, newResult.launchReadinessScore! - 20);
        newResult.launchReadinessLabel = 'low';
        calibrationNotes.push("Launch (memecoin): minus points for no LP or anti-rug thinking.");
      }

      if (hasLiquidityPlan && hasCommunityPlan) {
        newResult.launchReadinessScore = Math.min(100, newResult.launchReadinessScore! + 10);
        calibrationNotes.push("Launch: plus points for clear LP and community plan.");
      }

      // Mission 14A: Tune Memecoin Launch Risk
      // Check for 'Standard Degen' setup (Self-buy + Lock) vs 'High Risk'
      if (ideaSubmission?.launchLiquidityPlan) {
        const plan = ideaSubmission.launchLiquidityPlan.toLowerCase();

        // Anti-rug keywords
        const hasLock = plan.includes("lock") || plan.includes("vesting");
        const hasSelfBuy = plan.includes("self-buy") || plan.includes("my own money") || plan.includes("own capital") || plan.includes("self fund") || plan.includes("buy 500") || plan.includes("buy 1000") || plan.includes("buy $");
        const hasAntiRug = plan.includes("renounce") || plan.includes("burn") || plan.includes("audit") || plan.includes("no stealth") || plan.includes("revoked");

        // Logic 1: Standard Degen (Self-buy + Lock) -> Medium Risk
        // If the LLM flagged it as High, but they have the standard degen setup, downgrade to Medium.
        if (newResult.cryptoNativeChecks?.rugPullRisk === 'high' && hasSelfBuy && hasLock) {
          newResult.cryptoNativeChecks.rugPullRisk = 'medium';
          calibrationNotes.push("Rug Risk: downgraded to Medium due to standard degen setup (self-buy + lock). Fragile but not instant rug.");
        }

        // Logic 2: Strong Anti-Rug -> Low Risk
        // If they have explicit anti-rug measures, push towards Low
        if (hasAntiRug && hasLock) {
          // Only upgrade if currently High or Medium
          if (newResult.cryptoNativeChecks?.rugPullRisk && newResult.cryptoNativeChecks.rugPullRisk !== 'low') {
            newResult.cryptoNativeChecks.rugPullRisk = 'low';
            newResult.launchReadinessScore = Math.min(100, newResult.launchReadinessScore! + 5);
            calibrationNotes.push("Rug Risk: upgraded to Low due to strong anti-rug measures (renounced/burned/locked).");
          }
        }
      }
    }

    // DeFi Launch Rules
    if (projectType === 'defi') {
      const hasAudit = launchSignals.includes("audit") || launchSignals.includes("security");
      const hasGTM = launchSignals.includes("user") || launchSignals.includes("acquisition") || launchSignals.includes("market");

      if (!hasAudit) {
        newResult.launchReadinessScore = Math.max(0, newResult.launchReadinessScore! - 15);
        if (newResult.launchReadinessScore < 40) newResult.launchReadinessLabel = 'low';
        calibrationNotes.push("Launch: minus points for no security/audit plan.");
      }

      if (hasAudit && hasGTM) {
        newResult.launchReadinessScore = Math.min(100, newResult.launchReadinessScore! + 10);
        calibrationNotes.push("Launch: plus points for security plan and clear GTM.");
      }
    }

    // AI/Other Launch Rules
    if (projectType === 'ai' || projectType === 'other') {
      const hasMVP = launchSignals.includes("mvp") || launchSignals.includes("prototype") || launchSignals.includes("demo") || (ideaSubmission?.mvpScope && ideaSubmission.mvpScope.length > 10);
      const hasData = launchSignals.includes("data") || launchSignals.includes("dataset") || launchSignals.includes("infra") || (ideaSubmission?.mvpScope && ideaSubmission.mvpScope.toLowerCase().includes("data"));
      const isVague = launchSignals.includes("vague") || launchSignals.includes("unclear");

      if (isVague || (!hasMVP && !hasData)) {
        newResult.launchReadinessScore = Math.max(0, newResult.launchReadinessScore! - 15);
        newResult.launchReadinessLabel = 'low';
        calibrationNotes.push("Launch: minus points for vague MVP/data plan.");
      }

      if (hasMVP && hasData) {
        newResult.launchReadinessScore = Math.min(100, newResult.launchReadinessScore! + 10);
        calibrationNotes.push("Launch: plus points for realistic MVP scope and data plan.");
      }
    }

    // Update Label based on final score
    if (newResult.launchReadinessScore! >= 70) newResult.launchReadinessLabel = 'high';
    else if (newResult.launchReadinessScore! >= 40) newResult.launchReadinessLabel = 'medium';
    else newResult.launchReadinessLabel = 'low';

    // Nudge Overall Score based on Launch Readiness mismatch
    // Strong idea (>=70) but terrible launch (<40) -> Penalty
    if (newResult.overallScore >= 70 && newResult.launchReadinessScore! < 40) {
      newResult.overallScore -= 5;
      calibrationNotes.push("Overall: minus points for severe lack of launch readiness despite good idea.");
    }
    // Modest idea (50-70) but excellent launch (>=80) -> Boost
    if (newResult.overallScore >= 50 && newResult.overallScore < 70 && newResult.launchReadinessScore! >= 80) {
      newResult.overallScore += 5;
      calibrationNotes.push("Overall: plus points for exceptional launch readiness.");
    }
  }

  // === NEW: Deterministic Investor Constraints (Mission 15) ===

  // Constraint 1: Solo Founder Cap
  // "If Team Size = Solo -> cap 'Team & Execution' to <= 50"
  if (ideaSubmission?.teamSize === 'solo') {
    if (newResult.execution.executionRiskScore > 50) {
      newResult.execution.executionRiskScore = 50;
      newResult.execution.executionRiskLabel = 'medium';
      calibrationNotes.push("Constraint: Solo founder execution score capped at 50.");
    }
    // Also cap overall slightly if it was super high?
    if (newResult.overallScore > 85) {
      newResult.overallScore = 85;
      calibrationNotes.push("Constraint: Overall score capped for solo founder.");
    }
  }

  // Constraint 2: Memecoin + Low Budget
  // "If Project Type = Memecoin AND Budget is low -> apply market/launch penalty"
  const hasBudget = ideaSubmission?.resources?.includes('budget');
  if (projectType === 'memecoin' && !hasBudget) {
    // Penalty on Launch Readiness
    if (newResult.launchReadinessScore && newResult.launchReadinessScore > 40) {
      newResult.launchReadinessScore = 40; // Hard cap
      newResult.launchReadinessLabel = 'low';
      calibrationNotes.push("Constraint: Memecoin without budget capped at low launch readiness.");
    }
    // Only apply overall penalty if score is relatively high to avoid double-dipping low scores
    if (newResult.overallScore > 20) {
      newResult.overallScore -= 10;
      calibrationNotes.push("Constraint: Overall score penalty for memecoin with no budget.");
    }
  }

  // Constraint 3: Vague Description
  // "If Description < 100 chars AND Attachments empty"
  const descLen = ideaSubmission?.description?.length || 0;
  const hasAttachments = !!ideaSubmission?.attachments && ideaSubmission.attachments.length > 5;
  const isVague = descLen < 100 && !hasAttachments;

  if (isVague) {
    // Reduced from -15 to -5 (Mission 16)
    // Primary effect is now on confidence/notes, not nuking the score.
    newResult.overallScore -= 5;

    // Force a "Confidence" note in technical comments
    newResult.technical.comments += " [System: Confidence Low due to sparse input]";
    calibrationNotes.push("Constraint: Minor penalty for vague/short description.");
  }

  // Constraint 4: Admin Risk in DeFi (Deterministic Keyword Check)
  if (projectType === 'defi') {
    const risks = (newResult.technical.keyRisks || []).join(" ").toLowerCase();
    const plan = (ideaSubmission?.mvpScope || "" + ideaSubmission?.description || "").toLowerCase();

    if (risks.includes("admin") || risks.includes("centralization")) {
      const hasSafeguards = plan.includes("timelock") || plan.includes("dao") || plan.includes("multisig") || plan.includes("immutable");
      if (!hasSafeguards) {
        newResult.execution.executionRiskScore = Math.min(newResult.execution.executionRiskScore, 40);
        if (newResult.cryptoNativeChecks) newResult.cryptoNativeChecks.rugPullRisk = 'high';
        calibrationNotes.push("Constraint: DeFi with centralization risks and no safeguards flagged as High Risk.");
      }
    }
  }

  // === Mission 16: Hard Fail & Score Floor ===
  // Purpose: Prevent 0 scores unless explicitly "Hard Fail".

  let isHardFail = false;

  // Hard Fail Definition for Memecoins
  if (projectType === 'memecoin') {
    const launchSignals = (newResult.launchReadinessSignals || []).join(" ").toLowerCase();
    // Condition: No Budget AND Vague AND No LP Plan
    // Check if LP plan exists in signals or submission
    const hasLP = launchSignals.includes("liquidity") || launchSignals.includes("lp") || (ideaSubmission?.launchLiquidityPlan && ideaSubmission.launchLiquidityPlan.length > 10);

    if (!hasBudget && isVague && !hasLP) {
      isHardFail = true;
      calibrationNotes.push("CRITICAL: Hard Fail triggered (No Budget + Vague + No LP Plan). Score collapsed to 0.");
    }
  }

  // Final Floor Clamp
  if (isHardFail) {
    newResult.overallScore = 0;
  } else {
    // Non-hardfail floor is 5
    newResult.overallScore = Math.max(5, newResult.overallScore);
  }

  // Ensure we never exceed 100
  newResult.overallScore = Math.min(100, newResult.overallScore);

  newResult.calibrationNotes = calibrationNotes;


  // Mission 14B: Show Crypto-Native Health only when it makes sense
  const isCryptoProject = projectType === 'memecoin' || projectType === 'defi';
  const hasToken = newResult.tokenomics.tokenNeeded;
  // If user explicitly talks about LP or launch in the plan
  // Refined: Ensure it's not a "no token" statement
  const rawPlan = (ideaSubmission?.launchLiquidityPlan || "").toLowerCase();
  const hasLiquidityPlan = rawPlan.length > 5 &&
    !rawPlan.includes("no token") &&
    !rawPlan.includes("self-funded") &&
    !rawPlan.includes("none") &&
    !rawPlan.includes("n/a");

  // If none of these are true, remove the crypto block
  if (!isCryptoProject && !hasToken && !hasLiquidityPlan) {
    delete newResult.cryptoNativeChecks;
  } else if (newResult.cryptoNativeChecks) {
    // Mission 15: Enhance Liquidity Grading
    if (ideaSubmission?.launchLiquidityPlan) {
      const lpPlan = ideaSubmission.launchLiquidityPlan.toLowerCase();

      // Extract Duration
      let durationDetail = "Unclear duration";
      if (lpPlan.includes("1 year") || lpPlan.includes("12 months") || lpPlan.includes("365 days")) durationDetail = "Locked for 1 year";
      else if (lpPlan.includes("6 months") || lpPlan.includes("180 days")) durationDetail = "Locked for 6 months";
      else if (lpPlan.includes("3 months") || lpPlan.includes("90 days")) durationDetail = "Locked for 3 months";
      else if (lpPlan.includes("1 month") || lpPlan.includes("30 days")) durationDetail = "Locked for 30 days";
      else if (lpPlan.includes("burn") || lpPlan.includes("burnt")) durationDetail = "Liquidity Burned";
      else if (lpPlan.includes("lock") || lpPlan.includes("vesting")) durationDetail = "Locked (Unknown duration)";

      newResult.cryptoNativeChecks.liquidityDetail = durationDetail;

      // Grade Liquidity
      if (lpPlan.includes("burn") || lpPlan.includes("1 year") || lpPlan.includes("12 months")) {
        newResult.cryptoNativeChecks.liquidityGrade = 'strong';
      } else if (lpPlan.includes("6 months") || lpPlan.includes("180 days")) {
        newResult.cryptoNativeChecks.liquidityGrade = 'medium';
      } else if (lpPlan.includes("1 month") || lpPlan.includes("30 days") || lpPlan.includes("short")) {
        newResult.cryptoNativeChecks.liquidityGrade = 'weak';
        calibrationNotes.push("Liquidity: Short lock period (30d) is considered weak signal.");
      } else {
        // Default if locked but unknown
        if (newResult.cryptoNativeChecks.liquidityStatus === 'locked') {
          newResult.cryptoNativeChecks.liquidityGrade = 'medium';
        } else {
          newResult.cryptoNativeChecks.liquidityGrade = 'weak';
        }
      }
    }
  }

  // Populate new fields
  newResult.projectType = projectType;

  // Set Confidence Level based on Vague logic (re-evaluated or carried over)
  // We can check if we added the "Confidence Low" note or the specific constraint note
  const isConfidenceLow = newResult.technical.comments.includes("Confidence Low") ||
    calibrationNotes.some(n => n.includes("vague/short description"));
  newResult.confidenceLevel = isConfidenceLow ? 'low' : 'high';

  return newResult;
}
