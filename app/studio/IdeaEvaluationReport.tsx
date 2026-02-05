'use client';

import React, { useState } from 'react';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';
import {
    TriangleAlert as AlertTriangle,
    Terminal,
    Shield,
    CircleCheck as CheckCircle2,
    ArrowLeft,
    Sparkles,
    Activity,
    Download,
    Link as LinkIcon,
    Flag,
    Check,
    Zap
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useToast } from '../components/ToastProvider';

const RadarChart = dynamic(() => import('../components/charts/RadarChart'), {
    loading: () => <div className="w-full h-64 bg-white/5 animate-pulse rounded-xl" />,
    ssr: false
});
const RiskGauge = dynamic(() => import('../components/charts/RiskGauge'), {
    loading: () => <div className="w-full h-32 bg-white/5 animate-pulse rounded-xl" />,
    ssr: false
});
const KeyStatsBar = dynamic(() => import('../components/charts/KeyStatsBar'), {
    loading: () => <div className="w-full h-12 bg-white/5 animate-pulse rounded-lg" />,
    ssr: false
});
import { useSimplifiedWallet } from '../components/wallet/SimplifiedWalletProvider';
import { printElement } from '../utils/print';



interface IdeaEvaluationReportProps {
    result: IdeaEvaluationResult;
    onEdit?: () => void;
    onStartNew?: () => void;
    ownerAddress?: string;
    isExample?: boolean;
    evalId?: string | null;
    onCommit?: () => void;
    commitStatus?: 'idle' | 'committing' | 'success' | 'error';
}



export default function IdeaEvaluationReport({ result, onEdit, onStartNew, ownerAddress, isExample, evalId, onCommit, commitStatus = 'idle' }: IdeaEvaluationReportProps) {
    const { publicKey } = useSimplifiedWallet();
    const { addToast } = useToast();

    const getShareUrlParams = () => {
        if (evalId) {
            return `https://prediktfi.xyz/idea/${evalId}`;
        }
        const params = new URLSearchParams();
        params.set('title', result.summary.title);
        params.set('score', result.overallScore.toString());

        // Metrics
        params.set('tech', result.technical.feasibilityScore.toString());
        params.set('market', result.market.marketFitScore.toString());
        params.set('execution', (100 - (result.execution?.executionRiskScore || 50)).toString());
        params.set('token', result.projectType === 'ai' ? '50' : result.tokenomics.designScore.toString());

        return `https://prediktfi.xyz/share?${params.toString()}`;
    };

    const handleShare = () => {
        const shareUrl = getShareUrlParams();
        const text = `I just used AI to stress-test my crypto project idea.

Score: ${result.overallScore}/100 🔮

Get your own evaluation here:`;

        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank');
    };

    // Copy link state for visual feedback
    const [copied, setCopied] = React.useState(false);

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
            // Reset copied state after 2 seconds
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
            addToast({
                title: "Error",
                description: "Failed to copy link",
                variant: 'error'
            });
        });
    };

    // Check ownership
    const isOwner = React.useMemo(() => {
        if (isExample) return false; // Examples are never owned by viewer in the sense of editing/generating
        if (!ownerAddress) return true; // Legacy/Local reports might not have owner, assume allowed or handle elsewhere?
        // Actually, if it's public link, best to default false if not verified.
        // But for "Studio" use (parent passes no ownerAddress?), we assume owner.
        // Let's assume if ownerAddress is provided, we MUST match.
        if (publicKey === ownerAddress) return true;
        return false;
    }, [publicKey, ownerAddress, isExample]);




    // Prepare Chart Data
    const chartData = React.useMemo(() => {
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
    const riskScore = React.useMemo(() => {
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
    const redFlags = React.useMemo(() => {
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
                    if (flags.length < 5) flags.push(shortNote);
                }
            });
        }

        return flags;
    }, [result]);

    // Key stats for the stats bar
    const keyStats = React.useMemo(() => {
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

    const getScoreColor = (score: number) => {
        if (score >= 60) return 'text-emerald-400';
        if (score >= 30) return 'text-amber-400';
        return 'text-red-400';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 75) return 'Strong Potential';
        if (score >= 50) return 'Watchlist';
        return 'Pass';
    };

    const getScoreBadgeClass = (score: number) => {
        if (score >= 75) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if (score >= 50) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    };

    const handleDownloadPDF = () => {
        printElement('printable-report', `PrediktFi Evaluation - ${result.summary.title}`);
    };



    return (
        <div className="w-full max-w-5xl mx-auto font-sans text-sm leading-relaxed">
            <style jsx global>{`
                @media print {
                    .noprint {
                        display: none !important;
                    }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
                }
                .pulse-glow {
                    animation: pulse-glow 2s ease-in-out infinite;
                }
            `}</style>

            <div id="printable-report" className="bg-slate-900 border border-white/5 p-6 md:p-8 relative overflow-visible rounded-3xl shadow-2xl text-white flex flex-col">

                {/* ========== STICKY HEADER BAR ========== */}
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 noprint">
                    <div className="flex items-center gap-4">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] text-white/60 font-bold uppercase tracking-[0.2em]">Analysis Complete</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-white/50 font-mono hidden sm:block">{new Date().toISOString().split('T')[0]}</span>
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-white/5 active:scale-95"
                            title="Print or Save as PDF"
                        >
                            <Download size={14} /> Print / Save PDF
                        </button>
                    </div>
                </div>

                {/* ========== ABOVE THE FOLD: COMMAND CENTER ========== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                    {/* LEFT: VERDICT PANEL (2/3) */}
                    <div className="lg:col-span-2 flex flex-col justify-center">
                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase mb-2">
                            {result.summary.title} <span className="text-blue-500">.</span>
                        </h1>
                        <p className="text-white/50 text-sm mb-6 max-w-lg leading-relaxed">
                            {result.summary.oneLiner}
                        </p>

                        {/* MASSIVE SCORE - span wrapper fix for clipping */}
                        <div className="flex items-baseline overflow-visible">
                            <span className="text-5xl sm:text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 pt-4 pb-2 leading-[1.15]">
                                {result.overallScore}
                            </span>
                            <span className="text-sm text-gray-500 ml-2 font-medium">/ 100</span>
                        </div>
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border mt-2 inline-block ${getScoreBadgeClass(result.overallScore)}`}>
                            {getScoreLabel(result.overallScore)}
                        </span>

                        {/* What This Score Means - Inline Definition */}
                        <div className="mt-4 bg-slate-800/50 border border-white/5 rounded-xl p-4 max-w-md">
                            <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Activity size={12} className="text-blue-400" />
                                What this score means
                            </h4>
                            <p className="text-xs text-white/50 leading-relaxed">
                                The <span className="text-white font-medium">Predikt Score</span> is a weighted assessment of your project's viability based on
                                technical feasibility, market positioning, execution readiness, and {result.projectType === 'ai' ? 'AI strategy strength' : 'tokenomics design'}.
                                Scores above 75 indicate strong investment potential; 50-74 suggests promise with notable risks; below 50 signals significant concerns.
                            </p>
                        </div>

                        {/* Score Methodology Explainer */}
                        <div className="mt-3 text-[10px] text-white/40 max-w-md leading-relaxed">
                            <span className="font-bold text-white/60">Score breakdown: </span>
                            Technical ({result.technical.feasibilityScore}) + Market ({result.market.marketFitScore}) + Execution ({100 - (result.execution?.executionRiskScore || 50)})
                            {result.projectType === 'ai' && result.aiStrategy
                                ? ` + AI (${Math.round((result.aiStrategy.modelQualityScore + result.aiStrategy.dataMoatScore + result.aiStrategy.userAcquisitionScore) / 3)})`
                                : ` + Token (${result.tokenomics.designScore})`
                            }
                        </div>

                        {/* Tier Legend */}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-white/30">
                            <span><span className="text-emerald-400">●</span> 75+ Strong Potential</span>
                            <span><span className="text-amber-400">●</span> 50-74 Watchlist</span>
                            <span><span className="text-red-400">●</span> &lt;50 Pass</span>
                        </div>
                    </div>

                    {/* RIGHT: RISK RADAR (1/3) */}
                    <div className="flex flex-col items-center justify-center">
                        <RiskGauge score={riskScore} size={200} />
                    </div>
                </div>

                {/* ========== RED FLAG BOX ========== */}
                {redFlags.length > 0 && (
                    <div className={`border-2 border-red-500/50 bg-red-950/30 p-4 rounded-xl mb-6 pulse-glow`}>
                        <div className="flex items-center gap-2 mb-3 text-red-400">
                            <Flag size={16} />
                            <h3 className="font-bold uppercase tracking-[0.2em] text-[10px]">Critical Warnings</h3>
                        </div>
                        <ul className="space-y-2">
                            {redFlags.map((flag, i) => (
                                <li key={i} className="flex gap-3 text-red-200/80 text-xs">
                                    <span className="text-red-500">🚩</span>
                                    <span className="font-medium">{flag}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* ========== KEY STATS BAR ========== */}
                <KeyStatsBar stats={keyStats} className="mb-10" />

                {/* ========== BELOW THE FOLD: DEEP DIVES ========== */}

                {/* RADAR CHART + ACTION PLAN - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                    {/* RADAR CHART - Own Card */}
                    <div className="border border-white/10 bg-slate-900/60 p-6 rounded-2xl flex flex-col items-center justify-center min-h-[360px]">
                        <div className="flex items-center gap-2 mb-4 text-white/60 border-b border-white/5 pb-3 w-full">
                            <Activity size={16} className="text-blue-400" />
                            <h3 className="font-bold uppercase tracking-[0.2em] text-[10px]">Performance Radar</h3>
                        </div>
                        <RadarChart data={chartData} width={300} height={300} />
                    </div>

                    {/* IMMEDIATE ACTION PLAN */}
                    <div className="border border-blue-500/30 bg-blue-500/10 p-6 rounded-2xl">
                        <div className="flex items-center gap-2 mb-4 text-white border-b border-white/10 pb-3">
                            <CheckCircle2 size={18} className="text-blue-400" />
                            <h3 className="font-bold uppercase tracking-[0.2em] text-[10px] text-blue-100">Immediate Action Plan</h3>
                        </div>

                        {(result.recommendations?.mustFixBeforeBuild ?? []).length > 0 ? (
                            <div className="space-y-4">
                                {(result.recommendations?.mustFixBeforeBuild ?? []).map((fix, i) => (
                                    <div key={i} className="flex gap-4 items-start group">
                                        <div className="mt-0.5 min-w-[24px] h-6 rounded-full border-2 border-blue-500/40 flex items-center justify-center bg-black/20 text-[10px] font-bold text-blue-400">
                                            {i + 1}
                                        </div>
                                        <p className="text-white/90 text-sm leading-relaxed font-medium">{fix}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-white/60 text-sm">No critical blockers identified. Proceed to execution.</p>
                        )}
                    </div>
                </div>

                {/* MARKET INTELLIGENCE - TABLE VIEW */}
                <div className="border border-blue-500/20 bg-blue-500/5 p-6 rounded-2xl mb-8">
                    <div className="flex items-center gap-2 mb-5 text-blue-400 border-b border-blue-500/10 pb-3">
                        <Terminal size={18} />
                        <h3 className="font-bold uppercase tracking-[0.2em] text-[10px]">Market Intelligence</h3>
                    </div>
                    {(() => {
                        // Helper to check if a value is "real" data
                        const hasValue = (v?: string) => v && v !== 'N/A' && v !== '-' && v !== 'unknown' && v.trim() !== '';

                        // Filter competitors with at least one real metric
                        const competitorsWithData = (result.market?.competitors || []).filter(comp => {
                            const m = comp.metrics;
                            if (!m) return false;
                            return hasValue(m.marketCap) || hasValue(m.tvl) || hasValue(m.dailyUsers) || hasValue(m.funding) || hasValue(m.revenue);
                        });

                        if (competitorsWithData.length > 0) {
                            return (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-left text-white/40 uppercase tracking-widest text-[9px] border-b border-white/5">
                                                <th className="pb-2 pr-4">Competitor</th>
                                                <th className="pb-2 pr-4">MCap/TVL</th>
                                                <th className="pb-2 pr-4">Users</th>
                                                <th className="pb-2">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {competitorsWithData.slice(0, 4).map((comp, i) => {
                                                const primaryMetric =
                                                    hasValue(comp.metrics?.marketCap) ? comp.metrics!.marketCap :
                                                        hasValue(comp.metrics?.tvl) ? comp.metrics!.tvl :
                                                            hasValue(comp.metrics?.funding) ? comp.metrics!.funding : '—';

                                                const users = hasValue(comp.metrics?.dailyUsers) ? comp.metrics!.dailyUsers : '—';

                                                return (
                                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                                        <td className="py-2 pr-4 text-blue-100 font-bold">{comp.name}</td>
                                                        <td className="py-2 pr-4 text-white/60 font-mono">{primaryMetric}</td>
                                                        <td className="py-2 pr-4 text-white/60 font-mono">{users}</td>
                                                        <td className="py-2">
                                                            <span className="text-[9px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded font-mono">
                                                                Active
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        } else if ((result.market?.competitorSignals ?? []).length > 0) {
                            // Fallback to competitor signals if no structured data
                            return (
                                <ul className="space-y-2">
                                    {(result.market?.competitorSignals ?? []).slice(0, 5).map((signal, i) => (
                                        <li key={i} className="flex gap-3 text-blue-200/80 text-xs">
                                            <span className="text-blue-500">•</span>
                                            <span>{signal}</span>
                                        </li>
                                    ))}
                                </ul>
                            );
                        } else {
                            // No real data available
                            return (
                                <p className="text-white/40 text-xs italic">
                                    Competitive landscape data not available for this category. Consider providing a token address or more project details.
                                </p>
                            );
                        }
                    })()}
                </div>

                {/* THREAT DETECTION + CALIBRATION (2-col grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* THREAT DETECTION */}
                    <div className="border border-slate-700/50 bg-slate-900/60 p-6 rounded-2xl">
                        <div className="flex items-center gap-2 mb-4 text-slate-400 border-b border-white/5 pb-3">
                            <AlertTriangle size={18} />
                            <h3 className="font-bold uppercase tracking-[0.2em] text-[10px]">Threat Detection</h3>
                        </div>
                        <ul className="space-y-3">
                            {[...(result.technical?.keyRisks ?? []), ...(result.market?.goToMarketRisks ?? [])].slice(0, 5).map((con, i) => (
                                <li key={i} className="flex gap-3 text-slate-300 text-xs leading-relaxed">
                                    <span className="text-red-500/50 font-mono font-bold">•</span>
                                    <span>{con}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* SCORE CALIBRATION AUDIT */}
                    {result.calibrationNotes && result.calibrationNotes.length > 0 && (
                        <div className="border border-white/5 bg-slate-900/80 p-6 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-600 to-cyan-500 opacity-50" />
                            <div className="flex items-center gap-2 mb-4 text-white/90 border-b border-white/5 pb-3">
                                <Activity size={18} className="text-cyan-400" />
                                <h3 className="font-bold uppercase tracking-[0.2em] text-[10px]">Calibration Audit</h3>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {result.calibrationNotes.slice(0, 6).map((note, i) => {
                                    const isNegative = note.toLowerCase().includes("minus") || note.toLowerCase().includes("penalty");
                                    const isPositive = note.toLowerCase().includes("plus") || note.toLowerCase().includes("bonus");

                                    return (
                                        <div key={i} className="flex gap-3 items-start text-xs">
                                            <div className={`mt-0.5 min-w-[16px] h-4 rounded flex items-center justify-center text-[9px] font-bold uppercase ${isNegative ? 'bg-red-500/20 text-red-400' :
                                                isPositive ? 'bg-emerald-500/20 text-emerald-400' :
                                                    'bg-slate-700 text-slate-400'
                                                }`}>
                                                {isNegative ? '-' : isPositive ? '+' : 'i'}
                                            </div>
                                            <p className={`${isNegative ? 'text-red-200/80' :
                                                isPositive ? 'text-emerald-200/80' :
                                                    'text-slate-300'
                                                } leading-relaxed`}>
                                                {note.length > 80 ? note.slice(0, 77) + '...' : note}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* SECURITY / CRYPTO-NATIVE CHECKS GRID */}
                {result.cryptoNativeChecks && result.projectType !== 'ai' && (
                    <div className="border border-white/5 bg-slate-900 p-6 mb-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2 text-blue-400">
                                <Shield size={18} />
                                <h3 className="font-bold uppercase tracking-[0.2em] text-[10px]">Security Check</h3>
                            </div>
                            {/* Verification status indicator */}
                            {result.cryptoNativeChecks.isVerified ? (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                                    🔗 On-Chain Verified
                                </span>
                            ) : (
                                <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded font-bold uppercase tracking-wider">
                                    ⚠️ Simulated (Not Checked)
                                </span>
                            )}
                        </div>

                        {/* Show token address when verified */}
                        {result.cryptoNativeChecks.isVerified && result.cryptoNativeChecks.tokenAddress && (
                            <div className="mb-4 bg-slate-800/50 p-3 rounded-lg">
                                <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Token Address</div>
                                <div className="text-xs font-mono text-emerald-400 break-all">
                                    {result.cryptoNativeChecks.tokenAddress}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-800/50 p-3 rounded-lg text-center relative">
                                {!result.cryptoNativeChecks.isVerified && (
                                    <div className="absolute top-1 right-1 text-[7px] text-amber-400/60 font-mono">SIM</div>
                                )}
                                <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Rug Risk</div>
                                <div className={`text-sm font-bold uppercase ${!result.cryptoNativeChecks.isVerified
                                        ? 'text-white/30'
                                        : result.cryptoNativeChecks.rugPullRisk === 'low' ? 'text-emerald-400' :
                                            result.cryptoNativeChecks.rugPullRisk === 'medium' ? 'text-amber-400' : 'text-red-400'
                                    }`}>
                                    {result.cryptoNativeChecks.isVerified
                                        ? result.cryptoNativeChecks.rugPullRisk
                                        : 'Not Checked'}
                                </div>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-lg text-center relative">
                                {!result.cryptoNativeChecks.isVerified && (
                                    <div className="absolute top-1 right-1 text-[7px] text-amber-400/60 font-mono">SIM</div>
                                )}
                                <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Audit</div>
                                <div className={`text-sm font-bold uppercase ${!result.cryptoNativeChecks.isVerified
                                        ? 'text-white/30'
                                        : result.cryptoNativeChecks.auditStatus === 'audited' ? 'text-emerald-400' : 'text-amber-400'
                                    }`}>
                                    {result.cryptoNativeChecks.isVerified
                                        ? result.cryptoNativeChecks.auditStatus
                                        : 'Not Checked'}
                                </div>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-lg text-center relative">
                                {!result.cryptoNativeChecks.isVerified && (
                                    <div className="absolute top-1 right-1 text-[7px] text-amber-400/60 font-mono">SIM</div>
                                )}
                                <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Liquidity</div>
                                <div className={`text-sm font-bold uppercase ${!result.cryptoNativeChecks.isVerified
                                        ? 'text-white/30'
                                        : (result.cryptoNativeChecks.isLiquidityLocked || result.cryptoNativeChecks.liquidityStatus === 'locked' || result.cryptoNativeChecks.liquidityStatus === 'burned')
                                            ? 'text-emerald-400'
                                            : 'text-red-400'
                                    }`}>
                                    {result.cryptoNativeChecks.isVerified
                                        ? (result.cryptoNativeChecks.isLiquidityLocked ? 'Locked' : result.cryptoNativeChecks.liquidityStatus)
                                        : 'Not Checked'}
                                </div>
                            </div>
                            {result.cryptoNativeChecks.isVerified && result.cryptoNativeChecks.top10HolderPercentage != null && (
                                <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                                    <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Top 10</div>
                                    <div className={`text-sm font-bold ${result.cryptoNativeChecks.top10HolderPercentage > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {result.cryptoNativeChecks.top10HolderPercentage.toFixed(1)}%
                                    </div>
                                </div>
                            )}
                            {!result.cryptoNativeChecks.isVerified && (
                                <div className="bg-slate-800/50 p-3 rounded-lg text-center relative">
                                    <div className="absolute top-1 right-1 text-[7px] text-amber-400/60 font-mono">SIM</div>
                                    <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Holdings</div>
                                    <div className="text-sm font-bold uppercase text-white/30">Not Checked</div>
                                </div>
                            )}
                        </div>

                        {/* Checks Performed List (when verified) */}
                        {result.cryptoNativeChecks.isVerified && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <div className="text-[9px] text-white/40 uppercase tracking-widest mb-2">Checks Performed</div>
                                <div className="flex flex-wrap gap-2 text-[10px]">
                                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">✓ Mint Authority</span>
                                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">✓ Freeze Authority</span>
                                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">✓ Liquidity Status</span>
                                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">✓ Holder Distribution</span>
                                </div>
                            </div>
                        )}

                        {/* Help text when not verified */}
                        {!result.cryptoNativeChecks.isVerified && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <p className="text-[10px] text-amber-400/80 italic flex items-center gap-2">
                                    <AlertTriangle size={12} />
                                    No token address provided. Security data above is simulated by AI and NOT verified on-chain.
                                    Provide a token address for real security checks.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* AI STRATEGY (for AI projects) - collapsed */}
                {result.projectType === 'ai' && result.aiStrategy && (
                    <div className="border border-white/5 bg-slate-900 p-6 mb-6 rounded-2xl">
                        <div className="flex items-center gap-2 text-cyan-400 mb-5 border-b border-white/10 pb-3">
                            <Sparkles size={18} />
                            <h3 className="font-bold uppercase tracking-[0.2em] text-[10px]">AI Strategy Core</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Model Quality', score: result.aiStrategy.modelQualityScore, comment: result.aiStrategy.modelQualityComment },
                                { label: 'Data Moat', score: result.aiStrategy.dataMoatScore, comment: result.aiStrategy.dataMoatComment },
                                { label: 'Acquisition', score: result.aiStrategy.userAcquisitionScore, comment: result.aiStrategy.userAcquisitionComment },
                            ].map((item, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">{item.label}</div>
                                    <div className={`text-2xl font-bold mb-2 ${getScoreColor(item.score)}`}>
                                        {item.score}<span className="text-sm text-white/20">/100</span>
                                    </div>
                                    {item.comment && (
                                        <p className="text-xs text-white/50 leading-relaxed italic">"{item.comment}"</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI REASONING CHAIN - collapsible */}
                {result.reasoningSteps && result.reasoningSteps.length > 0 && (
                    <details className="border border-white/5 bg-slate-900 rounded-2xl mb-6 group">
                        <summary className="p-6 cursor-pointer flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                            <Terminal size={14} className="text-blue-400" />
                            <span className="font-bold uppercase tracking-[0.2em] text-[10px]">AI Reasoning Chain</span>
                            <span className="text-[9px] text-white/30 ml-auto">Click to expand</span>
                        </summary>
                        <div className="px-6 pb-6">
                            <ul className="space-y-2 text-white/70 font-mono text-xs">
                                {(result.reasoningSteps ?? []).map((step, i) => (
                                    <li key={i} className="flex gap-3">
                                        <span className="text-blue-500/50">{(i + 1).toString().padStart(2, '0')}.</span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </details>
                )}

                {/* ACTION BUTTONS */}
                {/* ACTION PANEL - "Next Best Action" */}
                <div className="mt-12 border border-blue-500/20 bg-blue-500/5 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-8 duration-700 noprint">

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                            <Zap size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-wide uppercase">Recommended Next Steps</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* 1. Share (Primary) */}
                        <div className="md:col-span-2 p-6 bg-slate-900/80 border border-blue-500/30 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-blue-900/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="relative z-10 text-center md:text-left">
                                <h4 className="text-white font-bold mb-1 flex items-center justify-center md:justify-start gap-2">
                                    Share this Report <Sparkles size={14} className="text-amber-400" />
                                </h4>
                                <p className="text-white/40 text-xs max-w-sm">
                                    Generate a shareable link or post directly to X/Twitter to get community feedback.
                                </p>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto relative z-10">
                                {/* Copy Link */}
                                <button
                                    onClick={handleCopyLink}
                                    className={`flex-1 md:flex-none px-6 py-3 border text-[10px] font-bold uppercase tracking-[0.2em] transition-all rounded-xl flex items-center justify-center gap-2 active:scale-95 ${copied
                                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                                        : 'border-white/10 bg-white/5 hover:bg-white/10 text-white'}`}
                                >
                                    {copied ? (
                                        <>
                                            <Check size={14} /> Copied!
                                        </>
                                    ) : (
                                        <>
                                            <LinkIcon size={14} /> Copy Link
                                        </>
                                    )}
                                </button>

                                {/* Share on X */}
                                <button
                                    onClick={handleShare}
                                    className="flex-1 md:flex-none px-6 py-3 bg-white text-black hover:bg-gray-200 border-transparent text-[10px] font-bold uppercase tracking-[0.2em] transition-all rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-black">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    Post on X
                                </button>
                            </div>
                        </div>

                        {/* 2. Refine (Secondary) */}
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="group p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-left flex flex-col justify-between h-full min-h-[140px]"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3 text-white/60 group-hover:text-blue-400 transition-colors">
                                        <ArrowLeft size={20} />
                                    </div>
                                    <h4 className="text-white font-bold text-sm mb-1">Refine Input</h4>
                                    <p className="text-white/40 text-[10px]">Tweak your pitch details to improve your score.</p>
                                </div>
                                <div className="mt-4 text-[10px] font-bold text-white/50 uppercase tracking-widest group-hover:text-white transition-colors">
                                    Edit Analysis →
                                </div>
                            </button>
                        )}

                        {/* 3. Commit On-Chain (Tertiary) */}
                        {onCommit && (
                            <button
                                onClick={onCommit}
                                disabled={commitStatus === 'committing' || commitStatus === 'success'}
                                className={`group p-5 border rounded-xl transition-all text-left flex flex-col justify-between h-full min-h-[140px] relative overflow-hidden ${commitStatus === 'success'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 cursor-default'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                    }`}
                            >
                                {commitStatus === 'success' && <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />}

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-3">
                                        <Shield size={20} className={commitStatus === 'success' ? 'text-emerald-400' : 'text-white/60 group-hover:text-emerald-400 transition-colors'} />
                                        {commitStatus === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
                                    </div>
                                    <h4 className={`font-bold text-sm mb-1 ${commitStatus === 'success' ? 'text-emerald-400' : 'text-white'}`}>
                                        {commitStatus === 'success' ? 'Insight Committed' : 'Commit to Chain'}
                                    </h4>
                                    <p className={`text-[10px] ${commitStatus === 'success' ? 'text-emerald-400/60' : 'text-white/40'}`}>
                                        {commitStatus === 'success'
                                            ? 'Immutably recorded on Solana.'
                                            : 'Record this evaluation on-chain. Requires wallet.'}
                                    </p>
                                </div>

                                <div className={`mt-4 text-[10px] font-bold uppercase tracking-widest transition-colors relative z-10 flex items-center gap-2 ${commitStatus === 'success' ? 'text-emerald-500' : 'text-white/50 group-hover:text-white'
                                    }`}>
                                    {commitStatus === 'committing' ? (
                                        <>Processing...</>
                                    ) : commitStatus === 'success' ? (
                                        <>View Record <LinkIcon size={10} /></>
                                    ) : (
                                        <>Commit Insight →</>
                                    )}
                                </div>
                            </button>
                        )}

                        {/* Fallback New Evaluation if no onCommit */}
                        {!onCommit && onStartNew && (
                            <button
                                onClick={onStartNew}
                                className="group p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-left flex flex-col justify-between h-full min-h-[140px]"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3 text-white/60 group-hover:text-blue-400 transition-colors">
                                        <Sparkles size={20} />
                                    </div>
                                    <h4 className="text-white font-bold text-sm mb-1">New Evaluation</h4>
                                    <p className="text-white/40 text-[10px]">Start fresh with a different idea.</p>
                                </div>
                                <div className="mt-4 text-[10px] font-bold text-white/50 uppercase tracking-widest group-hover:text-white transition-colors">
                                    Start Over →
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Footer for Start New if not visible in grid */}
                    {onStartNew && onCommit && (
                        <div className="mt-6 text-center border-t border-white/5 pt-4">
                            <button
                                onClick={onStartNew}
                                className="text-[10px] text-white/30 hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto group"
                            >
                                <Sparkles size={12} className="group-hover:text-cyan-400 transition-colors" /> Start New Evaluation
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
