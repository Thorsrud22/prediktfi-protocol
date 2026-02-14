import { Terminal } from 'lucide-react';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';

interface MarketIntelligenceProps {
    market?: IdeaEvaluationResult['market'];
}

export function MarketIntelligence({ market }: MarketIntelligenceProps) {
    // Helper to check if a value is "real" data
    const hasValue = (v?: string | null) => v && v !== 'N/A' && v !== '-' && v !== 'unknown' && v.trim() !== '';

    // Filter competitors with at least one real metric
    const competitorsWithData = (market?.competitors || []).filter(comp => {
        const m = comp.metrics;
        if (!m) return false;
        return hasValue(m.marketCap) || hasValue(m.tvl) || hasValue(m.dailyUsers) || hasValue(m.funding) || hasValue(m.revenue);
    });

    return (
        <div data-testid="market-intelligence" className="border border-blue-900/30 bg-[#0f172a] p-6 rounded-2xl mb-8" style={{ contain: 'layout style' }}>
            <div className="flex items-center gap-2 mb-5 text-blue-400 border-b border-blue-500/10 pb-3">
                <Terminal size={18} />
                <h3 className="font-bold uppercase tracking-[0.2em] text-xs">Market Intelligence</h3>
            </div>

            {(() => {
                if (competitorsWithData.length > 0) {
                    return (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-left text-white/40 uppercase tracking-widest text-[10px] border-b border-white/5">
                                        <th className="pb-2 pr-4">Competitor</th>
                                        <th className="pb-2 pr-4">MCap/TVL</th>
                                        <th className="pb-2 pr-4">Users</th>
                                        <th className="pb-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {competitorsWithData.slice(0, 4).map((comp, i) => {
                                        const primaryMetric =
                                            hasValue(comp.metrics?.marketCap) ? comp.metrics!.marketCap :
                                                hasValue(comp.metrics?.tvl) ? comp.metrics!.tvl :
                                                    hasValue(comp.metrics?.funding) ? comp.metrics!.funding : '—';

                                        const users = hasValue(comp.metrics?.dailyUsers) ? comp.metrics!.dailyUsers : '—';

                                        return (
                                            <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="py-2 pr-4 text-blue-100 font-bold">{comp.name}</td>
                                                <td className="py-2 pr-4 text-white/60 font-mono">{primaryMetric}</td>
                                                <td className="py-2 pr-4 text-white/60 font-mono">{users}</td>
                                                <td className="py-2">
                                                    <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded font-mono">
                                                        Active
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                } else if ((market?.competitorSignals ?? []).length > 0) {
                    // Fallback to competitor signals if no structured data
                    return (
                        <ul className="space-y-2">
                            {(market?.competitorSignals ?? []).slice(0, 5).map((signal, i) => (
                                <li key={i} className="flex gap-3 text-blue-200/80 text-xs">
                                    <span className="text-blue-500">•</span>
                                    <span>{signal}</span>
                                </li>
                            ))}
                        </ul>
                    );
                } else {
                    // No real data available
                    return (
                        <p className="text-white/40 text-xs italic">
                            Competitive landscape data not available for this category. Consider providing a token address or more project details.
                        </p>
                    );
                }
            })()}
        </div>
    );
}
