'use client';

import React from 'react';
import IdeaEvaluationReport from '../studio/IdeaEvaluationReport';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

// ------------------------------------------------------------------
// MOCK DATA: "Golden Standard" Example
// ------------------------------------------------------------------
const EXAMPLE_RESULT: IdeaEvaluationResult = {
    overallScore: 88,
    projectType: 'ai',
    confidenceLevel: 'high',

    summary: {
        title: "NeuroSol: Autonomous Trading Agent",
        oneLiner: "LLM-powered liquidity aggregator that executes complex DeFi strategies via natural language on Solana.",
        mainVerdict: "Buy - Institutional grade infrastructure with clear moat and strong execution team."
    },

    reasoningSteps: [
        "Analyzing autonomous agent architecture...",
        "Verifying Solana program composability...",
        "Checking rigorous backtesting results...",
        "Evaluating competitive landscape vs Jupiter...",
        "Assessing token utility (governance + fee burn)...",
        "Verifying multi-sig security integration...",
        "Synthesizing final investment thesis..."
    ],

    technical: {
        feasibilityScore: 92,
        keyRisks: [
            "LLM Hallucination risk in trade execution path",
            "RPC congestion dependencies during high volatility"
        ],
        requiredComponents: [
            "Fine-tuned Llama-3 inference node",
            "Solana program anchor interface",
            "Real-time market data indexer"
        ],
        comments: "Technically ambitious but feasible. The separation of 'Planner' (LLM) and 'Executor' (Deterministic Code) contributes to a high safety score."
    },

    tokenomics: {
        tokenNeeded: true,
        designScore: 85,
        mainIssues: [
            "Initial float might be too low (< 15%)",
            "Vesting schedule for team could be longer (current: 12m)"
        ],
        suggestions: [
            "Increase team vesting to 24 months to align with roadmap",
            "Implement dynamic fee burn based on agent usage volume"
        ]
    },

    market: {
        marketFitScore: 90,
        targetAudience: [
            "DeFi Power Users",
            "DAO Treasuries",
            "Arbitrage Bot Operators"
        ],
        competitorSignals: [
            "Jupiter (Aggregator leader, no AI intent)",
            "Drift (Perps, limited automation)",
            "Unibot (Telegram based, security issues)"
        ],
        goToMarketRisks: [
            "User trust in AI handling funds",
            "Crowded 'AI Agent' narrative space"
        ]
    },

    execution: {
        complexityLevel: 'high',
        founderReadinessFlags: [
            "Ex-HFT Engineer Lead",
            "Solana Hackathon Winner '23",
            "Published AI Research"
        ],
        estimatedTimeline: "4-6 Months to Mainnet",
        executionRiskScore: 30, // Low risk
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
        recommendedPivots: [], // None
        niceToHaveLater: [
            "Mobile app interface",
            "Social copy-trading features"
        ],
    },

    cryptoNativeChecks: {
        rugPullRisk: 'low',
        auditStatus: 'planned',
        liquidityStatus: 'locked',
        liquidityDetail: "Locked for 1 year (Streamflow)",
        liquidityGrade: 'strong',
        isAnonTeam: false
    },

    launchReadinessScore: 85,
    launchReadinessLabel: 'high',
    launchReadinessSignals: [
        "Whitepaper complete",
        "Community discord active (2k+ members)",
        "Tokenomics explicitly defined"
    ],

    calibrationNotes: [
        "AI: plus points for a clear pain point and realistic data/infra story.",
        "Execution: plus points for strong technical/ML background.",
        "Launch: plus points for realistic MVP scope and data plan."
    ]
};

export default function ExampleReportPage() {
    return (
        <div className="relative min-h-screen text-white font-sans selection:bg-blue-500/30 selection:text-blue-200">
            <main className="relative pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">

                {/* Navigation Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-white/10 pb-8 gap-6">
                    <div>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-4 text-xs font-bold uppercase tracking-widest"
                        >
                            <ArrowLeft size={14} /> Back to Home
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">
                            Sample Evaluation <span className="text-blue-500">.</span>
                        </h1>
                        <p className="text-white/60 text-lg max-w-2xl font-light leading-relaxed">
                            This is an example of the deep analysis you receive.
                            We stress-test your idea against <span className="text-blue-400 font-medium">real market data</span>,
                            <span className="text-blue-400 font-medium"> on-chain security patterns</span>, and
                            <span className="text-blue-400 font-medium"> institutional risk models</span>.
                        </p>
                    </div>

                    <Link
                        href="/studio"
                        className="group px-8 py-4 bg-white text-black rounded-full font-bold uppercase tracking-widest text-sm hover:bg-blue-50 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2"
                    >
                        Start Your Analysis <Sparkles size={16} className="text-blue-600 transition-transform group-hover:rotate-12" />
                    </Link>
                </div>

                {/* The Report Component */}
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <IdeaEvaluationReport
                        result={EXAMPLE_RESULT}
                        // Hide edit/new buttons in example mode to keep it clean,
                        // so we simply don't pass onStartNew or onEdit
                        hideBonus={true}
                    />
                </div>

                {/* Bottom CTA */}
                <div className="mt-20 text-center border-t border-white/10 pt-16">
                    <h2 className="text-2xl font-bold mb-6">Ready to validate your own protocol?</h2>
                    <Link
                        href="/studio"
                        className="inline-flex px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold uppercase tracking-widest text-sm hover:shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-1"
                    >
                        Launch Studio
                    </Link>
                </div>

            </main>
        </div>
    );
}
