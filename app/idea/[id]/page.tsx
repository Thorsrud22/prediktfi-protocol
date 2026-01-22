
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

    // Parse JSON data
    const result = JSON.parse(idea.resultJson);

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <div className="max-w-5xl mx-auto px-4 py-12">
                <div className="mb-8 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold text-white">PrediktFi</Link>
                    <div className="flex gap-4">
                        <Link href="/studio" className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-500">
                            Audit Your Idea
                        </Link>
                    </div>
                </div>

                <IdeaEvaluationReport
                    result={result}
                />

                <div className="mt-12 text-center border-t border-white/10 pt-8">
                    <h3 className="text-2xl font-bold mb-4">Validate your own idea</h3>
                    <p className="text-slate-400 mb-6">Join thousands of founders using AI to stress-test their crypto projects.</p>
                    <Link href="/studio" className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full font-bold text-lg hover:scale-105 transition-transform">
                        Start Free Evaluation
                    </Link>
                </div>
            </div>
        </div>
    );
}
