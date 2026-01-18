/**
 * Score Calibration Module
 *
 * Contains post-processing rules that adjust LLM evaluation scores
 * based on project type, market conditions, and input quality.
 *
 * Extracted from evaluator.ts for better maintainability and testability.
 */

import { IdeaEvaluationResult } from "@/lib/ideaEvaluationTypes";
import { IdeaSubmission } from "@/lib/ideaSchema";
import { MarketSnapshot } from "@/lib/market/types";

export interface ScoreCalibrationContext {
    rawResult: IdeaEvaluationResult;
    projectType: string;
    market?: MarketSnapshot;
    ideaSubmission?: IdeaSubmission;
}

/**
 * Adjusts the overall score based on specific rules to handle edge cases
 * like meme coins (cap score) or strong infra ideas (boost score).
 *
 * @param context The calibration context containing raw result, project type, and market data
 * @returns The adjusted evaluation result
 */
export function calibrateScore(context: ScoreCalibrationContext): IdeaEvaluationResult {
    const { rawResult, projectType, ideaSubmission } = context;
    const newResult = JSON.parse(JSON.stringify(rawResult)) as IdeaEvaluationResult;
    const calibrationNotes: string[] = newResult.calibrationNotes || [];

    // Rule 1: Cap hype / meme ideas
    const lowerSummary = (newResult.summary.oneLiner + " " + newResult.summary.mainVerdict).toLowerCase();
    const isMemeOrHype =
        projectType === 'memecoin' ||
        lowerSummary.includes("meme") ||
        lowerSummary.includes("memecoin") ||
        lowerSummary.includes("pure hype") ||
        lowerSummary.includes("no real utility") ||
        lowerSummary.includes("speculative");

    if (isMemeOrHype) {
        let score = newResult.overallScore;

        // Penalty 1: IP / Legal Risk
        const riskText = [
            ...(newResult.technical.keyRisks || []),
            ...(newResult.market.goToMarketRisks || [])
        ].join(" ").toLowerCase();

        const hasLegalRisk =
            riskText.includes("legal") ||
            riskText.includes("copyright") ||
            riskText.includes("ip infringement") ||
            riskText.includes("trademark") ||
            riskText.includes("scam");

        if (hasLegalRisk) {
            score -= 20;
            calibrationNotes.push("Memecoin: minus points for heavy dependence on one celebrity/brand without a twist.");
        }

        // Penalty 2: Weak Narrative
        if (newResult.market.marketFitScore < 50) {
            score -= 10;
            calibrationNotes.push("Memecoin: minus points for weak or generic meme narrative.");
        }

        newResult.overallScore = Math.max(10, Math.min(90, score));

        // Market-Aware Calibration (Memecoin)
        if (context.market && context.market.source !== 'fallback') {
            const { solPriceUsd } = context.market;
            if (solPriceUsd > 150) {
                newResult.overallScore += 2;
                calibrationNotes.push("Market: + points for launching during strong Solana price action (> $150).");
            }
        }
    }

    // Rule 1.5: DeFi Calibration
    if (projectType === 'defi') {
        let score = newResult.overallScore;
        const riskText = [
            ...(newResult.technical.keyRisks || []),
            ...(newResult.technical.comments ? [newResult.technical.comments] : []),
            ...(newResult.market.goToMarketRisks || [])
        ].join(" ").toLowerCase();

        const hasSecurityKeywords =
            riskText.includes("audit") ||
            riskText.includes("security") ||
            riskText.includes("regulation") ||
            riskText.includes("compliance");

        const isComplex = newResult.execution.complexityLevel === 'high';
        const isSimpleOrMedium = newResult.execution.complexityLevel === 'low' || newResult.execution.complexityLevel === 'medium';
        const hasSpecificAudience = newResult.market.targetAudience && newResult.market.targetAudience.length > 0 && newResult.market.targetAudience[0].length > 3;

        if ((isComplex && !hasSecurityKeywords) || (newResult.tokenomics.tokenNeeded && !hasSpecificAudience)) {
            score -= 5;
            calibrationNotes.push("DeFi: minus points for high complexity and no audit/security plan mentioned.");
        }

        if (isSimpleOrMedium && hasSecurityKeywords && hasSpecificAudience) {
            score += 5;
            calibrationNotes.push("DeFi: plus points for explicit audit/security thinking and a concrete target user.");
        }

        newResult.overallScore = Math.max(10, Math.min(95, score));

        // Market-Aware Calibration (DeFi)
        if (context.market && context.market.source !== 'fallback') {
            const { btcDominance } = context.market;
            if (btcDominance > 60 && isComplex) {
                newResult.overallScore -= 2;
                calibrationNotes.push("DeFi: minus points for high complexity during risk-off market conditions.");
            }
            if (btcDominance < 40 && hasSecurityKeywords) {
                newResult.overallScore += 3;
                calibrationNotes.push("DeFi: plus points for launching during favorable risk-on market conditions.");
            }
        }
    }

    // Rule 2: Don't under-score strong infra ideas
    const isStrongTech = newResult.technical.feasibilityScore >= 75;
    const isStrongMarket = newResult.market.marketFitScore >= 75;
    const noTokenNeeded = newResult.tokenomics.tokenNeeded === false;

    if (isStrongTech && isStrongMarket && noTokenNeeded) {
        if (newResult.overallScore < 60) {
            newResult.overallScore = 60;
            calibrationNotes.push("AI: plus points for a clear pain point and realistic data/infra story.");
        }
        if (newResult.overallScore > 90) {
            newResult.overallScore = 90;
            calibrationNotes.push("AI: capped at 90 to maintain realism.");
        }
    }

    // Rule 3: Execution & Team Risk Calibration
    const executionSignals = (newResult.execution.executionSignals || []).join(" ").toLowerCase();
    const readinessFlags = (newResult.execution.founderReadinessFlags || []).join(" ").toLowerCase();
    const combinedExecutionText = executionSignals + " " + readinessFlags;

    // Memecoin Execution Rules
    if (projectType === 'memecoin') {
        const isAnon = combinedExecutionText.includes("anon") || combinedExecutionText.includes("anonymous");
        const hasTrackRecord = combinedExecutionText.includes("shipped") || combinedExecutionText.includes("track record") || combinedExecutionText.includes("previous exit");

        if (isAnon && !hasTrackRecord) {
            newResult.execution.executionRiskScore = Math.max(0, newResult.execution.executionRiskScore - 10);
            newResult.execution.executionRiskLabel = 'high';
            calibrationNotes.push("Execution: minus points for anon team with no prior shipped products.");
        }

        if (hasTrackRecord) {
            newResult.execution.executionRiskScore = Math.min(100, newResult.execution.executionRiskScore + 10);
            calibrationNotes.push("Execution: plus points for proven domain experience and previous launches.");
        }
    }

    // DeFi Execution Rules
    if (projectType === 'defi') {
        const isComplex = newResult.execution.complexityLevel === 'high';
        const hasExperience = combinedExecutionText.includes("defi experience") || combinedExecutionText.includes("solidity") || combinedExecutionText.includes("rust");
        const hasAudit = combinedExecutionText.includes("audit") || combinedExecutionText.includes("security partner");

        if (isComplex && !hasExperience && !hasAudit) {
            newResult.execution.executionRiskScore = Math.max(0, newResult.execution.executionRiskScore - 15);
            newResult.execution.executionRiskLabel = 'high';
            newResult.overallScore = Math.max(10, newResult.overallScore - 5);
            calibrationNotes.push("Execution: minus points for complex DeFi protocol without specific experience or audits.");
        }

        if (hasExperience || hasAudit) {
            newResult.execution.executionRiskScore = Math.min(100, newResult.execution.executionRiskScore + 10);
            calibrationNotes.push("Execution: plus points for DeFi experience or security partners.");
        }
    }

    // AI Execution Rules
    if (projectType === 'ai') {
        const isAmbitious = newResult.execution.complexityLevel === 'high';
        const hasMLBackground = combinedExecutionText.includes("ml engineer") || combinedExecutionText.includes("phd") || combinedExecutionText.includes("faang") || combinedExecutionText.includes("research");

        if (isAmbitious && !hasMLBackground) {
            newResult.execution.executionRiskScore = Math.max(0, newResult.execution.executionRiskScore - 10);
            newResult.execution.executionRiskLabel = 'high';
            calibrationNotes.push("Execution: minus points for ambitious AI project without clear ML/engineering background.");
        }

        if (hasMLBackground) {
            newResult.execution.executionRiskScore = Math.min(100, newResult.execution.executionRiskScore + 10);
            calibrationNotes.push("Execution: plus points for strong technical/ML background.");
        }
    }

    // Rule 4: Launch Readiness Calibration
    if (newResult.launchReadinessScore !== undefined) {
        const launchSignals = (newResult.launchReadinessSignals || []).join(" ").toLowerCase();

        // Memecoin Launch Rules
        if (projectType === 'memecoin') {
            const hasLiquidityPlan = launchSignals.includes("liquidity") || launchSignals.includes("lp") || launchSignals.includes("treasury") || (ideaSubmission?.launchLiquidityPlan && ideaSubmission.launchLiquidityPlan.length > 10);
            const hasCommunityPlan = launchSignals.includes("community") || launchSignals.includes("content") || launchSignals.includes("viral") || (ideaSubmission?.goToMarketPlan && ideaSubmission.goToMarketPlan.length > 10);

            if (!hasLiquidityPlan) {
                newResult.launchReadinessScore = Math.max(0, newResult.launchReadinessScore! - 20);
                newResult.launchReadinessLabel = 'low';
                calibrationNotes.push("Launch (memecoin): minus points for no LP or anti-rug thinking.");
            }

            if (hasLiquidityPlan && hasCommunityPlan) {
                newResult.launchReadinessScore = Math.min(100, newResult.launchReadinessScore! + 10);
                calibrationNotes.push("Launch: plus points for clear LP and community plan.");
            }

            // Tune Memecoin Rug Risk
            if (ideaSubmission?.launchLiquidityPlan) {
                const plan = ideaSubmission.launchLiquidityPlan.toLowerCase();
                const hasLock = plan.includes("lock") || plan.includes("vesting");
                const hasSelfBuy = plan.includes("self-buy") || plan.includes("my own money") || plan.includes("own capital") || plan.includes("self fund") || plan.includes("buy 500") || plan.includes("buy 1000") || plan.includes("buy $");
                const hasAntiRug = plan.includes("renounce") || plan.includes("burn") || plan.includes("audit") || plan.includes("no stealth") || plan.includes("revoked");

                if (newResult.cryptoNativeChecks?.rugPullRisk === 'high' && hasSelfBuy && hasLock) {
                    newResult.cryptoNativeChecks.rugPullRisk = 'medium';
                    calibrationNotes.push("Rug Risk: downgraded to Medium due to standard degen setup (self-buy + lock).");
                }

                if (hasAntiRug && hasLock) {
                    if (newResult.cryptoNativeChecks?.rugPullRisk && newResult.cryptoNativeChecks.rugPullRisk !== 'low') {
                        newResult.cryptoNativeChecks.rugPullRisk = 'low';
                        newResult.launchReadinessScore = Math.min(100, newResult.launchReadinessScore! + 5);
                        calibrationNotes.push("Rug Risk: upgraded to Low due to strong anti-rug measures.");
                    }
                }
            }
        }

        // DeFi Launch Rules
        if (projectType === 'defi') {
            const hasAudit = launchSignals.includes("audit") || launchSignals.includes("security");
            const hasGTM = launchSignals.includes("user") || launchSignals.includes("acquisition") || launchSignals.includes("market");

            if (!hasAudit) {
                newResult.launchReadinessScore = Math.max(0, newResult.launchReadinessScore! - 15);
                if (newResult.launchReadinessScore < 40) newResult.launchReadinessLabel = 'low';
                calibrationNotes.push("Launch: minus points for no security/audit plan.");
            }

            if (hasAudit && hasGTM) {
                newResult.launchReadinessScore = Math.min(100, newResult.launchReadinessScore! + 10);
                calibrationNotes.push("Launch: plus points for security plan and clear GTM.");
            }
        }

        // AI/Other Launch Rules
        if (projectType === 'ai' || projectType === 'other') {
            const hasMVP = launchSignals.includes("mvp") || launchSignals.includes("prototype") || launchSignals.includes("demo") || (ideaSubmission?.mvpScope && ideaSubmission.mvpScope.length > 10);
            const hasData = launchSignals.includes("data") || launchSignals.includes("dataset") || launchSignals.includes("infra") || (ideaSubmission?.mvpScope && ideaSubmission.mvpScope.toLowerCase().includes("data"));
            const isVagueLaunch = launchSignals.includes("vague") || launchSignals.includes("unclear");

            if (isVagueLaunch || (!hasMVP && !hasData)) {
                newResult.launchReadinessScore = Math.max(0, newResult.launchReadinessScore! - 15);
                newResult.launchReadinessLabel = 'low';
                calibrationNotes.push("Launch: minus points for vague MVP/data plan.");
            }

            if (hasMVP && hasData) {
                newResult.launchReadinessScore = Math.min(100, newResult.launchReadinessScore! + 10);
                calibrationNotes.push("Launch: plus points for realistic MVP scope and data plan.");
            }
        }

        // Update Label based on final score
        if (newResult.launchReadinessScore! >= 70) newResult.launchReadinessLabel = 'high';
        else if (newResult.launchReadinessScore! >= 40) newResult.launchReadinessLabel = 'medium';
        else newResult.launchReadinessLabel = 'low';

        // Nudge Overall Score based on Launch Readiness mismatch
        if (newResult.overallScore >= 70 && newResult.launchReadinessScore! < 40) {
            newResult.overallScore -= 5;
            calibrationNotes.push("Overall: minus points for severe lack of launch readiness despite good idea.");
        }
        if (newResult.overallScore >= 50 && newResult.overallScore < 70 && newResult.launchReadinessScore! >= 80) {
            newResult.overallScore += 5;
            calibrationNotes.push("Overall: plus points for exceptional launch readiness.");
        }
    }

    // === Deterministic Investor Constraints ===

    // Constraint 1: Solo Founder Cap
    if (ideaSubmission?.teamSize === 'solo' && newResult.execution.complexityLevel === 'high') {
        if (newResult.execution.executionRiskScore > 60) {
            newResult.execution.executionRiskScore = 60;
            newResult.execution.executionRiskLabel = 'high';
            calibrationNotes.push("Constraint: Solo founder execution score capped due to high complexity.");
        }
    }

    // Constraint 2: Memecoin + Low Budget
    const hasBudget = ideaSubmission?.resources?.includes('budget');
    if (projectType === 'memecoin' && !hasBudget) {
        if (newResult.launchReadinessScore && newResult.launchReadinessScore > 40) {
            newResult.launchReadinessScore = 40;
            newResult.launchReadinessLabel = 'low';
            calibrationNotes.push("Constraint: Memecoin without budget capped at low launch readiness.");
        }
        if (newResult.overallScore > 20) {
            newResult.overallScore -= 10;
            calibrationNotes.push("Constraint: Overall score penalty for memecoin with no budget.");
        }
    }

    // Constraint 3: Vague Description
    const descLen = ideaSubmission?.description?.length || 0;
    const hasAttachments = !!ideaSubmission?.attachments && ideaSubmission.attachments.length > 5;
    const isVague = descLen < 100 && !hasAttachments;

    if (isVague) {
        newResult.overallScore -= 5;
        newResult.technical.comments += " [System: Confidence Low due to sparse input]";
        calibrationNotes.push("Constraint: Minor penalty for vague/short description.");
    }

    // Constraint 4: Admin Risk in DeFi
    if (projectType === 'defi') {
        const risks = (newResult.technical.keyRisks || []).join(" ").toLowerCase();
        const plan = (ideaSubmission?.mvpScope || "" + ideaSubmission?.description || "").toLowerCase();

        if (risks.includes("admin") || risks.includes("centralization")) {
            const hasSafeguards = plan.includes("timelock") || plan.includes("dao") || plan.includes("multisig") || plan.includes("immutable");
            if (!hasSafeguards) {
                newResult.execution.executionRiskScore = Math.min(newResult.execution.executionRiskScore, 40);
                if (newResult.cryptoNativeChecks) newResult.cryptoNativeChecks.rugPullRisk = 'high';
                calibrationNotes.push("Constraint: DeFi with centralization risks and no safeguards flagged as High Risk.");
            }
        }
    }

    // === Hard Fail & Score Floor ===
    let isHardFail = false;

    if (projectType === 'memecoin') {
        const launchSignals = (newResult.launchReadinessSignals || []).join(" ").toLowerCase();
        const hasLP = launchSignals.includes("liquidity") || launchSignals.includes("lp") || (ideaSubmission?.launchLiquidityPlan && ideaSubmission.launchLiquidityPlan.length > 10);

        if (!hasBudget && isVague && !hasLP) {
            isHardFail = true;
            calibrationNotes.push("CRITICAL: Hard Fail triggered (No Budget + Vague + No LP Plan). Score collapsed to 0.");
        }
    }

    // Final Floor Clamp
    if (isHardFail) {
        newResult.overallScore = 0;
    } else {
        newResult.overallScore = Math.max(5, newResult.overallScore);
    }

    newResult.overallScore = Math.min(100, newResult.overallScore);
    newResult.calibrationNotes = calibrationNotes;

    // Show Crypto-Native Health only when relevant
    const isCryptoProject = projectType === 'memecoin' || projectType === 'defi';
    const hasToken = newResult.tokenomics.tokenNeeded;
    const rawPlan = (ideaSubmission?.launchLiquidityPlan || "").toLowerCase();
    const hasLiquidityPlan = rawPlan.length > 5 &&
        !rawPlan.includes("no token") &&
        !rawPlan.includes("self-funded") &&
        !rawPlan.includes("none") &&
        !rawPlan.includes("n/a");

    if (!isCryptoProject && !hasToken && !hasLiquidityPlan) {
        delete newResult.cryptoNativeChecks;
    } else if (newResult.cryptoNativeChecks) {
        // Enhance Liquidity Grading
        if (ideaSubmission?.launchLiquidityPlan) {
            const lpPlan = ideaSubmission.launchLiquidityPlan.toLowerCase();

            let durationDetail = "Unclear duration";
            if (lpPlan.includes("1 year") || lpPlan.includes("12 months") || lpPlan.includes("365 days")) durationDetail = "Locked for 1 year";
            else if (lpPlan.includes("6 months") || lpPlan.includes("180 days")) durationDetail = "Locked for 6 months";
            else if (lpPlan.includes("3 months") || lpPlan.includes("90 days")) durationDetail = "Locked for 3 months";
            else if (lpPlan.includes("1 month") || lpPlan.includes("30 days")) durationDetail = "Locked for 30 days";
            else if (lpPlan.includes("burn") || lpPlan.includes("burnt")) durationDetail = "Liquidity Burned";
            else if (lpPlan.includes("lock") || lpPlan.includes("vesting")) durationDetail = "Locked (Unknown duration)";

            newResult.cryptoNativeChecks.liquidityDetail = durationDetail;

            if (lpPlan.includes("burn") || lpPlan.includes("1 year") || lpPlan.includes("12 months")) {
                newResult.cryptoNativeChecks.liquidityGrade = 'strong';
            } else if (lpPlan.includes("6 months") || lpPlan.includes("180 days")) {
                newResult.cryptoNativeChecks.liquidityGrade = 'medium';
            } else if (lpPlan.includes("1 month") || lpPlan.includes("30 days") || lpPlan.includes("short")) {
                newResult.cryptoNativeChecks.liquidityGrade = 'weak';
                calibrationNotes.push("Liquidity: Short lock period (30d) is considered weak signal.");
            } else {
                if (newResult.cryptoNativeChecks.liquidityStatus === 'locked') {
                    newResult.cryptoNativeChecks.liquidityGrade = 'medium';
                } else {
                    newResult.cryptoNativeChecks.liquidityGrade = 'weak';
                }
            }
        }
    }

    // Populate metadata fields
    newResult.projectType = projectType;
    const isConfidenceLow = newResult.technical.comments.includes("Confidence Low") ||
        calibrationNotes.some(n => n.includes("vague/short description"));
    newResult.confidenceLevel = isConfidenceLow ? 'low' : 'high';

    return newResult;
}
