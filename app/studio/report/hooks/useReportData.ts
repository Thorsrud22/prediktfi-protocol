import { useMemo } from 'react';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';
import { LIMITS } from '../constants';
import { parseCommitteeLog } from '../utils';

export function useReportData(result: IdeaEvaluationResult) {
    // Prepare Chart Data
    const chartData = useMemo(() => {
        const baseData = [
            { label: 'Technical', value: result.technical.feasibilityScore, fullMark: 100 },
            { label: 'Market', value: result.market.marketFitScore, fullMark: 100 },
            { label: 'Execution', value: 100 - (result.execution?.executionRiskScore || 50), fullMark: 100 },
        ];

        if (result.projectType === 'ai') {
            const aiScore = result.aiStrategy
                ? Math.round((result.aiStrategy.modelQualityScore + result.aiStrategy.dataMoatScore + result.aiStrategy.userAcquisitionScore) / 3)
                : 50;

            baseData.push({ label: 'AI Strategy', value: aiScore, fullMark: 100 });
        } else {
            baseData.push({ label: 'Tokenomics', value: result.tokenomics.designScore, fullMark: 100 });
        }

        baseData.push({ label: 'Overall', value: result.overallScore, fullMark: 100 });

        return baseData;
    }, [result]);

    // Calculate composite risk score
    const riskScore = useMemo(() => {
        let score = result.execution?.executionRiskScore ?? 50;

        // Add penalties from crypto checks
        if (result.cryptoNativeChecks) {
            if (result.cryptoNativeChecks.rugPullRisk === 'high') score += 20;
            if (result.cryptoNativeChecks.rugPullRisk === 'medium') score += 10;
            if (!result.cryptoNativeChecks.isLiquidityLocked && result.cryptoNativeChecks.liquidityStatus !== 'locked') score += 15;
            if ((result.cryptoNativeChecks.top10HolderPercentage ?? 0) > 50) score += 10;
        }

        return Math.min(100, Math.max(0, score));
    }, [result]);

    // Collect red flags
    const redFlags = useMemo(() => {
        const flags: string[] = [];

        if (result.cryptoNativeChecks) {
            if (result.cryptoNativeChecks.rugPullRisk === 'high') {
                flags.push('Rug Pull Risk: HIGH');
            }
            if (!result.cryptoNativeChecks.isLiquidityLocked && result.cryptoNativeChecks.liquidityStatus !== 'locked' && result.cryptoNativeChecks.liquidityStatus !== 'burned') {
                flags.push('Liquidity Status: UNLOCKED');
            }
            if ((result.cryptoNativeChecks.top10HolderPercentage ?? 0) > 50) {
                flags.push(`Top 10 Holders: ${result.cryptoNativeChecks.top10HolderPercentage?.toFixed(1)}% - CONCENTRATED`);
            }
        }

        // Check calibration notes for penalties
        if (result.calibrationNotes) {
            result.calibrationNotes.forEach(note => {
                if (note.toLowerCase().includes('penalty') || note.toLowerCase().includes('minus')) {
                    // Extract a short version
                    const shortNote = note.length > 60 ? note.slice(0, 57) + '...' : note;
                    if (flags.length < LIMITS.RED_FLAGS) flags.push(shortNote);
                }
            });
        }

        return flags;
    }, [result]);

    // Key stats for the stats bar
    const keyStats = useMemo(() => {
        const stats = [
            { label: 'Market Fit', value: result.market.marketFitScore },
            { label: 'Technical', value: result.technical.feasibilityScore },
        ];

        if (result.projectType === 'ai' && result.aiStrategy) {
            const aiAvg = Math.round((result.aiStrategy.modelQualityScore + result.aiStrategy.dataMoatScore + result.aiStrategy.userAcquisitionScore) / 3);
            stats.push({ label: 'AI Strategy', value: aiAvg });
        } else {
            stats.push({ label: 'Tokenomics', value: result.tokenomics.designScore });
        }

        stats.push({ label: 'Execution', value: 100 - (result.execution?.executionRiskScore || 50) });

        return stats;
    }, [result]);

    const evidenceCoveragePct = useMemo(() => {
        const rawCoverage = result.meta?.evidenceCoverage;
        if (typeof rawCoverage === 'number') {
            return Math.round(rawCoverage * 100);
        }

        const factualClaims = (result.evidence?.claims || []).filter(claim => claim.claimType === 'fact');
        if (factualClaims.length === 0) return 0;
        const corroborated = factualClaims.filter(claim => (claim.evidenceIds || []).length > 0);
        return Math.round((corroborated.length / factualClaims.length) * 100);
    }, [result]);

    const claimEvidenceRows = useMemo(() => {
        const evidenceItems = result.evidence?.evidence || [];
        const evidenceById = new Map(evidenceItems.map(item => [item.id, item]));
        const claims = result.evidence?.claims || [];

        return claims.slice(0, LIMITS.CLAIMS).map((claim, idx) => ({
            id: `${idx}-${claim.text.slice(0, 10)}`,
            claim,
            evidence: (claim.evidenceIds || [])
                .map(id => evidenceById.get(id))
                .filter((item): item is NonNullable<typeof item> => !!item)
                .slice(0, LIMITS.EVIDENCE_DISPLAY)
        }));
    }, [result]);

    // Parse committee log
    const committeeDebate = useMemo(() => {
        return parseCommitteeLog(result.technical.comments);
    }, [result.technical.comments]);

    return {
        chartData,
        riskScore,
        redFlags,
        keyStats,
        evidenceCoveragePct,
        claimEvidenceRows,
        committeeDebate
    };
}
