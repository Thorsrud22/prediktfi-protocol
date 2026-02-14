import { TriangleAlert as AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';

interface ThreatDetectionProps {
    result: IdeaEvaluationResult;
}

export function ThreatDetection({ result }: ThreatDetectionProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* THREAT DETECTION */}
            <div className="border border-slate-800 bg-[#0B1221] p-6 rounded-2xl" style={{ contain: 'layout style' }}>
                <div className="flex items-center gap-2 mb-4 text-slate-400 border-b border-white/5 pb-3">
                    <AlertTriangle size={18} />
                    <h3 className="font-bold uppercase tracking-[0.2em] text-xs">Threat Detection</h3>
                </div>
                <ul className="space-y-3">
                    {[...(result.technical?.keyRisks ?? []), ...(result.market?.goToMarketRisks ?? [])].slice(0, 5).map((con, i) => (
                        <li key={i} className="flex gap-3 text-slate-300 text-xs leading-relaxed">
                            <span className="text-red-500/50 font-mono font-bold">•</span>
                            <span>{con}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* SCORE CALIBRATION AUDIT */}
            {result.calibrationNotes && result.calibrationNotes.length > 0 && (
                <div className="border border-white/5 bg-[#0B1221] p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-600 to-cyan-500 opacity-50" />
                    <div className="flex items-center gap-2 mb-4 text-white/90 border-b border-white/5 pb-3">
                        <Image src="/images/logo.png" width={18} height={18} alt="Predikt" className="object-contain" />
                        <h3 className="font-bold uppercase tracking-[0.2em] text-xs">Calibration Audit</h3>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {result.calibrationNotes.slice(0, 6).map((note, i) => {
                            const isNegative = note.toLowerCase().includes("minus") || note.toLowerCase().includes("penalty");
                            const isPositive = note.toLowerCase().includes("plus") || note.toLowerCase().includes("bonus");

                            return (
                                <div key={i} className="flex gap-3 items-start text-xs">
                                    <div className={`mt-0.5 min-w-[16px] h-4 rounded flex items-center justify-center text-[10px] font-bold uppercase ${isNegative ? 'bg-red-500/20 text-red-400' :
                                        isPositive ? 'bg-emerald-500/20 text-emerald-400' :
                                            'bg-slate-700 text-slate-400'
                                        }`}>
                                        {isNegative ? '-' : isPositive ? '+' : 'i'}
                                    </div>
                                    <p className={`${isNegative ? 'text-red-200/80' :
                                        isPositive ? 'text-emerald-200/80' :
                                            'text-slate-300'
                                        } leading-relaxed`}>
                                        {note.length > 80 ? note.slice(0, 77) + '...' : note}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
