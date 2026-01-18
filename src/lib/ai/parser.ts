/**
 * Response Parser Module
 *
 * Handles parsing of OpenAI API responses into typed evaluation results.
 * Extracted from evaluator.ts for better maintainability.
 */

import { IdeaEvaluationResult } from "@/lib/ideaEvaluationTypes";

/**
 * Parses the OpenAI API response into an IdeaEvaluationResult.
 * Handles various response formats from different API versions.
 *
 * @param response The raw response from OpenAI API
 * @returns Parsed IdeaEvaluationResult
 * @throws Error if response cannot be parsed or is invalid
 */
export function parseEvaluationResponse(response: unknown): IdeaEvaluationResult {
    let responseContent: string | object | undefined;
    const anyResponse = response as Record<string, unknown>;

    // Try to extract content from various response formats
    if (anyResponse.output_text) {
        responseContent = anyResponse.output_text as string;
    } else if (anyResponse.output) {
        responseContent = anyResponse.output as string | object;
    } else if (
        anyResponse.choices &&
        Array.isArray(anyResponse.choices) &&
        anyResponse.choices[0]?.message?.content
    ) {
        responseContent = anyResponse.choices[0].message.content as string;
    } else {
        // Fallback: stringify the response
        responseContent = JSON.stringify(response);
    }

    // Parse content into result object
    let result: IdeaEvaluationResult;

    if (typeof responseContent === 'string') {
        try {
            result = JSON.parse(responseContent) as IdeaEvaluationResult;
        } catch (e) {
            // If string parsing fails, try using the response object directly
            if (typeof response === 'object' && response !== null) {
                result = response as unknown as IdeaEvaluationResult;
            } else {
                throw new Error(`Failed to parse evaluation response: ${e}`);
            }
        }
    } else if (typeof responseContent === 'object' && responseContent !== null) {
        result = responseContent as IdeaEvaluationResult;
    } else {
        // Last resort: treat the entire response as the result
        result = response as unknown as IdeaEvaluationResult;
    }

    // Validate required fields
    validateEvaluationResult(result);

    return result;
}

/**
 * Validates that an evaluation result has all required fields.
 *
 * @param result The result to validate
 * @throws Error if required fields are missing
 */
export function validateEvaluationResult(result: IdeaEvaluationResult): void {
    if (result.overallScore === undefined || result.overallScore === null) {
        throw new Error("Invalid response structure: missing overallScore");
    }

    if (!result.summary) {
        throw new Error("Invalid response structure: missing summary");
    }

    if (!result.technical) {
        throw new Error("Invalid response structure: missing technical");
    }

    // Ensure arrays exist with defaults
    result.technical.keyRisks = result.technical.keyRisks || [];
    result.technical.requiredComponents = result.technical.requiredComponents || [];
    result.market = result.market || {
        marketFitScore: 50,
        targetAudience: [],
        competitorSignals: [],
        goToMarketRisks: []
    };
    result.execution = result.execution || {
        complexityLevel: 'medium',
        founderReadinessFlags: [],
        estimatedTimeline: 'Unknown',
        executionRiskScore: 50,
        executionRiskLabel: 'medium',
        executionSignals: []
    };
    result.recommendations = result.recommendations || {
        mustFixBeforeBuild: [],
        recommendedPivots: [],
        niceToHaveLater: []
    };
    result.reasoningSteps = result.reasoningSteps || [];
}
