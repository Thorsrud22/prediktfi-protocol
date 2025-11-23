import { IdeaSubmission } from "@/lib/ideaSchema";
import { IdeaEvaluationResult } from "@/lib/ideaEvaluationTypes";
import { openai } from "@/lib/openaiClient";

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

const VALIDATOR_SYSTEM_PROMPT = `You are The Validator, a strict evaluator for Web3, crypto and AI project ideas.

Your job is not to motivate the founder. Your job is to stress-test the idea and highlight risks, gaps and unrealistic assumptions.

Always evaluate along these axes:
- Technical feasibility
- Tokenomics (and whether a token is needed at all)
- Market and real users
- Execution difficulty
- Clear recommendations (must-fix before build and possible pivots)

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
    `Success Goal (6-12m): ${idea.successDefinition}`,
    `Response Style: ${idea.responseStyle}`
  ];

  if (idea.focusHints && idea.focusHints.length > 0) {
    parts.push(`Focus Hints: ${idea.focusHints.join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Evaluates an idea using OpenAI GPT-5.1.
 * 
 * @param input The idea submission data.
 * @returns A promise that resolves to the evaluation result.
 */
export async function evaluateIdea(input: IdeaSubmission): Promise<IdeaEvaluationResult> {
  const contextSummary = buildIdeaContextSummary(input);

  const userContent = `Idea Context:
${contextSummary}

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
    "estimatedTimeline": "<timeline>"
  },
  "recommendations": {
    "mustFixBeforeBuild": ["<item1>", "<item2>"],
    "recommendedPivots": ["<pivot1>", "<pivot2>"],
    "niceToHaveLater": ["<item1>", "<item2>"]
  }
}`;

  try {
    // @ts-ignore - responses API might not be in the types yet
    const response = await openai().responses.create({
      model: "gpt-5.1",
      input: [
        { role: "system", content: VALIDATOR_SYSTEM_PROMPT },
        { role: "user", content: userContent }
      ],
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

    // If the API returns an object directly (as some "Responses" APIs do), we might not need parsing
    // But the user said "Parse the JSON", implying it returns a string.

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
    result = calibrateScore(result);

    return result;
  } catch (error) {
    console.error("Error evaluating idea with OpenAI:", error);
    throw new Error(
      `Failed to evaluate idea: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Adjusts the overall score based on specific rules to handle edge cases
 * like meme coins (cap score) or strong infra ideas (boost score).
 * 
 * @param result The raw evaluation result from the model
 * @returns The adjusted evaluation result
 */
export function calibrateScore(result: IdeaEvaluationResult): IdeaEvaluationResult {
  const newResult = { ...result };

  // Rule 1: Cap hype / meme ideas
  // If it looks like a meme coin or pure hype, cap the score at 40.
  const lowerSummary = (newResult.summary.oneLiner + " " + newResult.summary.mainVerdict).toLowerCase();
  const isMemeOrHype =
    lowerSummary.includes("meme") ||
    lowerSummary.includes("memecoin") ||
    lowerSummary.includes("pure hype") ||
    lowerSummary.includes("no real utility") ||
    lowerSummary.includes("speculative");

  if (isMemeOrHype) {
    // Cap at 40
    if (newResult.overallScore > 40) {
      newResult.overallScore = 40;
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
    }
    // Cap at 90 (don't let it get too crazy just because it's solid infra)
    if (newResult.overallScore > 90) {
      newResult.overallScore = 90;
    }
  }

  return newResult;
}
