import { IdeaSubmission } from "@/lib/ideaSchema";
import { CompetitiveMemo } from "./competitiveTypes";

/**
 * Fetches a competitive intelligence memo for a given idea.
 * 
 * NOTE: This is currently a stub implementation returning dummy data.
 * Future versions will query external sources.
 * 
 * @param idea The idea submission to analyze
 * @returns A promise resolving to a CompetitiveMemo
 */
export async function fetchCompetitiveMemo(idea: IdeaSubmission): Promise<CompetitiveMemo> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return dummy data for now
    return {
        landscape: {
            crowdedness: 'moderate',
            dominantNarrative: "The sector is growing but fragmentation is high.",
            majors: ["Protocol A", "Protocol B"]
        },
        competitors: [
            {
                name: "Competitor One",
                status: 'live',
                differentiationGap: 'medium',
                notes: "Similar mechanism but on a different chain."
            },
            {
                name: "Ghost Chain Project",
                status: 'abandoned',
                differentiationGap: 'high',
                notes: "Tried this in 2021 but failed due to complexity."
            }
        ],
        strategicAdvice: {
            differentiationOpps: [
                "Focus on mobile-first experience",
                "Simplify the onboarding flow"
            ],
            featuresToAvoid: [
                "Complex governance from day 1"
            ]
        },
        timestamp: new Date().toISOString()
    };
}
