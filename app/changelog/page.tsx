'use client';

import React from 'react';
import Navbar from '@/app/components/Navbar';
import { changelogData } from './data';
import { ArrowLeft, CheckCircle2, Shield, Zap, Trash2, Bug } from 'lucide-react';
import Link from 'next/link';

export default function ChangelogPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 py-24 md:py-32">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-20">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-6 transition-colors text-sm font-mono uppercase tracking-widest">
                            <ArrowLeft size={14} /> Back to Protocol
                        </Link>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-gradient-to-r from-white via-white to-slate-500 bg-clip-text text-transparent">
                            Changelog
                        </h1>
                        <p className="mt-4 text-lg text-white/50 max-w-xl font-medium leading-relaxed">
                            A living history of the PrediktFi Protocol. We ship fast, break nothing, and document everything.
                        </p>
                    </div>
                </div>

                {/* Timeline Grid */}
                <div className="relative border-l border-white/10 md:border-l-0 ml-3 md:ml-0 space-y-16">
                    {changelogData.map((entry, index) => (
                        <div key={entry.version} className="grid grid-cols-1 md:grid-cols-12 gap-8 relative animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${index * 100}ms` }}>

                            {/* Left Column: Version & Date */}
                            <div className="md:col-span-3 md:text-right md:pt-8 relative pl-8 md:pl-0">
                                {/* Mobile Timeline Dot */}
                                <div className="absolute left-[-13px] top-9 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-slate-950 md:hidden" />

                                <div className="sticky top-32">
                                    <h2 className="text-3xl font-black tracking-tight text-white mb-1 font-mono">{entry.version}</h2>
                                    <p className="text-sm font-bold text-blue-400 uppercase tracking-widest">{entry.date}</p>
                                </div>
                            </div>

                            {/* Right Column: Content Card */}
                            <div className="md:col-span-9">
                                <div className="group relative bg-slate-900/50 hover:bg-slate-900 border border-white/5 hover:border-blue-500/30 rounded-[32px] p-8 md:p-10 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-500/5 overflow-hidden">
                                    {/* Glowing effect on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <div className="relative z-10">
                                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
                                            {entry.title}
                                        </h3>
                                        <p className="text-white/60 text-lg leading-relaxed mb-8 border-b border-white/5 pb-8">
                                            {entry.description}
                                        </p>

                                        <ul className="space-y-4">
                                            {entry.changes.map((change, i) => (
                                                <li key={i} className="flex items-start gap-4 text-sm group/item">
                                                    <div className="mt-0.5 shrink-0">
                                                        <CategoryIcon type={change.category} />
                                                    </div>
                                                    <span className={`leading-relaxed ${change.category === 'removed' ? 'text-white/30 line-through decoration-white/20' : 'text-white/80 group-hover/item:text-white transition-colors'}`}>
                                                        {change.text}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

function CategoryIcon({ type }: { type: string }) {
    switch (type) {
        case 'feature':
            return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400"><Zap size={14} fill="currentColor" /></span>;
        case 'fix':
            return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400"><Bug size={14} /></span>;
        case 'security':
            return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400"><Shield size={14} /></span>;
        case 'removed':
            return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/10 text-red-500/50"><Trash2 size={14} /></span>;
        default:
            return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-white/60"><CheckCircle2 size={14} /></span>;
    }
}
