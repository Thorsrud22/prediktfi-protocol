'use client';

import React from 'react';

interface StatItem {
    label: string;
    value: number; // 0-100
}

interface KeyStatsBarProps {
    stats: StatItem[];
    className?: string;
}

/**
 * Dense horizontal stats bar with monospace terminal aesthetic.
 * Designed for Bloomberg-style data density.
 */
export default function KeyStatsBar({ stats, className = '' }: KeyStatsBarProps) {
    const getScoreColor = (score: number) => {
        if (score >= 60) return 'text-emerald-400';
        if (score >= 30) return 'text-amber-400';
        return 'text-red-400';
    };

    const getBarColor = (score: number) => {
        if (score >= 60) return 'bg-emerald-500';
        if (score >= 30) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 ${className}`}>
            {stats.map((stat, idx) => (
                <div
                    key={idx}
                    className="bg-slate-900/80 border border-white/5 rounded-lg px-4 py-3 flex flex-col gap-2 hover:border-white/10 transition-colors"
                >
                    {/* Label */}
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest truncate">
                            {stat.label}
                        </span>
                        <span className={`font-mono font-black text-sm ${getScoreColor(stat.value)}`}>
                            {stat.value}
                        </span>
                    </div>
                    {/* Mini bar */}
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${getBarColor(stat.value)} rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min(100, Math.max(0, stat.value))}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
