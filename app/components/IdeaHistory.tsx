
'use client';

import { useSimplifiedWallet } from './wallet/SimplifiedWalletProvider';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Idea {
    id: string;
    title: string;
    score: number;
    projectType: string;
    createdAt: string;
}

export default function IdeaHistory() {
    const { publicKey } = useSimplifiedWallet();
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!publicKey) return;

        const fetchIdeas = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/idea/list?address=${publicKey}`);
                if (res.ok) {
                    const data = await res.json();
                    setIdeas(data.ideas);
                }
            } catch (error) {
                console.error('Failed to fetch ideas', error);
            } finally {
                setLoading(false);
            }
        };

        fetchIdeas();
    }, [publicKey]);

    if (!publicKey) {
        return (
            <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 backdrop-blur-sm mt-8">
                <p className="text-slate-400">Connect your wallet to see your saved ideas.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-slate-400 font-medium">Loading your history...</p>
            </div>
        );
    }

    if (ideas.length === 0) {
        return (
            <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 backdrop-blur-sm mt-8 px-6">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-200 mb-3">No evaluations yet</h3>
                <p className="text-slate-400 mb-8 max-w-xs mx-auto">Build your reputation by validating your first Web3 idea.</p>
                <Link href="/studio" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95">
                    Start Evaluation
                </Link>
            </div>
        );
    }

    return (
        <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
                    <span className="text-blue-500 mr-2">//</span> My Validated Ideas
                </h2>
                <span className="text-xs font-mono text-slate-500 uppercase tracking-tighter bg-slate-800/50 px-2 py-1 rounded">
                    {ideas.length} Records
                </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {ideas.map((idea) => (
                    <Link key={idea.id} href={`/idea/${idea.id}`} className="block group">
                        <div className="relative h-full bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 hover:border-blue-500/50 hover:bg-slate-800/60 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] active:scale-[0.98]">
                            {/* Score Indicator Strip */}
                            <div className={`absolute top-0 left-0 right-0 h-1 transition-opacity group-hover:opacity-100 opacity-50 ${idea.score >= 70 ? 'bg-gradient-to-r from-cyan-400 to-blue-500' :
                                idea.score >= 40 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                                    'bg-gradient-to-r from-slate-500 to-slate-600'
                                }`}></div>

                            <div className="p-5 sm:p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${idea.score >= 70 ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' :
                                            idea.score >= 40 ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]' :
                                                'bg-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.5)]'
                                            }`}></div>
                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${idea.score >= 70 ? 'text-cyan-400' :
                                            idea.score >= 40 ? 'text-blue-400' :
                                                'text-slate-400'
                                            }`}>
                                            Score: {idea.score}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded border border-white/5 uppercase tracking-wider">
                                        {idea.projectType}
                                    </span>
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight mb-4">
                                    {idea.title}
                                </h3>
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase">
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {new Date(idea.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 font-black">
                                        VIEW REPORT
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
