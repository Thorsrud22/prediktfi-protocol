'use client';

import React from 'react';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';
import { AlertTriangle, Terminal, Shield, CheckCircle2, ArrowLeft, Sparkles, Activity, Download } from 'lucide-react';
import RadarChart from '../components/charts/RadarChart';
import { useSimplifiedWallet } from '../components/wallet/SimplifiedWalletProvider';
import { printElement } from '../utils/print';



interface IdeaEvaluationReportProps {
    result: IdeaEvaluationResult;
    onEdit?: () => void;
    onStartNew?: () => void;
}

export default function IdeaEvaluationReport({ result, onEdit, onStartNew }: IdeaEvaluationReportProps) {
    const { publicKey } = useSimplifiedWallet();

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
            <div id="printable-report" className="bg-slate-900 border border-white/5 p-8 mb-6 relative overflow-visible group rounded-3xl shadow-2xl text-white flex flex-col">
                {/* Removed decorative Activity icon - was distracting on hover */}

                {/* HEADER */}
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
                            <div className="text-xs text-white/20 mt-1 font-mono print:text-gray-400">ID: {(result.summary.title.length * result.overallScore).toString(16).toUpperCase().padStart(6, '0')}</div>
                        </div>
                        <button
                            onClick={handleDownloadPDF}
                            className="noprint flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-white/5"
                            title="Download PDF Report"
                        >
                            <Download size={14} /> PDF Report
                        </button>
                    </div>
                </div>

                {/* STRATEGIC ACTION PLAN & RISKS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* LEFT: ACTION PLAN (2/3) */}
                    <div className="lg:col-span-2 border border-blue-500/30 bg-blue-500/10 p-6 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-4 text-white border-b border-white/10 pb-3 relative z-10">
                            <CheckCircle2 size={18} className="text-blue-400" />
                            <h3 className="font-black uppercase tracking-[0.2em] italic text-[10px] text-blue-100">Immediate Action Plan</h3>
                        </div>

                        {(result.recommendations?.mustFixBeforeBuild ?? []).length > 0 ? (
                            <div className="space-y-3 relative z-10">
                                {(result.recommendations?.mustFixBeforeBuild ?? []).map((fix, i) => (
                                    <div key={i} className="flex gap-4 items-start group">
                                        <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-blue-500/40 flex items-center justify-center bg-black/20 group-hover:border-blue-400 transition-colors">
                                            <span className="text-[10px] font-black text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">✓</span>
                                        </div>
                                        <p className="text-white/90 text-sm leading-relaxed font-medium">{fix}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-white/60 italic text-sm">No critical blockers identified. Proceed to execution.</p>
                        )}

                        {/* Decorative background element */}
                        <div className="absolute -right-10 -bottom-10 opacity-5">
                            <CheckCircle2 size={200} />
                        </div>
                    </div>

                    {/* RIGHT: CRITICAL RISKS (1/3) */}
                    <div className="border border-slate-700/50 bg-slate-900/60 p-6 rounded-2xl shadow-lg flex flex-col">
                        <div className="flex items-center gap-2 mb-4 text-slate-400 border-b border-white/5 pb-3">
                            <AlertTriangle size={18} />
                            <h3 className="font-black uppercase tracking-[0.2em] italic text-[10px]">Threat Detection</h3>
                        </div>
                        <ul className="space-y-3 flex-1">
                            {[...(result.technical?.keyRisks ?? []), ...(result.market?.goToMarketRisks ?? [])].slice(0, 5).map((con, i) => (
                                <li key={i} className="flex gap-3 text-slate-300 text-xs leading-relaxed">
                                    <span className="text-red-500/50 font-mono font-black">•</span>
                                    <span>{con}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* DETAILED ANALYSIS GRID (Charts & Deep Dives) */}
                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10 mb-8 border-t border-white/5 pt-8">
                    {/* RADAR CHART (Moved Down) */}
                    <div className="w-full md:w-1/3 flex justify-center py-4">
                        <div className="relative w-[240px] h-[240px]">
                            <RadarChart data={chartData} width={240} height={240} className="w-full h-full" />
                        </div>
                    </div>

                    {/* MARKET SIGNALS */}
                    <div className="flex-1 w-full md:w-2/3">
                        <div className="border border-blue-500/20 bg-blue-500/5 p-6 rounded-2xl break-inside-avoid shadow-xl h-full">
                            <div className="flex items-center gap-2 mb-5 text-blue-400 border-b border-blue-500/10 pb-3">
                                <Terminal size={18} />
                                <h3 className="font-black uppercase tracking-[0.2em] italic text-[10px]">Market Intelligence</h3>
                            </div>
                            {/* Structured Competitors */}
                            {result.market?.competitors && result.market.competitors.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {result.market.competitors.slice(0, 4).map((comp, i) => (
                                        <div key={i} className="bg-black/20 p-3 rounded-lg border border-blue-500/10">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-blue-100 font-bold text-xs tracking-tight">{comp.name}</span>
                                                {comp.metrics?.funding && (
                                                    <span className="text-[9px] bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded font-mono">{comp.metrics.funding}</span>
                                                )}
                                            </div>
                                            <div className="flex gap-2 text-[10px] text-white/40 font-mono">
                                                {comp.metrics?.tvl && <span>TVL: {comp.metrics.tvl}</span>}
                                                {comp.metrics?.revenue && <span>• Rev: {comp.metrics.revenue}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {(result.market?.competitorSignals ?? []).slice(0, 5).map((signal, i) => (
                                        <li key={i} className="flex gap-3 text-blue-200/80 text-xs">
                                            <span className="text-blue-500">•</span>
                                            <span>{signal}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

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

                {/* REASONING CHAIN - MOVED DOWN BUT PRESERVED AS COLLAPSIBLE OR LESS PROMINENT IF NEEDED? keeping it for now but maybe less focus */}
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
