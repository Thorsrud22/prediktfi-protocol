import { Sparkles } from 'lucide-react';
import { ScoreTooltip } from './ScoreTooltip';
import { getScoreColor } from '../utils';

interface AiStrategyPanelProps {
    aiStrategy: {
        modelQualityScore: number;
        modelQualityComment?: string;
        dataMoatScore: number;
        dataMoatComment?: string;
        userAcquisitionScore: number;
        userAcquisitionComment?: string;
    };
}

export function AiStrategyPanel({ aiStrategy }: AiStrategyPanelProps) {
    return (
        <div data-testid="ai-strategy-panel" className="border border-purple-900/30 bg-[#1a1025] p-6 rounded-2xl mb-8">
            <div className="flex items-center gap-2 mb-5 text-purple-300 border-b border-purple-500/10 pb-3">
                <Sparkles size={18} />
                <h3 className="font-bold uppercase tracking-[0.2em] text-xs">AI Strategy Deep Dive</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        label: 'Model Quality',
                        score: aiStrategy.modelQualityScore,
                        comment: aiStrategy.modelQualityComment,
                        tooltip: "Architecture & capability. Improve: Use specialized models (fine-tuned LLaMA/Mistral) over generic wrappers."
                    },
                    {
                        label: 'Data Moat',
                        score: aiStrategy.dataMoatScore,
                        comment: aiStrategy.dataMoatComment,
                        tooltip: "Exclusivity of training data. Improve: Integrate unique data loops or exclusive partnerships."
                    },
                    {
                        label: 'Acquisition',
                        score: aiStrategy.userAcquisitionScore,
                        comment: aiStrategy.userAcquisitionComment,
                        tooltip: "User growth & feedback loops. Improve: Define clear distribution channels beyond 'organic'."
                    },
                ].map((item, idx) => (
                    <div key={idx} className="flex flex-col">
                        <ScoreTooltip label={item.label} text={item.tooltip}>
                            <div className="text-xs text-white/40 font-bold uppercase tracking-widest mb-1 hover:text-blue-400 cursor-help border-b border-dashed border-white/10 w-fit transition-colors">
                                {item.label}
                            </div>
                        </ScoreTooltip>
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
    );
}
