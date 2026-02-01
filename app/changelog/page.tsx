'use client';

import React, { useState } from 'react';
import { changelogData, type ChangelogEntry } from './data';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

// Group changes by category for the accordion view
const groupChanges = (changes: ChangelogEntry['changes']) => {
    const groups: Record<string, typeof changes> = {
        'Improvements': [],
        'Fixes': [],
        'Patches': [], // Using 'Patches' for security/other if needed, or map strictly
        'Features': [],
        'Removed': []
    };

    changes.forEach(change => {
        if (change.category === 'improvement') groups['Improvements'].push(change);
        else if (change.category === 'fix') groups['Fixes'].push(change);
        else if (change.category === 'security') groups['Patches'].push(change); // Mapping security to Patches for now or keep separate
        else if (change.category === 'feature') groups['Features'].push(change);
        else if (change.category === 'removed') groups['Removed'].push(change);
    });

    return groups;
};

export default function ChangelogPage() {
    return (
        <div className="min-h-screen text-slate-200">
            <main className="max-w-5xl mx-auto px-6 py-16 md:py-24">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
                            Predikt Changelog
                        </h1>
                    </div>
                    <div>
                        <a
                            href="https://x.com/prediktfi"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors border border-white/5 hover:border-white/10"
                        >
                            Follow us on X
                        </a>
                    </div>
                </header>

                {/* Info Banner */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-blue-200 mb-20 items-start">
                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm md:text-base leading-relaxed">
                        New versions are rolled out gradually and may take a few days to reach all users.
                    </p>
                </div>

                {/* Header Row (Table-style) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 pb-4 border-b border-white/5 mb-8">
                    <div className="md:col-span-1">
                        <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Version</span>
                    </div>
                    <div className="md:col-span-3">
                        <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Description</span>
                    </div>
                </div>

                {/* Main List */}
                <div className="space-y-12">
                    {changelogData.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <p>No recent updates found.</p>
                        </div>
                    ) : (
                        changelogData.map((entry) => (
                            <ChangelogItem key={entry.version} entry={entry} />
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}

function ChangelogItem({ entry }: { entry: ChangelogEntry }) {
    const grouped = groupChanges(entry.changes);
    const categories = ['Features', 'Improvements', 'Fixes', 'Patches', 'Removed'].filter(cat => grouped[cat].length > 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 pb-12">
            {/* Left Column: Version Info */}
            <div className="md:col-span-1">
                <div className="sticky top-24">
                    <h2 className="text-lg font-bold text-white mb-0.5">{entry.version}</h2>
                    <p className="text-sm text-slate-500">{entry.date}</p>
                </div>
            </div>

            {/* Right Column: Content */}
            <div className="md:col-span-3">
                <div className="bg-[#111827]/40 backdrop-blur-sm border border-white/[0.03] rounded-3xl p-8 hover:border-white/[0.08] transition-all duration-300">
                    <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{entry.title}</h3>
                    <p className="text-slate-400 mb-10 leading-relaxed text-sm">
                        {entry.description}
                    </p>

                    <div className="space-y-px mt-auto">
                        {categories.map((category) => (
                            <CategoryAccordion
                                key={category}
                                title={category}
                                items={grouped[category]}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CategoryAccordion({ title, items }: { title: string, items: ChangelogEntry['changes'] }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-t border-white/[0.05] first:border-t-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-4 hover:bg-white/[0.02] transition-colors text-left group"
            >
                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
                    {title} <span className="ml-1 text-slate-500">({items.length})</span>
                </span>
                {isOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                )}
            </button>

            {isOpen && (
                <div className="pb-6 animate-in slide-in-from-top-2 duration-200">
                    <ul className="space-y-3 pl-2">
                        {items.map((item, idx) => (
                            <li key={idx} className="text-sm text-slate-400 flex items-start gap-3">
                                <span className="mt-2 w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                                <span className="leading-relaxed">{item.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
