'use client';

import React from 'react';
import IdeaEvaluationReport from '../studio/IdeaEvaluationReportNew';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

// ------------------------------------------------------------------
// MOCK DATA: "Golden Standard" Example
// ------------------------------------------------------------------
const EXAMPLE_RESULT: IdeaEvaluationResult = {
    overallScore: 92,
    projectType: 'ai',
    confidenceLevel: 'high',

    summary: {
        title: "NeuroSol: Autonomous Trading Agent",
        oneLiner: "LLM-powered liquidity aggregator that executes complex DeFi strategies via natural language on Solana.",
        mainVerdict: "Buy - Institutional grade infrastructure with market-leading execution capability."
    },

    reasoningSteps: [
        "Analyzing autonomous agent architecture...",
        "Verifying Solana program composability...",
        "Checking rigorous backtesting results...",
        "Evaluating competitive landscape vs Jupiter...",
        "Synthesizing final investment thesis..."
    ],

    fatalFlaw: {
        identified: false,
        flawTitle: "",
        flawDescription: "",
        evidence: ""
    },

    technical: {
        feasibilityScore: 94,
        keyRisks: [
            "LLM Hallucination risk in execution path",
            "RPC congestion dependencies"
        ],
        requiredComponents: [
            "Fine-tuned Llama-3 inference node",
            "Solana program anchor interface",
            "Real-time market data indexer"
        ],
        comments: `Technically ambitious but feasible.
        
[COMMITTEE LOG]
Bear Verdict: AVOID ("This is just over-engineered vaporware. Solana mainnet congestion will eat your 'real-time' inference for breakfast.")
Bull Verdict: ALL IN ("Finally, an agent that actually does something on-chain. If the latency claims hold up, this is the Holy Grail of DeFi UX.")`
    },

    aiStrategy: {
        modelQualityScore: 95,
        dataMoatScore: 88,
        userAcquisitionScore: 90,
        notes: [
            "Proprietary fine-tuning on 10TB of Solana Tx data",
            "Latency < 50ms for inference execution",
            "Viral 'Chat-to-Trade' user experience"
        ]
    },

    tokenomics: {
        tokenNeeded: true,
        designScore: 85,
        mainIssues: [],
        suggestions: []
    },

    market: {
        marketFitScore: 90,
        targetAudience: ["DeFi Power Users", "DAO Treasuries"],
        competitorSignals: [], // Deprecated in favor of competitors array
        competitors: [
            {
                name: "Jupiter",
                metrics: {
                    funding: "$5M+",
                    tvl: "$500M+",
                    revenue: "$10M/yr",
                    dailyUsers: "50k+"
                }
            },
            {
                name: "Unibot",
                metrics: {
                    funding: "Fair Launch",
                    tvl: "N/A",
                    revenue: "$30M/yr",
                    dailyUsers: "5k+"
                }
            }
        ],
        goToMarketRisks: [
            "Crowded 'AI Agent' narrative space",
            "User trust in AI handling funds"
        ]
    },

    execution: {
        complexityLevel: 'high',
        founderReadinessFlags: [],
        estimatedTimeline: "4-6 Months",
        executionRiskScore: 20,
        executionRiskLabel: 'low',
        executionSignals: [
            "GitHub repo activity is consistent",
            "Demo already live on Devnet",
            "Audit scheduled with OtterSec"
        ]
    },

    recommendations: {
        mustFixBeforeBuild: [
            "Implement circuit breakers for large slippage",
            "Secure API keys implementation for inference nodes"
        ],
        recommendedPivots: [],
        niceToHaveLater: []
    },

    cryptoNativeChecks: {
        rugPullRisk: 'low',
        auditStatus: 'planned',
        liquidityStatus: 'locked',
        liquidityDetail: "Locked for 1 year",
        liquidityGrade: 'strong',
        isAnonTeam: false,
        isVerified: true,
        tokenAddress: "EXAMPLE-TOKEN-ADDRESS"
    },

    launchReadinessScore: 85,
    launchReadinessLabel: 'high',
    launchReadinessSignals: [],
    calibrationNotes: [
        "AI: plus points for realistic data/infra story.",
        "Execution: plus points for strong technical background."
    ]
};

export default function ExampleReportPage() {
    return (
        <div className="relative min-h-screen text-white font-sans selection:bg-blue-500/30 selection:text-blue-200">
            <main className="relative pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">

                {/* Navigation Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-white/5 pb-8 gap-8">
                    <div className="max-w-3xl">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-[10px] font-black uppercase tracking-[0.2em] italic group"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
                        </Link>
                        <div className="space-y-2 mb-6">
                            <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter text-white">
                                Sample Evaluation <span className="text-blue-600">.</span>
                            </h1>
                            <div className="h-1 w-20 bg-blue-600 rounded-full" />
                        </div>
                        <p className="text-slate-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
                            This is an example of the deep analysis you receive.
                            We evaluate your idea against <span className="text-blue-400 font-medium">live market metrics</span>,
                            <span className="text-blue-400 font-medium"> security best practices</span>, and
                            <span className="text-blue-400 font-medium"> strategic risk factors</span>.
                        </p>
                    </div>

                    <Link
                        href="/studio"
                        className="btn-shimmer group px-8 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase italic tracking-widest text-xs hover:shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-1 flex items-center gap-3 shadow-lg shadow-blue-900/20"
                    >
                        Start Your Analysis <Sparkles size={16} className="text-white/80 transition-transform group-hover:rotate-12" />
                    </Link>
                </div>

                {/* The Report Component */}
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="relative">
                        {/* Glass backdrop effect behind the report */}
                        <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-[60px] -z-10" />

                        <IdeaEvaluationReport
                            result={EXAMPLE_RESULT}
                        // Hide edit/new buttons in example mode to keep it clean,
                        // so we simply don't pass onStartNew or onEdit
                        />
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-24 mb-12">
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-10 group">
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-600/20 blur-[100px] rounded-full group-hover:bg-blue-600/30 transition-all duration-700" />

                        <div className="relative z-10 max-w-xl">
                            <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter mb-4">
                                Ready to validate <br />your own protocol?
                            </h2>
                            <p className="text-slate-400 text-lg">
                                Stop guessing. Get institutional-grade feedback on your idea in seconds.
                            </p>
                        </div>

                        <div className="relative z-10">
                            <Link
                                href="/studio"
                                className="btn-shimmer inline-flex px-10 py-5 bg-white text-black rounded-2xl font-black uppercase italic tracking-widest text-xs hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                            >
                                Launch Studio
                            </Link>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
