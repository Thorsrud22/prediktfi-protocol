import dynamic from 'next/dynamic';
import Image from 'next/image';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';
import { ScoreTooltip } from './ScoreTooltip';
import { getScoreBadgeClass, getScoreLabel } from '../utils';

const RiskGauge = dynamic(() => import('../../../components/charts/RiskGauge'), {
    loading: () => <div className="w-full h-32 bg-white/5 animate-pulse rounded-xl" />,
    ssr: false
});

interface VerdictPanelProps {
    result: IdeaEvaluationResult;
    riskScore: number;
}

export function VerdictPanel({ result, riskScore }: VerdictPanelProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* LEFT: VERDICT PANEL (2/3) */}
            <div className="lg:col-span-2 flex flex-col justify-center">
                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase mb-2">
                    {result.summary.title} <span className="text-blue-500">.</span>
                </h2>
                <p className="text-white/50 text-sm mb-6 max-w-lg leading-relaxed">
                    {result.summary.oneLiner}
                </p>

                {/* MASSIVE SCORE - span wrapper fix for clipping */}
                <div className="flex items-baseline overflow-visible">
                    <span className="text-5xl sm:text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 pt-4 pb-2 leading-[1.15]">
                        {result.overallScore}
                    </span>
                    <span className="text-sm text-gray-500 ml-2 font-medium">/ 100</span>
                </div>
                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border mt-2 inline-block ${getScoreBadgeClass(result.overallScore)}`}>
                    {getScoreLabel(result.overallScore)}
                </span>

                {/* What This Score Means - Inline Definition */}
                <div className="mt-4 bg-slate-800/50 border border-white/5 rounded-xl p-4 max-w-md">
                    <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Image src="/images/logo.png" width={12} height={12} alt="Predikt" className="object-contain" />
                        What this score means
                    </h4>
                    <p className="text-xs text-white/50 leading-relaxed">
                        The <span className="text-white font-medium">Predikt Score</span> is a weighted assessment of your project's viability based on
                        technical feasibility, market positioning, execution readiness, and {result.projectType === 'ai' ? 'AI strategy strength' : 'tokenomics design'}.
                        Scores above 75 indicate strong investment potential; 50-74 suggests promise with notable risks; below 50 signals significant concerns.
                    </p>
                </div>

                {/* Score Methodology Explainer with Tooltips */}
                <div className="mt-3 text-xs text-white/40 max-w-md leading-relaxed flex flex-wrap gap-x-1 items-center">
                    <span className="font-bold text-white/60 mr-1">Score breakdown: </span>

                    <ScoreTooltip
                        label="Technical"
                        text="Measures feasibility & technical moat. Improve by detailing proprietary tech or unique architecture."
                    >
                        <span className="hover:text-blue-400 border-b border-dashed border-white/20 hover:border-blue-400 cursor-help transition-colors">
                            Technical ({result.technical.feasibilityScore})
                        </span>
                    </ScoreTooltip>
                    +
                    <ScoreTooltip
                        label="Market"
                        text="Evaluates demand & competition. Improve by defining specific audience & validating against real competitors."
                    >
                        <span className="hover:text-blue-400 border-b border-dashed border-white/20 hover:border-blue-400 cursor-help transition-colors">
                            Market ({result.market.marketFitScore})
                        </span>
                    </ScoreTooltip>
                    +
                    <ScoreTooltip
                        label="Execution"
                        text="Judges team capability & roadmap. Improve by highlighting relevant experience & realistic staging."
                    >
                        <span className="hover:text-blue-400 border-b border-dashed border-white/20 hover:border-blue-400 cursor-help transition-colors">
                            Execution ({100 - (result.execution?.executionRiskScore || 50)})
                        </span>
                    </ScoreTooltip>

                    {result.projectType === 'ai' && result.aiStrategy ? (
                        <>
                            +
                            <ScoreTooltip
                                label="AI Strategy"
                                text="Assesses model/data differentiation. Improve by securing unique datasets & avoiding generic wrappers."
                            >
                                <span className="hover:text-blue-400 border-b border-dashed border-white/20 hover:border-blue-400 cursor-help transition-colors">
                                    AI ({Math.round((result.aiStrategy.modelQualityScore + result.aiStrategy.dataMoatScore + result.aiStrategy.userAcquisitionScore) / 3)})
                                </span>
                            </ScoreTooltip>
                        </>
                    ) : (
                        <>
                            +
                            <ScoreTooltip
                                label="Tokenomics"
                                text="Analyzes utility & sustainability. Improve by ensuring token has utility beyond speculation."
                            >
                                <span className="hover:text-blue-400 border-b border-dashed border-white/20 hover:border-blue-400 cursor-help transition-colors">
                                    Token ({result.tokenomics.designScore})
                                </span>
                            </ScoreTooltip>
                        </>
                    )}
                </div>

                {/* Tier Legend */}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/30">
                    <span><span className="text-emerald-400">●</span> 75+ Strong Potential</span>
                    <span><span className="text-amber-400">●</span> 50-74 Watchlist</span>
                    <span><span className="text-red-400">●</span> &lt;50 Pass</span>
                </div>
            </div>

            {/* RIGHT: RISK RADAR (1/3) */}
            <div className="flex flex-col items-center justify-center">
                <RiskGauge score={riskScore} size={200} />
            </div>
        </div>
    );
}
