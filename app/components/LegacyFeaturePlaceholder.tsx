'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface LegacyFeaturePlaceholderProps {
    title: string;
    description?: string;
}

export default function LegacyFeaturePlaceholder({
    title,
    description = "This feature is currently being updated to align with our new AI Idea Validator Studio."
}: LegacyFeaturePlaceholderProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
            <div className="max-w-md space-y-6 p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-3xl">
                    🚧
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-white">{title}</h1>
                    <p className="text-slate-400">
                        {description}
                    </p>
                </div>

                <div className="pt-4">
                    <Link
                        href="/studio"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Studio
                    </Link>
                </div>
            </div>
        </div>
    );
}
