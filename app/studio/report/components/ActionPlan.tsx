import { CircleCheck as CheckCircle2 } from 'lucide-react';

interface ActionPlanProps {
    recommendations?: string[];
}

export function ActionPlan({ recommendations = [] }: ActionPlanProps) {
    return (
        <div data-testid="action-plan" className="border border-blue-900/30 bg-[#0f172a] p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4 text-white border-b border-white/10 pb-3">
                <CheckCircle2 size={18} className="text-blue-400" />
                <h3 className="font-bold uppercase tracking-[0.2em] text-xs text-blue-100">Immediate Action Plan</h3>
            </div>

            {recommendations.length > 0 ? (
                <div className="space-y-4">
                    {recommendations.map((fix, i) => (
                        <div key={i} className="flex gap-4 items-start group">
                            <div className="mt-0.5 min-w-[24px] h-6 rounded-full border-2 border-blue-500/40 flex items-center justify-center bg-black/20 text-xs font-bold text-blue-400">
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
    );
}
