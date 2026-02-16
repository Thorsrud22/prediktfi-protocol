/**
 * Parses the "Committee Log" from the technical comments field.
 * Returns structured bear/bull verdicts and pitches, or defaults if not found.
 */
export function parseCommitteeLog(comments?: string) {
    if (!comments) return null;

    const committeeLog = comments.match(/\[COMMITTEE LOG\]([\s\S]*)/)?.[1];
    if (!committeeLog) return null;

    return {
        bearVerdict: committeeLog.match(/Bear Verdict: (.*?) \("/)?.[1] || "SHORT",
        bearRoast: committeeLog.match(/Bear Verdict: .*? \("(.*?)"\)/)?.[1] || "No comment.",
        bullVerdict: committeeLog.match(/Bull Verdict: (.*?) \("/)?.[1] || "LONG",
        bullPitch: committeeLog.match(/Bull Verdict: .*? \("(.*?)"\)/)?.[1] || "No comment.",
    };
}

import { SCORE_THRESHOLDS, SCORE_LABELS } from './constants';

export const getScoreColor = (score: number) => {
    if (score >= SCORE_THRESHOLDS.GOOD) return 'text-emerald-400';
    if (score >= SCORE_THRESHOLDS.PASS) return 'text-amber-400';
    return 'text-red-400';
};

export const getScoreLabel = (score: number) => {
    if (score >= SCORE_THRESHOLDS.STRONG) return SCORE_LABELS.STRONG;
    if (score >= SCORE_THRESHOLDS.WATCHLIST) return SCORE_LABELS.WATCHLIST;
    return SCORE_LABELS.PASS;
};

export const getScoreBadgeClass = (score: number) => {
    if (score >= SCORE_THRESHOLDS.STRONG) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (score >= SCORE_THRESHOLDS.WATCHLIST) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
};

/**
 * Score color helper for the 0-10 scale used by structuredAnalysisData dimensions.
 * Mirrors getScoreColor() thresholds but mapped to a 10-point range.
 */
export function getScoreColor10(score: number): {
    text: string;
    bg: string;
    border: string;
    label: string;
} {
    if (score >= 7)
        return {
            text: 'text-emerald-400',
            bg: 'bg-emerald-500',
            border: 'border-emerald-500/30',
            label: 'Strong',
        };
    if (score >= 4)
        return {
            text: 'text-amber-400',
            bg: 'bg-amber-500',
            border: 'border-amber-500/30',
            label: 'Mixed',
        };
    return {
        text: 'text-red-400',
        bg: 'bg-red-500',
        border: 'border-red-500/30',
        label: 'Weak',
    };
}
