import { Download, Link as LinkIcon, Check, Copy } from 'lucide-react';
import { printElement } from '../../../utils/print';
import { useShareReport } from '../hooks/useShareReport';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';

interface HeaderProps {
    result: IdeaEvaluationResult;
    evalId?: string | null;
}

export function Header({ result, evalId }: HeaderProps) {
    const { copied, handleCopyLink, handleShare } = useShareReport(result, evalId);

    const title = result.summary.title;
    const fallbackUsed = result.meta?.fallbackUsed;

    const handleDownloadPDF = () => {
        printElement('printable-report', `PrediktFi Evaluation - ${title}`);
    };

    return (
        <div data-testid="report-header" className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-white/5 -mx-6 -mt-6 px-6 py-4 mb-8 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-xs text-white/60 font-bold uppercase tracking-[0.2em]">Analysis Complete</span>
            </div>
            <div className="flex items-center gap-4">
                {fallbackUsed && (
                    <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300">
                        Backup Judge Used
                    </span>
                )}
                <span className="text-xs text-white/50 font-mono hidden sm:block">{new Date().toISOString().split('T')[0]}</span>

                {/* COPY LINK */}
                <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-white/5 active:scale-95 group"
                    title="Copy Share Link"
                >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <LinkIcon size={14} className="group-hover:text-blue-400 transition-colors" />}
                    <span className="hidden sm:inline">Link</span>
                </button>

                {/* SHARE ON X */}
                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-white/5 active:scale-95 group"
                    title="Share on X"
                >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current group-hover:text-white transition-colors">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span className="hidden sm:inline">Share</span>
                </button>

                {/* DOWNLOAD PDF */}
                <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-white/5 active:scale-95"
                    title="Print or Save as PDF"
                >
                    <Download size={14} /> <span className="hidden sm:inline">PDF</span>
                </button>
            </div>
        </div>
    );
}
