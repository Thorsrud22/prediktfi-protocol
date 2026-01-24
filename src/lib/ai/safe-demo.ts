import { IdeaEvaluationResult } from "@/lib/ideaEvaluationTypes";

export const SAFE_DEMO_RESULT: IdeaEvaluationResult = {
    overallScore: 85,
    reasoningSteps: [
        "[MARKET] Analyzing current memecoin cycle velocity...",
        "[SECURITY] Checking contract patterns for known rugs...",
        "[INTEL] Comparing viral potential against benchmarks...",
        "[EXEC] Establishing team readiness probability...",
        "[VERDICT] Synthesizing investment thesis..."
    ],
    summary: {
        title: "Safe Demo Mode (Quota Exceeded)",
        oneLiner: "This is a simulated result because the AI limit was reached.",
        mainVerdict: "Demo Mode Active - This is not a real evaluation."
    },
    technical: {
        feasibilityScore: 88,
        keyRisks: ["Demo Data Only", "Not Real Analysis"],
        requiredComponents: ["OpenAI Credits", "API Key"],
        comments: "The system fell back to this safe demo state because the API returned a 429 (Quota Exceeded) error. In a production environment, this would be a real technical analysis."
    },
    tokenomics: {
        tokenNeeded: true,
        designScore: 75,
        mainIssues: ["Simulated Tokenomics"],
        suggestions: ["Refill API Credits", "Check Billing"]
    },
    market: {
        marketFitScore: 82,
        targetAudience: ["Demo Users", "Developers"],
        competitorSignals: ["Real Competitors Hidden"],
        goToMarketRisks: ["Simulation Mode"]
    },
    execution: {
        complexityLevel: "medium",
        founderReadinessFlags: ["Demo Ready"],
        estimatedTimeline: "Immediate",
        executionRiskScore: 20,
        executionRiskLabel: "low",
        executionSignals: ["System working safely"]
    },
    recommendations: {
        mustFixBeforeBuild: ["Upgrade OpenAI Plan"],
        recommendedPivots: [],
        niceToHaveLater: ["Higher Rate Limits"]
    },
    cryptoNativeChecks: {
        rugPullRisk: "low",
        auditStatus: "none",
        liquidityStatus: "unclear",
        isAnonTeam: true
    },
    launchReadinessScore: 90,
    launchReadinessLabel: "high",
    launchReadinessSignals: ["Demo Mode Active"]
};
