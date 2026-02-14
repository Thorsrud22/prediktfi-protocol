import { Terminal } from 'lucide-react';

interface AiReasoningProps {
    reasoningSteps?: string[];
}

export function AiReasoning({ reasoningSteps }: AiReasoningProps) {
    if (!reasoningSteps || reasoningSteps.length === 0) return null;

    return (
        <details className="border border-white/5 bg-slate-900 rounded-2xl mb-6 group">
            <summary className="p-6 cursor-pointer flex items-center gap-2 text-white/60 hover:text-white transition-colors list-none">
                <Terminal size={14} className="text-blue-400" />
                <span className="font-bold uppercase tracking-[0.2em] text-xs">AI Reasoning Chain</span>
                <span className="text-[10px] text-white/30 ml-auto group-open:hidden">Click to expand</span>
                <span className="text-[10px] text-white/30 ml-auto hidden group-open:inline">Click to collapse</span>
            </summary>
            <div className="px-6 pb-6">
                <ul className="space-y-2 text-white/70 font-mono text-xs">
                    {reasoningSteps.map((step, i) => (
                        <li key={i} className="flex gap-3">
                            <span className="text-blue-500/50">{(i + 1).toString().padStart(2, '0')}.</span>
                            <span>{step}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </details>
    );
}
