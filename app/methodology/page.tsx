'use client';

import React from 'react';
import Link from 'next/link';
import { Database, Globe, Shield, AlertTriangle, Zap, BarChart3, ArrowLeft } from 'lucide-react';

export default function MethodologyPage() {
    return (
        <div className="min-h-screen text-white">
            <main className="max-w-4xl mx-auto px-4 py-20">
                {/* Header */}
                <div className="mb-12">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Home
                    </Link>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Methodology
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl">
                        How PrediktFi evaluates Web3 ideas and generates risk scores.
                    </p>
                </div>

                {/* Content Sections */}
                <div className="space-y-12">

                    {/* Data Sources */}
                    <section className="p-6 bg-slate-900/60 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Database className="w-5 h-5 text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Data Sources & Provenance</h2>
                        </div>
                        <p className="text-slate-400 mb-4 text-sm">
                            We distinguish between <span className="text-emerald-400 font-bold">Deterministic</span> (On-chain facts) and <span className="text-amber-400 font-bold">Probabilistic</span> (API/AI-derived) data.
                        </p>
                        <ul className="space-y-4 text-slate-300">
                            <li className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="text-xs font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 mt-0.5">D</div>
                                <div>
                                    <strong className="text-white block">Solana On-Chain (Deterministic)</strong>
                                    <span className="text-sm text-slate-400">Direct RPC queries for mint authority, freeze status, and contract owner. This is the "Hard Truth" layer.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="text-xs font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 mt-0.5">P</div>
                                <div>
                                    <strong className="text-white block">DeFiLlama & DexScreener (Probabilistic Heuristics)</strong>
                                    <span className="text-sm text-slate-400">TVL metrics and LP lock statuses. Derived from 3rd-party aggregate data; susceptible to minor indexing delays.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="text-xs font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 mt-0.5">P</div>
                                <div>
                                    <strong className="text-white block">Web Search & Social (Inference)</strong>
                                    <span className="text-sm text-slate-400">News context and social narratives via Tavily. Verified against multiple sources but still classified as "Inferred Insight".</span>
                                </div>
                            </li>
                        </ul>
                    </section>

                    {/* Scoring Framework */}
                    <section className="p-6 bg-slate-900/60 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <BarChart3 className="w-5 h-5 text-green-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Scoring Framework</h2>
                        </div>
                        <p className="text-slate-400 mb-4">
                            The 0-100 score is derived from multiple weighted components:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-800/50 rounded-xl">
                                <div className="text-2xl font-bold text-green-400 mb-1">Market Timing</div>
                                <p className="text-sm text-slate-400">Category saturation, trend momentum, and competitive landscape</p>
                            </div>
                            <div className="p-4 bg-slate-800/50 rounded-xl">
                                <div className="text-2xl font-bold text-blue-400 mb-1">Rug Risk</div>
                                <p className="text-sm text-slate-400">Universal contract scanning for both DeFi and AI Agent tokens (RugCheck & Solscan)</p>
                            </div>
                            <div className="p-4 bg-slate-800/50 rounded-xl">
                                <div className="text-2xl font-bold text-purple-400 mb-1">Team Execution</div>
                                <p className="text-sm text-slate-400">Resource availability, team size, and preparation checklist</p>
                            </div>
                            <div className="p-4 bg-slate-800/50 rounded-xl">
                                <div className="text-2xl font-bold text-amber-400 mb-1">Narrative Fit</div>
                                <p className="text-sm text-slate-400">Clarity of vision, differentiation, and market positioning</p>
                            </div>
                        </div>
                    </section>

                    {/* Calibration */}
                    <section className="p-6 bg-slate-900/60 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Zap className="w-5 h-5 text-purple-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Score Calibration</h2>
                        </div>
                        <p className="text-slate-400 mb-4">
                            Raw AI outputs are post-processed with deterministic rules to ensure consistency:
                        </p>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400">→</span>
                                Projects with active mint authority on Solana receive automatic score penalties
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400">→</span>
                                Solo founders without a working prototype are capped at maximum 65 points
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400">→</span>
                                Projects in oversaturated narratives receive timing penalties
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400">→</span>
                                Missing KOL network or art assets trigger memecoin-specific deductions
                            </li>
                        </ul>
                    </section>

                    {/* Limitations */}
                    <section className="p-6 bg-amber-900/20 rounded-2xl border border-amber-500/20">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Limitations & Disclaimers</h2>
                        </div>
                        <ul className="space-y-3 text-slate-300">
                            <li className="flex items-start gap-3">
                                <span className="text-amber-400 mt-1">!</span>
                                <div>
                                    <strong className="text-white">Not Financial Advice</strong> — PrediktFi is a decision-support tool, not a recommendation to invest.
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-amber-400 mt-1">!</span>
                                <div>
                                    <strong className="text-white">LLM Variability</strong> — Underlying AI models may produce different outputs for similar inputs. Scores should be treated as directional, not absolute.
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-amber-400 mt-1">!</span>
                                <div>
                                    <strong className="text-white">Data Lag</strong> — Market data is fetched in real-time but may be minutes behind. On-chain data reflects the latest confirmed state.
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-amber-400 mt-1">!</span>
                                <div>
                                    <strong className="text-white">No Backtesting</strong> — We do not yet have historical performance data correlating scores with outcomes. This is an early-stage product.
                                </div>
                            </li>
                        </ul>
                    </section>

                    {/* How to Use */}
                    <section className="p-6 bg-slate-900/60 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-cyan-500/10 rounded-lg">
                                <Shield className="w-5 h-5 text-cyan-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">How to Use This Tool</h2>
                        </div>
                        <p className="text-slate-400">
                            PrediktFi is designed to help you think critically about Web3 ideas — not to make decisions for you.
                            Use the evaluation as a starting point for due diligence, not as the final word.
                            High scores don't guarantee success, and low scores don't mean an idea is worthless.
                            The real value is in the structured analysis and the questions it raises.
                        </p>
                    </section>

                </div>

                {/* Footer CTA */}
                <div className="mt-12 pt-8 border-t border-white/10 text-center">
                    <Link
                        href="/studio"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-full transition-all shadow-lg"
                    >
                        Try an Evaluation →
                    </Link>
                </div>
            </main>
        </div>
    );
}
