
import React from 'react';
import { Shield, Brain, Terminal, Activity, Lock, Search, FileCode, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Transparency & Methodology | PrediktFi',
    description: 'How PrediktFi evaluates Web3 projects using Neuro-Symbolic AI and on-chain verification.',
    alternates: {
        canonical: '/transparency',
    },
};

export default function TransparencyPage() {
    return (
        <div className="min-h-screen bg-transparent text-slate-100 pt-24 pb-20 relative overflow-hidden">



            <div className="max-w-4xl mx-auto px-6 relative z-10">

                {/* Header */}
                <div className="mb-16">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                            Open Kimono Policy
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
                        We Don't Just <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-white">Prompt & Pray.</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
                        PrediktFi uses a <strong>Neuro-Symbolic Architecture</strong>. We combine the reasoning power of{' '}
                        <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded mx-1">GPT-5.2</span>{' '}
                        with rigid, deterministic code that enforces investor discipline.
                    </p>
                </div>

                {/* 1. The Engine */}
                <div className="mb-20">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                            <Brain size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">The Engine</h2>
                            <p className="text-slate-400 text-sm">Reasoning Layer (Probabilistic)</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-slate-900/50 border border-white/5 p-8 rounded-3xl backdrop-blur-sm">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                Model: GPT-5.2 (Reasoning)
                            </h3>
                            <p className="text-slate-400 leading-relaxed text-sm mb-6">
                                We utilize an early-access reasoning model (GPT-5.2) capable of "System 2" thinking.
                                Instead of next-token prediction, it simulates an investment committee debate before outputting a score.
                            </p>
                            <div className="bg-black/50 rounded-xl p-4 border border-white/5 font-mono text-xs text-slate-300">
                                <div className="text-slate-500 mb-2 border-b border-white/5 pb-2">Internal Chain-of-Thought Log</div>
                                <div className="space-y-2 opacity-80">
                                    <p>&gt; Analyzing market saturation for 'AI wrapper'...</p>
                                    <p>&gt; Querying product hunt trends & git activity...</p>
                                    <p>&gt; DETECTED: Core logic is just an OpenAI API call...</p>
                                    <p>&gt; VERDICT: Discounting innovation score by 40% (Wrapper Tax).</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl">
                                <h4 className="font-bold text-blue-200 mb-2 text-sm uppercase tracking-wider">Why not just ChatGPT?</h4>
                                <p className="text-slate-400 text-sm">
                                    Standard LLMs are "people pleasers". They hallucinate success.
                                    Our system prompt (The Validator) is 2,000+ words of <strong>contrarian financial instruction</strong> designed to reject 95% of ideas.
                                </p>
                            </div>
                            <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl">
                                <h4 className="font-bold text-blue-200 mb-2 text-sm uppercase tracking-wider">Context Injection</h4>
                                <p className="text-slate-400 text-sm">
                                    We don't just send your text. We inject live <span className="text-white">Solana price data</span>, <span className="text-white">SaaS metrics</span>, and <span className="text-white">Trend Narratives</span> into the context window.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. The Code (Hard Rails) */}
                <div className="mb-20">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                            <FileCode size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">The Hard Rails</h2>
                            <p className="text-slate-400 text-sm">Deterministic Layer (Rule-Based)</p>
                        </div>
                    </div>

                    <div className="bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
                        <div className="p-8 border-b border-white/5">
                            <p className="text-slate-300 max-w-2xl">
                                After the AI scores a project, we run the result through <code className="text-amber-300 bg-amber-900/30 px-1.5 py-0.5 rounded text-sm">calibration.ts</code>.
                                These are hard-coded rules that <strong>override</strong> the AI to prevent hype-based scoring.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
                            {/* Rule Block */}
                            <div className="p-8">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Lock size={14} className="text-red-400" />
                                    The "Solo Founder" Cap
                                </h3>
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-400">
                                        If you are a solo founder building a <span className="text-white">Complex Platform</span>,
                                        algorithm caps your Execution Score at <strong>60/100</strong>.
                                    </p>
                                    <div className="bg-black/40 p-4 rounded-lg border border-white/5 font-mono text-xs text-green-400 overflow-x-auto">
                                        <span className="text-cyan-400">if</span> (teamSize === 'solo' && complexity === 'high') {'{'}<br />
                                        &nbsp;&nbsp;maxScore = 60;<br />
                                        &nbsp;&nbsp;flags.push(<span className="text-yellow-200">"Cap: Solo Founder Risk"</span>);<br />
                                        {'}'}
                                    </div>
                                </div>
                            </div>

                            {/* Rule Block */}
                            <div className="p-8">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Activity size={14} className="text-red-400" />
                                    The Buzzword Tax
                                </h3>
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-400">
                                        If your SaaS or token pitch relies on generic keywords like "AI-powered" or "Quantum" without technical depth,
                                        we deduct <strong>-20 points</strong> instantly.
                                    </p>
                                    <div className="bg-black/40 p-4 rounded-lg border border-white/5 font-mono text-xs text-green-400 overflow-x-auto">
                                        <span className="text-cyan-400">if</span> (isGenericBuzzword) {'{'}<br />
                                        &nbsp;&nbsp;score -= 20;<br />
                                        &nbsp;&nbsp;flags.push(<span className="text-yellow-200">"Penalty: Generic Narrative"</span>);<br />
                                        {'}'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Verification Layer */}
                <div className="mb-20">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                            <Search size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Verification Layer</h2>
                            <p className="text-slate-400 text-sm">Fact-Checking (RPC & APIS)</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl hover:bg-slate-800/50 transition-colors">
                            <CheckCircle2 size={24} className="text-emerald-400 mb-4" />
                            <h3 className="font-bold text-white mb-2">Mint Authority</h3>
                            <p className="text-sm text-slate-400 mb-4">
                                We query the Solana blockchain directly. If <code className="text-white text-xs bg-white/10 px-1 py-0.5 rounded">mintAuthority</code> is not null for a traded token, we flag it as <strong>High Rug Risk</strong>.
                            </p>
                        </div>
                        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl hover:bg-slate-800/50 transition-colors">
                            <CheckCircle2 size={24} className="text-emerald-400 mb-4" />
                            <h3 className="font-bold text-white mb-2">Freeze Authority</h3>
                            <p className="text-sm text-slate-400 mb-4">
                                Can the dev freeze your wallet? We check the account extensions on-chain. Ideal state: <span className="text-emerald-400">Revoked</span>.
                            </p>
                        </div>
                        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl hover:bg-slate-800/50 transition-colors">
                            <CheckCircle2 size={24} className="text-emerald-400 mb-4" />
                            <h3 className="font-bold text-white mb-2">LP Lock Status</h3>
                            <p className="text-sm text-slate-400 mb-4">
                                NOTE: Currently relying on self-reported addresses cross-referenced with Raydium/Pump.fun API patterns.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action */}
                <div className="text-center pt-12 border-t border-white/5">
                    <h2 className="text-2xl font-bold text-white mb-6">Ready to test the system?</h2>
                    <div className="flex justify-center gap-4">
                        <Link
                            href="/studio"
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                        >
                            <Terminal size={18} />
                            Run Evaluation
                        </Link>
                        <Link
                            href="https://x.com/PrediktFi"
                            target="_blank"
                            className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-8 rounded-xl transition-all border border-white/10"
                        >
                            Debate on X
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
