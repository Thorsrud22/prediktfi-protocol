
import { prisma } from '@/app/lib/prisma';
import IdeaEvaluationReport from '@/app/studio/IdeaEvaluationReport';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';

type Props = {
    params: Promise<{ id: string }>
}

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const { id } = await params;
    const idea = await prisma.ideaEvaluation.findUnique({
        where: { id },
    });

    if (!idea) {
        return {
            title: 'Idea Not Found • Predikt',
        }
    }

    const title = idea.title || 'Crypto Idea Evaluation';
    const score = idea.score;

    const ogUrl = new URL('https://predikt.fi/og');
    ogUrl.searchParams.set('title', title);
    if (score) ogUrl.searchParams.set('score', score.toString());

    return {
        title: `${title} - Score: ${score}/100 • Predikt`,
        description: `Check out the AI evaluation for ${title}. Feasibility, Market Fit, and Execution Risk analyzed by Predikt.`,
        openGraph: {
            title: `${title} - Score: ${score}/100`,
            description: `AI-verified crypto project evaluation.`,
            images: [
                {
                    url: ogUrl.toString(),
                    width: 1200,
                    height: 630,
                    alt: `${title} Evaluation Score`,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${title} - Score: ${score}/100`,
            description: `AI-verified crypto project evaluation.`,
            images: [ogUrl.toString()],
        },
    }
}

export default async function IdeaPage({ params }: Props) {
    const { id } = await params;
    const idea = await prisma.ideaEvaluation.findUnique({
        where: { id },
    });

    if (!idea) {
        notFound();
    }

    let result;
    try {
        result = JSON.parse(idea.resultJson);
    } catch (e) {
        console.error("Failed to parse existing idea result:", e);
        // Fallback or error state
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8 bg-red-500/10 border border-red-500/30 rounded-2xl">
                    <h1 className="text-xl font-bold text-red-400 mb-2">Error Loading Evaluation</h1>
                    <p className="text-white/60">The data for this evaluation appears to be corrupted.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent text-white pt-24 pb-20">
            <div className="max-w-5xl mx-auto px-4 md:px-8">
                {/* Header Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent uppercase italic">
                            Public Record <span className="text-blue-500">.</span>
                        </h1>
                        <div className="flex items-center gap-2 text-white/40 text-[10px] sm:text-xs font-mono uppercase tracking-widest">
                            <span>ID: {idea.id}</span>
                            <span className="w-1 h-1 rounded-full bg-blue-500/50"></span>
                            <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            href="/studio"
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                        >
                            Create New <span className="text-blue-400">→</span>
                        </Link>
                    </div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <IdeaEvaluationReport
                        result={result}
                    />
                </div>

                {/* Footer CTA */}
                <div className="mt-16 text-center border-t border-white/10 pt-16 pb-8 animate-in fade-in zoom-in duration-700 delay-300">
                    <div className="max-w-xl mx-auto p-8 rounded-3xl bg-slate-900/50 border border-white/5 backdrop-blur-sm shadow-2xl">
                        <h3 className="text-3xl font-black italic uppercase tracking-tight mb-4 text-white">
                            Validate your own idea
                        </h3>
                        <p className="text-white/60 mb-8 max-w-sm mx-auto leading-relaxed">
                            Join thousands of founders using AI to stress-test their crypto projects before writing a single line of code.
                        </p>
                        <Link
                            href="/studio"
                            className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg hover:shadow-blue-500/25 ring-1 ring-white/10"
                        >
                            Start Free Evaluation
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
