import { Shield } from 'lucide-react';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';

interface TrustPanelProps {
    result: IdeaEvaluationResult;
    evidenceCoveragePct: number;
}

export function TrustPanel({ result, evidenceCoveragePct }: TrustPanelProps) {
    const modelRoute = result.meta?.modelRoute;
    const trustDataFreshness = result.meta?.dataFreshness || result.evidence?.generatedAt || null;
    const confidenceReasons = result.meta?.confidenceReasons || [];

    return (
        <div className="border border-emerald-900/40 bg-[#071a13] p-6 rounded-2xl mb-8">
            <div className="flex items-center gap-2 mb-4 text-emerald-300 border-b border-emerald-500/10 pb-3">
                <Shield size={18} />
                <h3 className="font-bold uppercase tracking-[0.2em] text-xs">Why Trust This Evaluation</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="bg-black/20 border border-white/5 rounded-xl p-3">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Evidence Coverage</div>
                    <div className="text-sm font-bold text-emerald-300">{evidenceCoveragePct}%</div>
                </div>
                <div className="bg-black/20 border border-white/5 rounded-xl p-3">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Confidence</div>
                    <div className={`text-sm font-bold uppercase ${result.meta?.confidenceLevel === 'high'
                        ? 'text-emerald-300'
                        : result.meta?.confidenceLevel === 'medium'
                            ? 'text-amber-300'
                            : 'text-red-300'
                        }`}>
                        {result.meta?.confidenceLevel || result.confidenceLevel || 'unknown'}
                    </div>
                </div>
                <div className="bg-black/20 border border-white/5 rounded-xl p-3">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Debate Tension</div>
                    <div className="text-sm font-bold text-white">
                        {typeof result.meta?.debateDisagreementIndex === 'number'
                            ? `${result.meta?.debateDisagreementIndex}/100`
                            : 'N/A'}
                    </div>
                </div>
                <div className="bg-black/20 border border-white/5 rounded-xl p-3">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Verifier</div>
                    <div className={`text-sm font-bold uppercase ${result.meta?.verifierStatus === 'pass'
                        ? 'text-emerald-300'
                        : result.meta?.verifierStatus === 'soft_fail'
                            ? 'text-amber-300'
                            : result.meta?.verifierStatus === 'hard_fail'
                                ? 'text-red-300'
                                : 'text-white/70'
                        }`}>
                        {result.meta?.verifierStatus || 'n/a'}
                    </div>
                </div>
                <div className="bg-black/20 border border-white/5 rounded-xl p-3">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Data Freshness</div>
                    <div className="text-sm font-bold text-white">
                        {trustDataFreshness ? new Date(trustDataFreshness).toISOString().replace('T', ' ').slice(0, 16) : 'N/A'}
                    </div>
                </div>
            </div>

            {modelRoute && (
                <div className="mb-4">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Model Route</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
                        <div className="bg-black/20 rounded px-2 py-1 text-white/70">Bear: {modelRoute.bear}</div>
                        <div className="bg-black/20 rounded px-2 py-1 text-white/70">Bull: {modelRoute.bull}</div>
                        <div className="bg-black/20 rounded px-2 py-1 text-white/70">Scout: {modelRoute.competitive}</div>
                        <div className="bg-black/20 rounded px-2 py-1 text-white/70">Judge: {modelRoute.judge}</div>
                        <div className="bg-black/20 rounded px-2 py-1 text-white/70">Backup: {modelRoute.judgeFallback}</div>
                        <div className="bg-black/20 rounded px-2 py-1 text-white/70">Verifier: {modelRoute.verifier}</div>
                    </div>
                </div>
            )}

            {confidenceReasons.length > 0 && (
                <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Reliability Notes</div>
                    <ul className="space-y-1">
                        {confidenceReasons.slice(0, 4).map((reason, idx) => (
                            <li key={idx} className="text-xs text-emerald-100/80 flex gap-2">
                                <span className="text-emerald-400">•</span>
                                <span>{reason}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
