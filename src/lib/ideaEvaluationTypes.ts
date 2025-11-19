export interface IdeaEvaluationResult {
    evaluationId: string;
    overallVerdict: string;
    successProbability: number; // 0 to 100
    pros: string[];
    cons: string[];
    improvements: string[];
    riskAnalysis: string[];
    confidenceScore: number; // 0 to 1
}
