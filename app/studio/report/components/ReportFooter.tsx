import { Sparkles, Check, Link as LinkIcon, ArrowLeft, Shield, CircleCheck as CheckCircle2 } from 'lucide-react';
import { useShareReport } from '../hooks/useShareReport';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';

interface ReportFooterProps {
    result: IdeaEvaluationResult;
    evalId?: string | null;
    onEdit?: () => void;
    onCommit?: () => void;
    commitStatus?: 'idle' | 'committing' | 'success' | 'error';
    onStartNew?: () => void;
}

export function ReportFooter({ result, evalId, onEdit, onCommit, commitStatus = 'idle', onStartNew }: ReportFooterProps) {
    const { copied, handleCopyLink, handleShare } = useShareReport(result, evalId);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* 1. Share (Primary) */}
            <div className="md:col-span-2 p-6 bg-[#0B1221] border border-blue-500/30 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-blue-900/10 relative overflow-hidden">
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
                        className={`flex-1 md:flex-none px-6 py-3 border text-xs font-bold uppercase tracking-[0.2em] transition-all rounded-xl flex items-center justify-center gap-2 active:scale-95 ${copied
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
                        className="flex-1 md:flex-none px-6 py-3 bg-white text-black hover:bg-gray-200 border-transparent text-xs font-bold uppercase tracking-[0.2em] transition-all rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95"
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
                    className="group p-5 bg-[#1e293b] border border-white/10 rounded-xl hover:border-white/20 transition-all text-left flex flex-col justify-between h-full min-h-[140px]"
                >
                    <div>
                        <div className="flex items-center justify-between mb-3 text-white/60 group-hover:text-blue-400 transition-colors">
                            <ArrowLeft size={20} />
                        </div>
                        <h4 className="text-white font-bold text-sm mb-1">Refine Input</h4>
                        <p className="text-white/40 text-xs">Tweak your pitch details to improve your score.</p>
                    </div>
                    <div className="mt-4 text-xs font-bold text-white/50 uppercase tracking-widest group-hover:text-white transition-colors">
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
                        ? 'bg-[#021810] border-emerald-500/30 cursor-default'
                        : 'bg-[#1e293b] border-white/10 hover:border-white/20'
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
                        <p className={`text-xs ${commitStatus === 'success' ? 'text-emerald-400/60' : 'text-white/40'}`}>
                            {commitStatus === 'success'
                                ? 'Immutably recorded on Solana.'
                                : 'Record this evaluation on-chain. Requires wallet.'}
                        </p>
                    </div>

                    <div className={`mt-4 text-xs font-bold uppercase tracking-widest transition-colors relative z-10 flex items-center gap-2 ${commitStatus === 'success' ? 'text-emerald-500' : 'text-white/50 group-hover:text-white'
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
                    className="group p-5 bg-[#1e293b] border border-white/10 rounded-xl hover:border-white/20 transition-all text-left flex flex-col justify-between h-full min-h-[140px]"
                >
                    <div>
                        <div className="flex items-center justify-between mb-3 text-white/60 group-hover:text-blue-400 transition-colors">
                            <Sparkles size={20} />
                        </div>
                        <h4 className="text-white font-bold text-sm mb-1">New Evaluation</h4>
                        <p className="text-white/40 text-xs">Start fresh with a different idea.</p>
                    </div>
                    <div className="mt-4 text-xs font-bold text-white/50 uppercase tracking-widest group-hover:text-white transition-colors">
                        Start Over →
                    </div>
                </button>
            )}
        </div>
    );
}
