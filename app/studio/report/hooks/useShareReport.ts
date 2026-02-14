import { useState } from 'react';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';
import { useToast } from '../../../components/ToastProvider';
import { URLS } from '../constants';

export function useShareReport(result: IdeaEvaluationResult, evalId?: string | null) {
    const { addToast } = useToast();
    const [copied, setCopied] = useState(false);

    const getShareUrlParams = () => {
        if (evalId) {
            return `${URLS.IDEA_BASE}/${evalId}`;
        }
        const params = new URLSearchParams();
        params.set('title', result.summary.title);
        params.set('score', result.overallScore.toString());

        // Metrics
        params.set('tech', result.technical.feasibilityScore.toString());
        params.set('market', result.market.marketFitScore.toString());
        params.set('execution', (100 - (result.execution?.executionRiskScore || 50)).toString());
        params.set('token', result.projectType === 'ai' ? '50' : result.tokenomics.designScore.toString());

        return `${URLS.SHARE_BASE}?${params.toString()}`;
    };

    const handleShare = () => {
        const shareUrl = getShareUrlParams();
        const text = `I just used AI to stress-test my crypto project idea.\n\nScore: ${result.overallScore}/100 🔮\n\nGet your own evaluation here:`;
        const twitterUrl = `${URLS.TWITTER_INTENT}?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank');
    };

    const handleCopyLink = () => {
        const shareUrl = getShareUrlParams();
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            addToast({
                title: "Link Copied",
                description: "Share URL copied to clipboard",
                variant: 'success',
                duration: 2000
            });
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
            addToast({
                title: "Error",
                description: "Failed to copy link",
                variant: 'error'
            });
        });
    };

    return { copied, handleCopyLink, handleShare, getShareUrlParams };
} // End of hook
