import { IdeaSubmission } from "@/lib/ideaSchema";
import { IdeaEvaluationResult, ideaEvaluationResultSchema } from "@/lib/ideaEvaluationTypes";

/**
 * Evaluates an idea using an AI model (mocked for now).
 * 
 * @param input The idea submission data.
 * @returns A promise that resolves to the evaluation result.
 */
export async function evaluateIdea(input: IdeaSubmission): Promise<IdeaEvaluationResult> {
    // TODO: Replace with actual AI client call (Gemini/GPT)
    // Construct prompt here...

    console.log("Evaluating idea:", input.description);

    // Mock delay to simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Deterministic mock response based on input length or content to vary results slightly if needed
    // For now, returning a static high-quality mock result.

    const mockResult: IdeaEvaluationResult = {
        overallVerdict: "This project shows strong potential in the current market, particularly if it leverages the suggested narrative pivots. Execution will be key.",
        successProbability: 75,
        confidence: 85,
        dimensionScores: [
            { id: "market", label: "Market & Timing", score: 80, comment: "Good timing with the current cycle." },
            { id: "narrative", label: "Narrative & Meme", score: 70, comment: "Needs a punchier hook." },
            { id: "distribution", label: "Distribution", score: 60, comment: "Plan is vague on user acquisition." },
            { id: "team", label: "Team & Execution", score: 85, comment: "Strong technical background inferred." },
            { id: "tokenomics", label: "Tokenomics", score: 65, comment: "Standard model, nothing innovative." },
            { id: "risk", label: "Risk & Regulation", score: 90, comment: "Low regulatory risk detected." }
        ],
        redFlags: [
            "Competition is heating up in this sector.",
            "Initial liquidity plan is unclear."
        ],
        recommendedPivots: [
            "Focus more on the mobile-first experience.",
            "Consider a 'fair launch' mechanism to build community trust."
        ],
        nextSteps: [
            "Draft a whitepaper focusing on the unique value prop.",
            "Build a waitlist landing page.",
            "Engage with key opinion leaders (KOLs) in the niche."
        ],
        riskSummary: "Moderate risk. Main challenges are user adoption and competitive pressure. Technical risk appears low."
    };

    // Validate the mock result to ensure it matches the schema (good practice for the real one too)
    return ideaEvaluationResultSchema.parse(mockResult);
}
