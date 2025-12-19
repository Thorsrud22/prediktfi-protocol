
import { describe, it, expect } from 'vitest';
import { calibrateScore, ScoreCalibrationContext } from '../../src/lib/ai/evaluator';
import { IdeaEvaluationResult } from '../../src/lib/ideaEvaluationTypes';
import { IdeaSubmission } from '../../src/lib/ideaSchema';

// Mocks
const mockBaseResult: IdeaEvaluationResult = {
    overallScore: 90,
    summary: { title: "Test", oneLiner: "Test", mainVerdict: "Buy" },
    technical: { feasibilityScore: 90, keyRisks: [], requiredComponents: [], comments: "" },
    tokenomics: { tokenNeeded: true, designScore: 90, mainIssues: [], suggestions: [] },
    market: { marketFitScore: 90, targetAudience: [], competitorSignals: [], goToMarketRisks: [] },
    execution: {
        complexityLevel: "low",
        founderReadinessFlags: [],
        estimatedTimeline: "1m",
        executionRiskScore: 90, // Defines 90 = Good/Safe 
        executionRiskLabel: "low",
        executionSignals: []
    },
    recommendations: { mustFixBeforeBuild: [], recommendedPivots: [], niceToHaveLater: [] },
    cryptoNativeChecks: { rugPullRisk: "low", auditStatus: "not_applicable", liquidityStatus: "not_applicable", isAnonTeam: false },
    launchReadinessScore: 90,
    launchReadinessLabel: "high",
    launchReadinessSignals: []
};

const mockBaseSubmission: IdeaSubmission = {
    description: "A very detailed description meant to pass length checks. This description contains way more than 100 characters to ensure it does not trigger the vague description penalty. We are building a serious project here.",
    projectType: 'defi',
    teamSize: 'team_2_5',
    resources: ['budget', 'skills'],
    successDefinition: "World domination",
    responseStyle: 'full',
    mvpScope: "Complete platform",
    goToMarketPlan: "Twitter ads",
    launchLiquidityPlan: "Locked LP"
};

describe('Evaluator Constraints', () => {

    it('Constraint 1: Solo Founder Cap', () => {
        const context: ScoreCalibrationContext = {
            rawResult: { ...mockBaseResult },
            projectType: 'defi',
            ideaSubmission: { ...mockBaseSubmission, teamSize: 'solo' }
        };

        const result = calibrateScore(context);

        // Should cap execution risk score at 50 (downgrade from 90)
        expect(result.execution.executionRiskScore).toBeLessThanOrEqual(50);
        // Should append note
        expect(result.calibrationNotes).toContain("Constraint: Solo founder execution score capped at 50.");
    });

    it('Constraint 2: Memecoin + Low Budget', () => {
        const context: ScoreCalibrationContext = {
            rawResult: { ...mockBaseResult },
            projectType: 'memecoin',
            ideaSubmission: {
                ...mockBaseSubmission,
                projectType: 'memecoin',
                resources: ['time'] // No budget
            }
        };

        const result = calibrateScore(context);

        // Should cap launch readiness (downgrade from 90 -> 40)
        expect(result.launchReadinessScore).toBeLessThanOrEqual(40);
        expect(result.launchReadinessLabel).toBe('low');
        // Overall score penalty (-10 from 90 -> 80)
        expect(result.overallScore).toBeLessThan(90);
        expect(result.calibrationNotes).toContain("Constraint: Memecoin without budget capped at low launch readiness.");
    });

    it('Constraint 3: Vague Description', () => {
        const context: ScoreCalibrationContext = {
            rawResult: { ...mockBaseResult },
            projectType: 'other',
            ideaSubmission: {
                ...mockBaseSubmission,
                description: "Too short.", // < 100 chars
                attachments: ""
            }
        };

        const result = calibrateScore(context);

        // Overall score penalty (-15 from 90 -> 75)
        expect(result.overallScore).toBeLessThanOrEqual(75);
        expect(result.technical.comments).toContain("Confidence Low");
        expect(result.calibrationNotes).toContain("Constraint: Heavy penalty for vague/short description.");
    });

    it('Constraint 4: DeFi Admin Risk', () => {
        const resultWithRisk = {
            ...mockBaseResult,
            technical: { ...mockBaseResult.technical, keyRisks: ["centralization risk", "admin keys"] }
        };

        const context: ScoreCalibrationContext = {
            rawResult: resultWithRisk,
            projectType: 'defi',
            ideaSubmission: {
                ...mockBaseSubmission,
                projectType: 'defi',
                mvpScope: "Just generic contracts", // No safeguards mentioned
                description: "Generic desc",
            }
        };

        const result = calibrateScore(context);

        // Should penalize execution/rug score
        expect(result.execution.executionRiskScore).toBeLessThanOrEqual(40);
        expect(result.cryptoNativeChecks?.rugPullRisk).toBe('high');
        expect(result.calibrationNotes).toContain("Constraint: DeFi with centralization risks and no safeguards flagged as High Risk.");
    });

});
