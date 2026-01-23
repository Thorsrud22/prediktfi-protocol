'use client';

import React from 'react';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';
import { AlertTriangle, Terminal, Shield, CheckCircle2, ArrowLeft, Sparkles, Activity, FileText, Gift, Loader2, Download } from 'lucide-react';
import RadarChart from '../components/charts/RadarChart';
import { useSimplifiedWallet } from '../components/wallet/SimplifiedWalletProvider';
import { printElement } from '../utils/print';

// Custom X (formerly Twitter) logo component
const XLogo = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

interface IdeaEvaluationReportProps {
    result: IdeaEvaluationResult;
    onEdit?: () => void;
    onStartNew?: () => void;
    hideBonus?: boolean;
}

export default function IdeaEvaluationReport({ result, onEdit, onStartNew, hideBonus }: IdeaEvaluationReportProps) {
    const { publicKey } = useSimplifiedWallet();
    const [isSharing, setIsSharing] = React.useState(false);
    const [bonusStatus, setBonusStatus] = React.useState<'idle' | 'claiming' | 'claimed' | 'error'>('idle');

    // Prepare Chart Data
    // Prepare Chart Data
    const chartData = React.useMemo(() => {
        const baseData = [
            { label: 'Technical', value: result.technical.feasibilityScore, fullMark: 100 },
            { label: 'Market', value: result.market.marketFitScore, fullMark: 100 },
            { label: 'Execution', value: 100 - (result.execution?.executionRiskScore || 50), fullMark: 100 },
        ];

        if (result.projectType === 'ai') {
            // For AI, Use AI Strategy Score (Average of sub-scores)
            const aiScore = result.aiStrategy
                ? Math.round((result.aiStrategy.modelQualityScore + result.aiStrategy.dataMoatScore + result.aiStrategy.userAcquisitionScore) / 3)
                : 50; // Fallback

            baseData.push({ label: 'AI Strategy', value: aiScore, fullMark: 100 });
        } else {
            baseData.push({ label: 'Tokenomics', value: result.tokenomics.designScore, fullMark: 100 });
        }

        baseData.push({ label: 'Overall', value: result.overallScore, fullMark: 100 });

        return baseData;
    }, [result]);

    const getScoreColor = (score: number) => {
        if (score >= 75) return 'text-cyan-400';
        if (score >= 50) return 'text-blue-400';
        return 'text-slate-400';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 75) return 'Strong Potential';
        if (score >= 50) return 'Watchlist';
        return 'High Risk / Pass';
    };

    const handleShareOnX = () => {
        const text = `I just evaluated my crypto idea "${result.summary.title}" on @PrediktFi and got a ${result.overallScore}/100 score! 🚀\n\nCheck out the full analysis:`;
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(shareUrl, '_blank');

        // Optimistically set status for visual feedback
        setBonusStatus('claiming');
        setTimeout(() => {
            setBonusStatus('claimed');
        }, 2000);
    };

    const handleDownloadPDF = () => {
        // Use the robust iframe print utility
        printElement('printable-report', `PrediktFi Evaluation - ${result.summary.title}`);
    };

    return (
        <div className="w-full max-w-4xl mx-auto font-sans text-sm leading-relaxed">
            {/* 
                We no longer need the aggressive @media print hacks because we print via an isolated iframe.
                However, we keep some basic utility classes in the markup (like noprint) which the iframe utility respects.
            */}
            <style jsx global>{`
                /* Simple utility to hide elements in the print view (iframe) */
                @media print {
                    .noprint {
                        display: none !important;
                    }
                }
            `}</style>
            {/* AUDIT LOG HEADER */}
            <div id="printable-report" className="bg-slate-900 border border-white/5 p-8 mb-6 relative overflow-visible group rounded-3xl shadow-2xl text-white">
                {/* Removed decorative Activity icon - was distracting on hover */}

                <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-6 relative z-10 print:border-black/20">
                    <div>
                        <div className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] italic mb-3 flex items-center gap-2 print:text-blue-700">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse noprint shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                            Analysis Complete
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter mb-2 print:text-black uppercase italic">{result.summary.title} <span className="text-blue-500">.</span></h1>
                        <p className="text-white/60 text-sm mt-1 max-w-lg leading-relaxed print:text-gray-600">
                            {result.summary.oneLiner}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="text-right hidden md:block print:block">
                            <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-1 print:text-gray-500">TIMESTAMP</div>
                            <div className="text-white text-xs font-mono print:text-black">{new Date().toISOString().split('T')[0]}</div>
                            <div className="text-xs text-white/20 mt-1 font-mono print:text-gray-400">ID: {Math.random().toString(36).substring(7).toUpperCase()}</div>
                        </div>

                        {/* Download Button (Hidden in Print) */}
                        <button
                            onClick={handleDownloadPDF}
                            className="noprint flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-white/5"
                            title="Download PDF Report"
                        >
                            <Download size={14} /> PDF Report
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
                    {/* RADAR CHART BLOCK */}
                    <div className="w-full md:w-1/2 flex justify-center">
                        <div className="relative w-[280px] h-[280px] md:w-[320px] md:h-[320px]">
                            <RadarChart data={chartData} width={320} height={320} className="w-full h-full" />
                        </div>
                    </div>

                    {/* TOTAL SCORE BLOCK */}
                    <div className="flex-1 w-full md:w-1/2 flex flex-col justify-center h-full pt-8">
                        <div className="text-center md:text-right">
                            <div className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] italic mb-3 print:text-gray-500">Overall Rating</div>
                            <div className="flex flex-col items-center md:items-end gap-2 border border-blue-500/20 p-8 bg-blue-500/5 rounded-2xl print:border-black/20 print:bg-gray-50">
                                <div className={`text-8xl font-black tracking-tighter ${getScoreColor(result.overallScore)} print:text-black italic`}>
                                    {result.overallScore}
                                </div>
                                <div className="text-center md:text-right">
                                    <div className={`text-xl font-black uppercase tracking-tight italic ${getScoreColor(result.overallScore)} print:text-black`}>
                                        {getScoreLabel(result.overallScore)}
                                    </div>
                                    <div className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] italic mt-2 print:text-gray-500">
                                        Confidence: High
                                    </div>
                                </div>

                                {/* Score Breakdown */}
                                <div className="mt-4 pt-4 border-t border-blue-500/10 w-full">
                                    <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2">
                                        <span>Contribution</span>
                                        <span>Points</span>
                                    </div>
                                    <div className="space-y-1.5 font-mono text-xs">
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span>Market (30%)</span>
                                            <span className="text-white">{Math.round(result.market.marketFitScore * 0.3)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span>Tech (25%)</span>
                                            <span className="text-white">{Math.round(result.technical.feasibilityScore * 0.25)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span>Execution (25%)</span>
                                            <span className="text-white">{Math.round((100 - (result.execution?.executionRiskScore || 50)) * 0.25)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span>Strategy (20%)</span>
                                            <span className="text-white">
                                                {result.projectType === 'ai'
                                                    ? Math.round(((result.aiStrategy?.modelQualityScore || 50) + (result.aiStrategy?.dataMoatScore || 50) + (result.aiStrategy?.userAcquisitionScore || 50)) / 3 * 0.2)
                                                    : Math.round(result.tokenomics.designScore * 0.20)
                                                }
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-blue-400 pt-1 border-t border-white/5 font-bold">
                                            <span>Modifiers</span>
                                            <span>
                                                {result.overallScore - (
                                                    Math.round(result.market.marketFitScore * 0.3) +
                                                    Math.round(result.technical.feasibilityScore * 0.25) +
                                                    Math.round((100 - (result.execution?.executionRiskScore || 50)) * 0.25) +
                                                    (result.projectType === 'ai'
                                                        ? Math.round(((result.aiStrategy?.modelQualityScore || 50) + (result.aiStrategy?.dataMoatScore || 50) + (result.aiStrategy?.userAcquisitionScore || 50)) / 3 * 0.2)
                                                        : Math.round(result.tokenomics.designScore * 0.20))
                                                ) > 0 ? '+' : ''}
                                                {result.overallScore - (
                                                    Math.round(result.market.marketFitScore * 0.3) +
                                                    Math.round(result.technical.feasibilityScore * 0.25) +
                                                    Math.round((100 - (result.execution?.executionRiskScore || 50)) * 0.25) +
                                                    (result.projectType === 'ai'
                                                        ? Math.round(((result.aiStrategy?.modelQualityScore || 50) + (result.aiStrategy?.dataMoatScore || 50) + (result.aiStrategy?.userAcquisitionScore || 50)) / 3 * 0.2)
                                                        : Math.round(result.tokenomics.designScore * 0.20))
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FATAL FLAW ALERT (RED TEAM) */}
                {result.fatalFlaw?.identified && (
                    <div className="mt-8 border border-red-500/50 bg-red-500/10 p-5 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                            <AlertTriangle size={64} className="text-red-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-red-400 mb-2">
                                <AlertTriangle size={20} />
                                <h3 className="font-black uppercase tracking-[0.2em] italic text-xs">Red Team Alert: Fatal Flaw Detected</h3>
                            </div>
                            <h4 className="text-xl font-bold text-red-200 mb-1">{result.fatalFlaw.flawTitle}</h4>
                            <p className="text-red-100/80 mb-3">{result.fatalFlaw.flawDescription}</p>
                            <div className="bg-red-950/50 p-3 rounded-lg border border-red-500/20 inline-block">
                                <span className="text-[10px] uppercase font-black text-red-400 block mb-1">Evidence</span>
                                <span className="text-sm font-mono text-red-200">{result.fatalFlaw.evidence}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* CALIBRATION AUDIT - SCORE TRANSPARENCY */}
                {result.calibrationNotes && result.calibrationNotes.length > 0 && (
                    <div className="border border-white/5 bg-slate-900/80 p-6 mb-6 rounded-2xl break-inside-avoid shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 opacity-50"></div>
                        <div className="flex items-center gap-2 mb-4 text-white/90 border-b border-white/5 pb-3">
                            <Activity size={18} className="text-purple-400" />
                            <h3 className="font-black uppercase tracking-[0.2em] italic text-[10px]">Score Calibration Audit</h3>
                        </div>
                        <div className="space-y-3">
                            {result.calibrationNotes.map((note, i) => {
                                const isNegative = note.toLowerCase().includes("minus") || note.toLowerCase().includes("penalty");
                                const isPositive = note.toLowerCase().includes("plus") || note.toLowerCase().includes("bonus");

                                return (
                                    <div key={i} className="flex gap-4 items-start text-sm">
                                        <div className={`mt-0.5 min-w-[20px] h-5 rounded flex items-center justify-center text-[10px] font-black uppercase ${isNegative ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                            isPositive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                'bg-slate-700 text-slate-400'
                                            }`}>
                                            {isNegative ? '-' : isPositive ? '+' : 'i'}
                                        </div>
                                        <p className={`${isNegative ? 'text-red-200/80' :
                                            isPositive ? 'text-emerald-200/80' :
                                                'text-slate-300'
                                            } leading-relaxed font-medium`}>
                                            {note}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-white/30 uppercase tracking-widest font-mono">
                            Deterministic Rules Applied v2.1
                        </div>
                    </div>
                )}

                {/* VERDICT SUMMARY */}
                <div className="border border-white/5 bg-slate-900 p-8 mb-6 rounded-2xl shadow-xl">
                    <div className="flex items-center gap-2 mb-5 text-white border-b border-white/10 pb-3">
                        <FileText size={18} className="text-blue-400" />
                        <h3 className="font-black uppercase tracking-[0.2em] italic text-[10px] text-blue-100">Executive Summary</h3>
                    </div>
                    <p className="text-white/90 text-base leading-relaxed border-l-4 border-blue-500/50 pl-6 py-1 italic">
                        "{result.summary.mainVerdict}"
                    </p>
                </div>

                {/* REASONING CHAIN */}
                {result.reasoningSteps && result.reasoningSteps.length > 0 && (
                    <div className="border border-white/5 bg-slate-900 p-6 mb-6 rounded-2xl font-mono text-xs break-inside-avoid shadow-xl">
                        <div className="flex items-center gap-2 mb-5 text-white/60 border-b border-white/5 pb-3">
                            <Terminal size={14} className="text-blue-400" />
                            <h3 className="font-black uppercase tracking-[0.2em] italic text-[10px]">AI Reasoning Chain</h3>
                        </div>
                        <ul className="space-y-2 text-white/70">
                            {(result.reasoningSteps ?? []).map((step, i) => (
                                <li key={i} className="flex gap-3">
                                    <span className="text-blue-500/50">{(i + 1).toString().padStart(2, '0')}.</span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* ANALYSIS BLOCKS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 print:grid-cols-1">
                    {/* MARKET & COMPETITION (Used as Signals) */}
                    <div className="border border-blue-500/20 bg-blue-500/5 p-6 rounded-2xl break-inside-avoid shadow-xl">
                        <div className="flex items-center gap-2 mb-5 text-blue-400 border-b border-blue-500/10 pb-3">
                            <Terminal size={18} />
                            <h3 className="font-black uppercase tracking-[0.2em] italic text-[10px]">Market Signals</h3>
                        </div>

                        {/* Structured Competitors (New) */}
                        {result.market?.competitors && result.market.competitors.length > 0 ? (
                            <div className="space-y-4">
                                {result.market.competitors.slice(0, 3).map((comp, i) => (
                                    <div key={i} className="bg-black/20 p-3 rounded-lg border border-blue-500/10 group hover:border-blue-500/30 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-blue-500/50 font-mono text-[10px] font-black">{(i + 1).toString().padStart(2, '0')}</span>
                                                <span className="text-blue-100 font-bold text-sm tracking-tight">{comp.name}</span>
                                            </div>
                                        </div>

                                        {/* Metrics Grid */}
                                        {comp.metrics && (
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                {comp.metrics.funding && comp.metrics.funding !== 'N/A' && (
                                                    <div className="bg-blue-500/5 px-2 py-1 rounded">
                                                        <span className="text-[9px] uppercase text-blue-400/60 font-black tracking-wider block">Raised</span>
                                                        <span className="text-xs text-blue-100 font-mono">{comp.metrics.funding}</span>
                                                    </div>
                                                )}
                                                {comp.metrics.tvl && comp.metrics.tvl !== 'N/A' && (
                                                    <div className="bg-blue-500/5 px-2 py-1 rounded">
                                                        <span className="text-[9px] uppercase text-blue-400/60 font-black tracking-wider block">TVL</span>
                                                        <span className="text-xs text-blue-100 font-mono">{comp.metrics.tvl}</span>
                                                    </div>
                                                )}
                                                {comp.metrics.revenue && comp.metrics.revenue !== 'N/A' && (
                                                    <div className="bg-blue-500/5 px-2 py-1 rounded">
                                                        <span className="text-[9px] uppercase text-blue-400/60 font-black tracking-wider block">Est. Rev</span>
                                                        <span className="text-xs text-blue-100 font-mono">{comp.metrics.revenue}</span>
                                                    </div>
                                                )}
                                                {comp.metrics.dailyUsers && comp.metrics.dailyUsers !== 'N/A' && (
                                                    <div className="bg-blue-500/5 px-2 py-1 rounded">
                                                        <span className="text-[9px] uppercase text-blue-400/60 font-black tracking-wider block">Users</span>
                                                        <span className="text-xs text-blue-100 font-mono">{comp.metrics.dailyUsers}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Fallback to legacy string list */
                            <ul className="space-y-3">
                                {(result.market?.competitorSignals ?? []).slice(0, 5).map((signal, i) => (
                                    <li key={i} className="flex gap-4 text-blue-200/90 text-sm leading-relaxed">
                                        <span className="text-blue-400 font-mono text-xs font-black">{(i + 1).toString().padStart(2, '0')}</span>
                                        <span>{signal}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* RISK FACTORS */}
                    <div className="border border-slate-700/50 bg-slate-900/60 p-6 rounded-2xl break-inside-avoid shadow-xl">
                        <div className="flex items-center gap-2 mb-5 text-slate-400 border-b border-white/5 pb-3">
                            <AlertTriangle size={18} />
                            <h3 className="font-black uppercase tracking-[0.2em] italic text-[10px]">Critical Risks</h3>
                        </div>
                        <ul className="space-y-3">
                            {[...(result.technical?.keyRisks ?? []), ...(result.market?.goToMarketRisks ?? [])].slice(0, 5).map((con, i) => (
                                <li key={i} className="flex gap-4 text-slate-300 text-sm leading-relaxed">
                                    <span className="text-blue-500/50 font-mono text-xs font-black">{(i + 1).toString().padStart(2, '0')}</span>
                                    <span>{con}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* SECURITY & HEALTH CHECK */}
                {/* SECURITY & HEALTH CHECK */}
                {result.cryptoNativeChecks && result.projectType !== 'ai' && (
                    <div className="border border-white/5 bg-slate-900 p-6 mb-6 rounded-2xl break-inside-avoid shadow-xl">
                        <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2 text-blue-400">
                                <Shield size={18} />
                                <h3 className="font-black uppercase tracking-[0.2em] italic text-[10px]">Security Check</h3>
                            </div>
                            <div className="text-[10px] text-white/20 font-mono font-black italic">v1.0.4</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                            <div className="flex justify-between items-center border-b border-white/5 py-3 hover:bg-white/5 px-4 transition-colors rounded-xl">
                                <span className="text-white/40 text-[10px] uppercase font-black tracking-widest italic">Rug Pull Risk</span>
                                <span className={`text-[10px] font-black uppercase italic ${result.cryptoNativeChecks.rugPullRisk === 'low' ? 'text-cyan-400' :
                                    result.cryptoNativeChecks.rugPullRisk === 'medium' ? 'text-blue-400' : 'text-slate-400'
                                    }`}>
                                    {result.cryptoNativeChecks.rugPullRisk}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 py-3 hover:bg-white/5 px-4 transition-colors rounded-xl">
                                <span className="text-white/40 text-[10px] uppercase font-black tracking-widest italic">Audit Status</span>
                                <span className={`text-[10px] font-black uppercase italic ${result.cryptoNativeChecks.auditStatus === 'audited' ? 'text-cyan-400' : 'text-blue-400'
                                    }`}>
                                    {result.cryptoNativeChecks.auditStatus}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 py-3 hover:bg-white/5 px-4 transition-colors rounded-xl">
                                <span className="text-white/40 text-[10px] uppercase font-black tracking-widest italic">Liquidity</span>
                                <span className={`text-[10px] font-black uppercase italic ${result.cryptoNativeChecks.liquidityStatus === 'locked' || result.cryptoNativeChecks.liquidityStatus === 'burned' ? 'text-cyan-400' : 'text-slate-400'
                                    }`}>
                                    {result.cryptoNativeChecks.liquidityStatus}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI STRATEGY DEEP DIVE */}
                {result.projectType === 'ai' && result.aiStrategy && (
                    <div className="border border-white/5 bg-slate-900 p-6 mb-6 rounded-2xl break-inside-avoid shadow-xl">
                        <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2 text-cyan-400">
                                <Sparkles size={18} />
                                <h3 className="font-black uppercase tracking-[0.2em] italic text-[10px]">AI Strategy Core</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                            <div>
                                <div className="text-[10px] text-white/40 font-black uppercase tracking-widest italic mb-1">Model Quality</div>
                                <div className={`text-2xl font-black italic ${getScoreColor(result.aiStrategy.modelQualityScore)}`}>
                                    {result.aiStrategy.modelQualityScore}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-white/40 font-black uppercase tracking-widest italic mb-1">Data Moat</div>
                                <div className={`text-2xl font-black italic ${getScoreColor(result.aiStrategy.dataMoatScore)}`}>
                                    {result.aiStrategy.dataMoatScore}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-white/40 font-black uppercase tracking-widest italic mb-1">Acquisition</div>
                                <div className={`text-2xl font-black italic ${getScoreColor(result.aiStrategy.userAcquisitionScore)}`}>
                                    {result.aiStrategy.userAcquisitionScore}
                                </div>
                            </div>
                        </div>

                        {(result.aiStrategy.notes?.length > 0) && (
                            <ul className="space-y-2">
                                {result.aiStrategy.notes.map((note, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-white/70">
                                        <span className="text-cyan-500/50">•</span>
                                        <span>{note}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* EXECUTION SIGNALS */}
                {result.execution && (
                    <div className="border border-white/5 bg-slate-900 p-6 mb-8 rounded-2xl break-inside-avoid shadow-xl">
                        <div className="flex items-center gap-2 mb-5 text-white border-b border-white/10 pb-3">
                            <CheckCircle2 size={18} className="text-blue-400" />
                            <h3 className="font-black uppercase tracking-[0.2em] italic text-[10px]">Execution Analysis</h3>
                        </div>
                        <div className="space-y-6">
                            {/* EXECUTION SIGNALS */}
                            <div className="space-y-3">
                                <div className="text-[10px] text-white/20 font-black uppercase tracking-widest italic mb-3">Signals</div>
                                {result.execution?.executionSignals?.slice(0, 3)?.map((signal, i) => (
                                    <div key={i} className="flex gap-4 items-start opacity-70">
                                        <span className="text-blue-400 font-mono text-xs font-black">{(i + 1).toString().padStart(2, '0')}</span>
                                        <p className="text-white/80 text-sm leading-relaxed">{signal}</p>
                                    </div>
                                ))}
                            </div>

                            {/* MUST FIX */}
                            {(result.recommendations?.mustFixBeforeBuild ?? []).length > 0 && (
                                <div className="space-y-3 mt-4">
                                    <div className="text-[10px] text-blue-400/30 font-black uppercase tracking-widest italic mb-3 pt-4 border-t border-white/5">Strategic Improvements</div>
                                    {(result.recommendations?.mustFixBeforeBuild ?? []).map((fix, i) => (
                                        <div key={i} className="flex gap-4 items-start">
                                            <span className="text-blue-400 font-mono text-xs font-black">{(i + 1).toString().padStart(2, '0')}</span>
                                            <p className="text-blue-200/80 text-sm leading-relaxed">{fix}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* VIRAL QUOTA INCENTIVE */}
                {!hideBonus && (
                    <div className="mb-6 p-6 rounded-xl border border-blue-500/30 bg-blue-500/[0.05] overflow-hidden relative group">
                        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity text-white">
                            <XLogo size={100} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <Gift className="text-yellow-400" size={20} />
                                <h3 className="text-lg font-bold text-white">Unlock Bonus Evaluation</h3>
                            </div>
                            <p className="text-blue-100/70 text-sm mb-4 max-w-xl">
                                Share your results on X to support the protocol and get <span className="text-blue-400 font-bold">+1 extra credit</span> instantly.
                            </p>

                            {bonusStatus === 'idle' ? (
                                <button
                                    onClick={handleShareOnX}
                                    className="inline-flex items-center gap-2 bg-white text-black hover:bg-slate-200 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 shadow-lg shadow-white/10"
                                >
                                    <XLogo size={16} /> Share on X to Unlock
                                </button>
                            ) : bonusStatus === 'claiming' ? (
                                <button className="inline-flex items-center gap-2 bg-slate-800 text-slate-400 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider cursor-wait border border-slate-700">
                                    <Loader2 className="animate-spin" size={16} /> Verifying Share...
                                </button>
                            ) : bonusStatus === 'claimed' ? (
                                <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 border border-green-500/30 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                    <CheckCircle2 size={16} /> +1 Evaluation Credit Added
                                </div>
                            ) : (
                                <button
                                    onClick={handleShareOnX}
                                    className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 border border-red-500/30 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider"
                                >
                                    <AlertTriangle size={16} /> Claiming Failed - Try Again
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="flex flex-col md:flex-row gap-4 border-t border-white/5 pt-8 noprint">
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="flex-1 bg-white/5 border border-white/10 text-white p-5 hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] italic transition-all rounded-2xl flex items-center justify-center gap-3 active:scale-95"
                        >
                            <ArrowLeft size={16} /> Refine Input
                        </button>
                    )}
                    {onStartNew && (
                        <button
                            onClick={onStartNew}
                            className="flex-1 bg-blue-600 text-white border border-transparent p-5 hover:bg-blue-500 text-[10px] font-black uppercase tracking-[0.2em] italic transition-all rounded-2xl shadow-lg shadow-blue-900/40 flex items-center justify-center gap-3 active:scale-95"
                        >
                            New Evaluation <Sparkles size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
