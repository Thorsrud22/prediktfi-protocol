
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

        // Overall score penalty Reduced (-15 -> -5)
        // 90 -> 85
        expect(result.overallScore).toBe(85);
        expect(result.technical.comments).toContain("Confidence Low");
        expect(result.calibrationNotes).toContain("Constraint: Minor penalty for vague/short description.");
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

    it('prevents 0 score for weak but not hard-fail inputs (Floor Check)', () => {
        const weakResult: IdeaEvaluationResult = {
            ...mockBaseResult,
            overallScore: 30, // Initially weak
            launchReadinessScore: 30, // Initially weak
            launchReadinessSignals: [],
            execution: { ...mockBaseResult.execution, executionRiskScore: 30 },
        };

        // NOT a hard fail because we will preserve LP plan or something to avoid the trigger
        const weakSubmission: IdeaSubmission = {
            ...mockBaseSubmission,
            projectType: 'memecoin',
            teamSize: 'solo',
            resources: ['time'], // No budget
            description: "To the moon", // Vague
            attachments: "",
            launchLiquidityPlan: "Locked LP for 12 months" // Has LP plan -> Avoids Hard Fail
        };

        const result = calibrateScore({
            rawResult: weakResult,
            projectType: 'memecoin',
            ideaSubmission: weakSubmission
        });

        // 30 - 5 (launch mismatch - wait, launch 30, overall 30. No mismatch penalty as overall < 70)
        // - 10 (no budget) = 20
        // - 5 (vague) = 15
        // Result should be 15.
        // It should AT LEAST be > 5 (Floor).
        console.log("Weak Result Score:", result.overallScore);

        expect(result.overallScore).toBeGreaterThanOrEqual(15);
        expect(result.overallScore).not.toBe(0);
    });

    it('triggers 0 score for explicit Hard Fail', () => {
        const failResult: IdeaEvaluationResult = {
            ...mockBaseResult,
            overallScore: 30,
            launchReadinessScore: 30,
            launchReadinessSignals: [],
        };

        const failSubmission: IdeaSubmission = {
            ...mockBaseSubmission,
            projectType: 'memecoin',
            teamSize: 'solo',
            resources: ['time'], // No budget
            description: "Some vague scam", // Vague (isVague=true)
            attachments: "",
            launchLiquidityPlan: "" // No LP (hasLP=false) -> Hard Fail
        };

        const result = calibrateScore({
            rawResult: failResult,
            projectType: 'memecoin',
            ideaSubmission: failSubmission
        });

        expect(result.overallScore).toBe(0);
        expect(result.calibrationNotes).toContain("CRITICAL: Hard Fail triggered (No Budget + Vague + No LP Plan). Score collapsed to 0.");
    });

});
