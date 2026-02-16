/**
 * Response Parser Module
 *
 * Handles parsing of OpenAI API responses into typed evaluation results.
 * Extracted from evaluator.ts for better maintainability.
 */

import { IdeaEvaluationResult } from "@/lib/ideaEvaluationTypes";
import { extractStructuredOutput } from "@/lib/ai/structured-output";

function resolveStructuredAnalysisText(
    result: IdeaEvaluationResult,
    responseContent: string | object | undefined
): string {
    if (typeof result.structuredAnalysis === "string" && result.structuredAnalysis.trim()) {
        return result.structuredAnalysis;
    }

    if (typeof responseContent === "string" && responseContent.includes("## ")) {
        return responseContent;
    }

    if (typeof result.technical?.comments === "string" && result.technical.comments.includes("## ")) {
        return result.technical.comments;
    }

    return "";
}

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

    // --- NEW PATH: Derive from structuredAnalysisData object (reliable JSON) ---
    const sad = (result as any).structuredAnalysisData;
    if (sad && typeof sad === 'object' && sad.overall) {
        // Reconstruct markdown for frontend display
        const lines: string[] = [];
        if (sad.evidence?.items?.length) {
            lines.push('## EVIDENCE');
            for (const item of sad.evidence.items) lines.push(`- ${item}`);
            lines.push('');
        }
        const dims = [
            { key: 'marketOpportunity', label: 'MARKET OPPORTUNITY' },
            { key: 'technicalFeasibility', label: 'TECHNICAL FEASIBILITY' },
            { key: 'competitiveMoat', label: 'COMPETITIVE MOAT' },
            { key: 'executionReadiness', label: 'EXECUTION READINESS' },
        ] as const;
        const subScores: Record<string, any> = {};
        for (const dim of dims) {
            const d = sad[dim.key];
            if (!d) continue;
            lines.push(`## ${dim.label}`);
            if (d.evidence?.length) {
                for (const e of d.evidence) lines.push(`- Evidence: ${e}`);
            }
            if (d.reasoning) lines.push(`- Reasoning: ${d.reasoning}`);
            if (d.uncertainty) lines.push(`- Uncertainty: ${d.uncertainty}`);
            if (typeof d.score === 'number') lines.push(`- Sub-score: ${d.score}/10`);
            lines.push('');

            // Populate subScores directly
            const camelKey = dim.key;
            subScores[camelKey] = {
                score: typeof d.score === 'number' ? d.score : 0,
                evidence: Array.isArray(d.evidence) ? d.evidence : [],
                reasoning: d.reasoning || '',
                uncertainty: d.uncertainty || '',
            };
        }
        if (sad.overall) {
            lines.push('## OVERALL');
            if (sad.overall.composition) lines.push(`- Composition: ${sad.overall.composition}`);
            if (typeof sad.overall.finalScore === 'number') lines.push(`- Final score: ${sad.overall.finalScore}/10`);
            if (sad.overall.confidence) lines.push(`- Confidence: ${sad.overall.confidence}`);
            if (sad.overall.topRisk) lines.push(`- Top risk to thesis: ${sad.overall.topRisk}`);
        }

        result.structuredAnalysis = lines.join('\n');
        result.structuredAnalysisData = sad;
        if (Object.keys(subScores).length > 0) {
            result.subScores = subScores;
        }
        if (sad.overall?.composition) result.compositionFormula = sad.overall.composition;
        if (sad.overall?.confidence) result.modelConfidenceLevel = sad.overall.confidence;
        result.meta = result.meta || {};
        result.meta.structuredOutputParsed = true;
        result.meta.structuredOutputWarnings = [];

        return result;
    }

    // --- LEGACY PATH: Parse from markdown string (fallback) ---
    const structuredText = resolveStructuredAnalysisText(result, responseContent);
    const structured = extractStructuredOutput(structuredText);
    result.meta = result.meta || {};
    result.meta.structuredOutputParsed = structured.parsed;
    result.meta.structuredOutputWarnings = structured.warnings;

    if (structured.parsed) {
        if (Object.keys(structured.subScores).length > 0) {
            result.subScores = structured.subScores;
        }
        if (structured.compositionFormula) {
            result.compositionFormula = structured.compositionFormula;
        }
        if (structured.confidenceLevel) {
            result.modelConfidenceLevel = structured.confidenceLevel;
        }
        if (structured.groundingCitations.length > 0) {
            result.groundingCitations = structured.groundingCitations;
        }
    }

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

export interface ExtractedClaim {
    text: string;
    section: string;
    type: 'numerical' | 'comparative' | 'existence';
    value?: number;
    unit?: string;
    checkable: boolean;
}

const NUMERICAL_PATTERNS: RegExp[] = [
    /\$\s*([\d,.]+)\s*(billion|million|trillion|B|M|T)\b/gi,
    /([\d,.]+)\s*%/g,
    /([\d,.]+)\s*(users|wallets|transactions|tvl|holders|protocols)/gi,
    /(?:ranked?\s*#?\s*|top\s+)([\d]+)/gi,
];

function splitSentences(text: string): string[] {
    const matches = text.match(/[^.!?]+[.!?]+/g);
    if (matches && matches.length > 0) return matches;
    return [text];
}

export function extractNumericalClaims(
    sections: Record<string, string>
): ExtractedClaim[] {
    const claims: ExtractedClaim[] = [];

    for (const [sectionName, text] of Object.entries(sections)) {
        if (typeof text !== 'string' || !text.trim()) continue;
        const sentences = splitSentences(text);

        for (const sentence of sentences) {
            let matched = false;
            for (const pattern of NUMERICAL_PATTERNS) {
                pattern.lastIndex = 0;
                const match = pattern.exec(sentence);
                if (!match) continue;

                const rawValue = match[1];
                const parsedValue = typeof rawValue === 'string'
                    ? Number.parseFloat(rawValue.replace(/,/g, ''))
                    : Number.NaN;
                if (Number.isNaN(parsedValue)) continue;

                claims.push({
                    text: sentence.trim(),
                    section: sectionName,
                    type: 'numerical',
                    value: parsedValue,
                    unit: match[2] ?? '%',
                    checkable: true,
                });
                matched = true;
                break;
            }

            if (matched) continue;
        }
    }

    return claims;
}
