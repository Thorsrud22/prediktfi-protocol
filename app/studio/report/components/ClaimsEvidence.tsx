import { Terminal } from 'lucide-react';

interface ClaimsEvidenceProps {
    claimEvidenceRows: any[]; // define proper type
}

export function ClaimsEvidence({ claimEvidenceRows }: ClaimsEvidenceProps) {
    if (claimEvidenceRows.length === 0) return null;

    return (
        <div className="border border-emerald-900/30 bg-[#0b1a14] p-6 rounded-2xl mb-8">
            <div className="flex items-center gap-2 mb-5 text-emerald-300 border-b border-emerald-500/10 pb-3">
                <Terminal size={18} />
                <h3 className="font-bold uppercase tracking-[0.2em] text-xs">Claims & Evidence</h3>
            </div>

            <div className="space-y-3">
                {claimEvidenceRows.map((row, idx) => (
                    <div key={row.id} className="border border-white/5 bg-black/20 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <p className="text-sm text-white/90 leading-relaxed">{row.claim.text}</p>
                            <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded border ${row.claim.support === 'corroborated'
                                ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
                                : 'text-amber-300 border-amber-500/40 bg-amber-500/10'
                                }`}>
                                {row.claim.support || 'uncorroborated'}
                            </span>
                        </div>

                        <div className="text-xs text-white/40 mb-2">
                            Claim #{idx + 1} • Type: {row.claim.claimType}
                        </div>

                        {row.evidence.length > 0 ? (
                            <div className="space-y-2">
                                {row.evidence.map((item: any, evidenceIndex: number) => (
                                    <div key={`${item.id}-${evidenceIndex}`} className="text-xs text-emerald-100/80 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                                        <div className="font-mono text-xs text-emerald-300 mb-1">{item.id} • {item.source}</div>
                                        <div className="text-white/80">{item.title}</div>
                                        <div className="text-white/50 mt-1">{item.snippet}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-amber-300/80 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                                No supporting evidence IDs were attached to this claim.
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
