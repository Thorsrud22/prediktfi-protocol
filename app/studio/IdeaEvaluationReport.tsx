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
    const chartData = [
        { label: 'Technical', value: result.technical.feasibilityScore, fullMark: 100 },
        { label: 'Market', value: result.market.marketFitScore, fullMark: 100 },
        { label: 'Execution', value: 100 - (result.execution?.executionRiskScore || 50), fullMark: 100 }, // Invert risk for "Goodness" score
        { label: 'Tokenomics', value: result.tokenomics.designScore, fullMark: 100 },
        { label: 'Overall', value: result.overallScore, fullMark: 100 },
    ];

    const getScoreColor = (score: number) => {
        if (score >= 75) return 'text-green-500';
        if (score >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 75) return 'Strong Potential';
        if (score >= 50) return 'Watchlist';
        return 'High Risk / Pass';
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
            <div id="printable-report" className="bg-slate-900/95 border border-white/10 p-8 mb-6 relative overflow-visible group rounded-xl shadow-2xl text-white">
                {/* Removed decorative Activity icon - was distracting on hover */}

                <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-6 relative z-10 print:border-black/20">
                    <div>
                        <div className="text-[10px] text-blue-400 font-mono uppercase tracking-wider mb-2 flex items-center gap-2 print:text-blue-700">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse noprint"></span>
                            Analysis Complete
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2 print:text-black">{result.summary.title}</h1>
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
                            <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-2 print:text-gray-500">Overall Rating</div>
                            <div className="flex flex-col items-center md:items-end gap-2 border border-white/10 p-8 bg-white/[0.02] rounded-xl print:border-black/20 print:bg-gray-50">
                                <div className={`text-7xl font-black tracking-tighter ${getScoreColor(result.overallScore)} print:text-black`}>
                                    {result.overallScore}
                                </div>
                                <div className="text-center md:text-right">
                                    <div className={`text-xl font-bold ${getScoreColor(result.overallScore)} print:text-black`}>
                                        {getScoreLabel(result.overallScore)}
                                    </div>
                                    <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-1 print:text-gray-500">
                                        Confidence: High
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* VERDICT SUMMARY */}
                <div className="border border-white/10 bg-slate-900/95 p-8 mb-6 rounded-xl shadow-lg">
                    <div className="flex items-center gap-2 mb-4 text-white border-b border-white/10 pb-2">
                        <FileText size={18} className="text-blue-400" />
                        <h3 className="font-bold uppercase tracking-widest text-xs font-mono text-blue-100">Executive Summary</h3>
                    </div>
                    <p className="text-white/90 text-base leading-relaxed border-l-4 border-blue-500/50 pl-6 py-1 italic">
                        "{result.summary.mainVerdict}"
                    </p>
                </div>

                {/* REASONING CHAIN */}
                {result.reasoningSteps && result.reasoningSteps.length > 0 && (
                    <div className="border border-white/10 bg-black/40 p-6 mb-6 rounded-xl font-mono text-xs break-inside-avoid">
                        <div className="flex items-center gap-2 mb-4 text-white/60 border-b border-white/5 pb-2">
                            <Terminal size={14} />
                            <h3 className="font-bold uppercase tracking-widest">AI Reasoning Chain</h3>
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
                    <div className="border border-green-500/20 bg-green-500/[0.02] p-6 rounded-xl break-inside-avoid">
                        <div className="flex items-center gap-2 mb-4 text-green-400 border-b border-green-500/20 pb-2">
                            <Terminal size={18} />
                            <h3 className="font-bold uppercase tracking-widest text-xs font-mono">Market Signals</h3>
                        </div>
                        <ul className="space-y-3">
                            {(result.market?.competitorSignals ?? []).slice(0, 5).map((signal, i) => (
                                <li key={i} className="flex gap-3 text-green-200/90 text-sm leading-relaxed">
                                    <span className="text-green-500 font-mono">[+]</span>
                                    <span>{signal}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* RISK FACTORS */}
                    <div className="border border-red-500/20 bg-red-500/[0.02] p-6 rounded-xl break-inside-avoid">
                        <div className="flex items-center gap-2 mb-4 text-red-400 border-b border-red-500/20 pb-2">
                            <AlertTriangle size={18} />
                            <h3 className="font-bold uppercase tracking-widest text-xs font-mono">Critical Risks</h3>
                        </div>
                        <ul className="space-y-3">
                            {[...(result.technical?.keyRisks ?? []), ...(result.market?.goToMarketRisks ?? [])].slice(0, 5).map((con, i) => (
                                <li key={i} className="flex gap-3 text-red-200/90 text-sm leading-relaxed">
                                    <span className="text-red-500 font-mono">[!]</span>
                                    <span>{con}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* SECURITY & HEALTH CHECK */}
                {/* SECURITY & HEALTH CHECK */}
                {result.cryptoNativeChecks && (
                    <div className="border border-white/10 bg-slate-900/95 p-6 mb-6 rounded-xl break-inside-avoid">
                        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2 text-blue-400">
                                <Shield size={18} />
                                <h3 className="font-bold uppercase tracking-widest text-xs font-mono">Security Check</h3>
                            </div>
                            <div className="text-[10px] text-white/40 font-mono">v1.0.4</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                            <div className="flex justify-between items-center border-b border-white/5 py-3 hover:bg-white/5 px-3 transition-colors rounded-lg">
                                <span className="text-white/60 text-xs font-mono">Rug Pull Risk</span>
                                <span className={`text-xs font-bold uppercase font-mono ${result.cryptoNativeChecks.rugPullRisk === 'low' ? 'text-green-400' :
                                    result.cryptoNativeChecks.rugPullRisk === 'medium' ? 'text-yellow-400' : 'text-red-400'
                                    }`}>
                                    {result.cryptoNativeChecks.rugPullRisk}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 py-3 hover:bg-white/5 px-3 transition-colors rounded-lg">
                                <span className="text-white/60 text-xs font-mono">Audit Status</span>
                                <span className={`text-xs font-bold uppercase font-mono ${result.cryptoNativeChecks.auditStatus === 'audited' ? 'text-green-400' : 'text-yellow-400'
                                    }`}>
                                    {result.cryptoNativeChecks.auditStatus}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 py-3 hover:bg-white/5 px-3 transition-colors rounded-lg">
                                <span className="text-white/60 text-xs font-mono">Liquidity</span>
                                <span className={`text-xs font-bold uppercase font-mono ${result.cryptoNativeChecks.liquidityStatus === 'locked' || result.cryptoNativeChecks.liquidityStatus === 'burned' ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    {result.cryptoNativeChecks.liquidityStatus}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* EXECUTION SIGNALS */}
                {result.execution && (
                    <div className="border border-white/10 bg-slate-900/90 p-6 mb-8 rounded-xl break-inside-avoid">
                        <div className="flex items-center gap-2 mb-4 text-white border-b border-white/10 pb-2">
                            <CheckCircle2 size={18} />
                            <h3 className="font-bold uppercase tracking-widest text-xs font-mono">Execution Analysis</h3>
                        </div>
                        <div className="space-y-4">
                            {/* EXECUTION SIGNALS */}
                            <div className="space-y-1">
                                <div className="text-[10px] text-white/40 font-mono uppercase mb-2">Signals</div>
                                {result.execution?.executionSignals?.slice(0, 3)?.map((signal, i) => (
                                    <div key={i} className="flex gap-4 items-start opacity-70">
                                        <span className="text-blue-400 font-mono text-xs">{(i + 1).toString().padStart(2, '0')}</span>
                                        <p className="text-white/80 text-sm">{signal}</p>
                                    </div>
                                ))}
                            </div>

                            {/* MUST FIX */}
                            {(result.recommendations?.mustFixBeforeBuild ?? []).length > 0 && (
                                <div className="space-y-1 mt-4">
                                    <div className="text-[10px] text-red-400/60 font-mono uppercase mb-2 pt-2 border-t border-white/5">Critical Improvements</div>
                                    {(result.recommendations?.mustFixBeforeBuild ?? []).map((fix, i) => (
                                        <div key={i} className="flex gap-4 items-start">
                                            <span className="text-red-500 font-mono text-xs">!!</span>
                                            <p className="text-red-300 text-sm">{fix}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* VIRAL QUOTA INCENTIVE */}
                {!hideBonus && (
                    <div className="mb-6 p-6 rounded-xl border border-blue-500/30 bg-blue-500/[0.03] backdrop-blur-sm overflow-hidden relative group">
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
                <div className="flex flex-col md:flex-row gap-4 border-t border-white/10 pt-6 noprint">
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="flex-1 bg-transparent border border-white/20 text-white p-4 hover:bg-white/5 text-xs font-bold uppercase tracking-widest transition-all rounded-xl hover:border-white/40 flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} /> Refine Input
                        </button>
                    )}
                    {onStartNew && (
                        <button
                            onClick={onStartNew}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-transparent p-4 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold uppercase tracking-widest transition-all rounded-xl shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
                        >
                            New Evaluation <Sparkles size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
