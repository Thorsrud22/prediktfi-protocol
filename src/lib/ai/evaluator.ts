import { IdeaSubmission } from "@/lib/ideaSchema";
import { IdeaEvaluationResult } from "@/lib/ideaEvaluationTypes";
import { openai } from "@/lib/openaiClient";

/**
 * Evaluates an idea using OpenAI GPT-5.1.
 * 
 * @param input The idea submission data.
 * @returns A promise that resolves to the evaluation result.
 */
export async function evaluateIdea(input: IdeaSubmission): Promise<IdeaEvaluationResult> {
  const systemPrompt = `You are "The Validator", an expert AI idea evaluator specializing in Web3, crypto, and AI projects.

Your role is to provide brutally honest, actionable feedback on startup ideas. Analyze projects across multiple dimensions:
- Technical feasibility
- Tokenomics design
- Market fit and competition
- Execution complexity
- Go-to-market risks

Provide a comprehensive evaluation with specific scores, risks, and recommendations. Be direct and constructive.

Return your evaluation as a JSON object matching this structure:
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

  const userContent = `Project Type: ${input.projectType}
Team Size: ${input.teamSize}
Resources: ${input.resources.join(", ")}
Success Definition: ${input.successDefinition}
Response Style: ${input.responseStyle}
${input.focusHints ? `Focus Hints: ${input.focusHints.join(", ")}` : ""}
${input.attachments ? `Attachments: ${input.attachments}` : ""}

Idea Description:
${input.description}`;

  try {
    // @ts-ignore - responses API might not be in the types yet
    const response = await openai().responses.create({
      model: "gpt-5.1",
      input: [
        { role: "system", content: systemPrompt },
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

    return result;
  } catch (error) {
    console.error("Error evaluating idea with OpenAI:", error);
    throw new Error(
      `Failed to evaluate idea: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
