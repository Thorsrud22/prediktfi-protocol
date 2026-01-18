'use client';

import React from 'react';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';
import { AlertTriangle, Terminal, Shield, CheckCircle2, ArrowLeft, Sparkles, Activity, FileText } from 'lucide-react';

interface IdeaEvaluationReportProps {
    result: IdeaEvaluationResult;
    onEdit?: () => void;
    onStartNew?: () => void;
}

export default function IdeaEvaluationReport({ result, onEdit, onStartNew }: IdeaEvaluationReportProps) {
    // ----------------------------------------------------------------
    // TERMINAL STYLE HELPERS
    // ----------------------------------------------------------------
    const getScoreColor = (score: number) => {
        if (score >= 75) return 'text-green-500';
        if (score >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 75) return 'BUY / LONG';
        if (score >= 50) return 'HOLD / WATCH';
        return 'SELL / PASS';
    };

    if (!result) return null;

    return (
        <div className="w-full max-w-4xl mx-auto font-sans text-sm leading-relaxed">
            {/* AUDIT LOG HEADER */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 p-8 mb-6 relative overflow-hidden group rounded-xl shadow-2xl">
                <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
                    <Activity size={120} />
                </div>

                <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-6 relative z-10">
                    <div>
                        <div className="text-[10px] text-blue-400 font-mono uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            EVALUATION_COMPLETE
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{result.summary.title}</h1>
                        <p className="text-white/60 text-sm mt-1 max-w-lg leading-relaxed">
                            {result.summary.oneLiner}
                        </p>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-1">TIMESTAMP</div>
                        <div className="text-white text-xs font-mono">{new Date().toISOString().split('T')[0]}</div>
                        <div className="text-xs text-white/20 mt-1 font-mono">ID: {Math.random().toString(36).substring(7).toUpperCase()}</div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
                    {/* TOTAL SCORE BLOCK */}
                    <div className="flex-1 w-full">
                        <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-2">
                            AGGREGATE_SCORE
                        </div>
                        <div className="flex items-end gap-6 border border-white/10 p-6 bg-white/[0.02] rounded-xl backdrop-blur-sm">
                            <div className={`text-7xl font-black tracking-tighter ${getScoreColor(result.overallScore)}`}>
                                {result.overallScore}
                            </div>
                            <div className="mb-2">
                                <div className={`text-xl font-bold ${getScoreColor(result.overallScore)}`}>
                                    {getScoreLabel(result.overallScore)}
                                </div>
                                <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest">
                                    CONFIDENCE: HIGH
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* VERDICT SUMMARY */}
            <div className="border border-white/10 bg-slate-900/50 backdrop-blur-md p-8 mb-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 mb-4 text-white border-b border-white/10 pb-2">
                    <FileText size={18} className="text-blue-400" />
                    <h3 className="font-bold uppercase tracking-widest text-xs font-mono text-blue-100">EXECUTIVE_SUMMARY</h3>
                </div>
                <p className="text-white/90 text-base leading-relaxed border-l-4 border-blue-500/50 pl-6 py-1 italic">
                    "{result.summary.mainVerdict}"
                </p>
            </div>

            {/* ANALYSIS BLOCKS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* MARKET & COMPETITION (Used as Signals) */}
                <div className="border border-green-500/20 bg-green-500/[0.02] p-6 rounded-xl">
                    <div className="flex items-center gap-2 mb-4 text-green-400 border-b border-green-500/20 pb-2">
                        <Terminal size={18} />
                        <h3 className="font-bold uppercase tracking-widest text-xs font-mono">MARKET_SIGNALS</h3>
                    </div>
                    <ul className="space-y-3">
                        {result.market.competitorSignals.slice(0, 5).map((signal, i) => (
                            <li key={i} className="flex gap-3 text-green-200/90 text-sm leading-relaxed">
                                <span className="text-green-500 font-mono">[+]</span>
                                <span>{signal}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* RISK FACTORS */}
                <div className="border border-red-500/20 bg-red-500/[0.02] p-6 rounded-xl">
                    <div className="flex items-center gap-2 mb-4 text-red-400 border-b border-red-500/20 pb-2">
                        <AlertTriangle size={18} />
                        <h3 className="font-bold uppercase tracking-widest text-xs font-mono">CRITICAL_RISKS</h3>
                    </div>
                    <ul className="space-y-3">
                        {[...result.technical.keyRisks, ...result.market.goToMarketRisks].slice(0, 5).map((con, i) => (
                            <li key={i} className="flex gap-3 text-red-200/90 text-sm leading-relaxed">
                                <span className="text-red-500 font-mono">[!]</span>
                                <span>{con}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* SECURITY & HEALTH CHECK */}
            {result.cryptoNativeChecks && (
                <div className="border border-white/10 bg-slate-900/80 backdrop-blur-xl p-6 mb-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2 text-blue-400">
                            <Shield size={18} />
                            <h3 className="font-bold uppercase tracking-widest text-xs font-mono">SECURITY_AUDIT_LOG</h3>
                        </div>
                        <div className="text-[10px] text-white/40 font-mono">v1.0.4</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                        <div className="flex justify-between items-center border-b border-white/5 py-3 hover:bg-white/5 px-3 transition-colors rounded-lg">
                            <span className="text-white/60 text-xs font-mono">RUG_PULL_RISK</span>
                            <span className={`text-xs font-bold uppercase font-mono ${result.cryptoNativeChecks.rugPullRisk === 'low' ? 'text-green-400' :
                                result.cryptoNativeChecks.rugPullRisk === 'medium' ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                {result.cryptoNativeChecks.rugPullRisk}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 py-3 hover:bg-white/5 px-3 transition-colors rounded-lg">
                            <span className="text-white/60 text-xs font-mono">AUDIT_STATUS</span>
                            <span className={`text-xs font-bold uppercase font-mono ${result.cryptoNativeChecks.auditStatus === 'audited' ? 'text-green-400' : 'text-yellow-400'
                                }`}>
                                {result.cryptoNativeChecks.auditStatus}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 py-3 hover:bg-white/5 px-3 transition-colors rounded-lg">
                            <span className="text-white/60 text-xs font-mono">LIQUIDITY_STATUS</span>
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
                <div className="border border-white/10 bg-slate-900/30 backdrop-blur-md p-6 mb-8 rounded-xl">
                    <div className="flex items-center gap-2 mb-4 text-white border-b border-white/10 pb-2">
                        <CheckCircle2 size={18} />
                        <h3 className="font-bold uppercase tracking-widest text-xs font-mono">EXECUTION_SIGNALS & FIXES</h3>
                    </div>
                    <div className="space-y-4">
                        {/* EXECUTION SIGNALS */}
                        <div className="space-y-1">
                            <div className="text-[10px] text-white/40 font-mono uppercase mb-2">SIGNALS</div>
                            {result.execution.executionSignals.slice(0, 3).map((signal, i) => (
                                <div key={i} className="flex gap-4 items-start opacity-70">
                                    <span className="text-blue-400 font-mono text-xs">{(i + 1).toString().padStart(2, '0')}</span>
                                    <p className="text-white/80 text-sm">{signal}</p>
                                </div>
                            ))}
                        </div>

                        {/* MUST FIX */}
                        {result.recommendations.mustFixBeforeBuild.length > 0 && (
                            <div className="space-y-1 mt-4">
                                <div className="text-[10px] text-red-400/60 font-mono uppercase mb-2 pt-2 border-t border-white/5">MUST_FIX_IMMEDIATELY</div>
                                {result.recommendations.mustFixBeforeBuild.map((fix, i) => (
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

            {/* ACTION BUTTONS */}
            <div className="flex flex-col md:flex-row gap-4 border-t border-white/10 pt-6">
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="flex-1 bg-transparent border border-white/20 text-white p-4 hover:bg-white/5 text-xs font-bold uppercase tracking-widest transition-all rounded-xl hover:border-white/40 flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={16} /> Refine_Input
                    </button>
                )}
                {onStartNew && (
                    <button
                        onClick={onStartNew}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-transparent p-4 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold uppercase tracking-widest transition-all rounded-xl shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
                    >
                        New_Evaluation <Sparkles size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}
