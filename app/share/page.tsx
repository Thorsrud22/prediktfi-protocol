import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

type Props = {
    searchParams: Promise<{
        title?: string;
        score?: string;
        tech?: string;
        market?: string;
        execution?: string;
        token?: string;
    }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const params = await searchParams;
    const title = params.title || 'Crypto Idea Verification';
    const score = params.score || '0';

    // Construct OG Image URL
    const ogUrl = new URL('https://prediktfi.xyz/og');
    ogUrl.searchParams.set('title', title);
    ogUrl.searchParams.set('score', score);
    if (params.tech) ogUrl.searchParams.set('tech', params.tech);
    if (params.market) ogUrl.searchParams.set('market', params.market);
    if (params.execution) ogUrl.searchParams.set('execution', params.execution);
    if (params.token) ogUrl.searchParams.set('token', params.token);

    return {
        title: `${title} - Score: ${score}/100 • Predikt`,
        description: `Check out the AI evaluation for ${title}. Just validated on Predikt protocol.`,
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

export default async function SharePage({ searchParams }: Props) {
    const params = await searchParams;

    // If we have just basic params, we show a preview card and a CTA
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[100px] rounded-full" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 blur-[80px] rounded-full" />
            </div>

            <div className="max-w-md w-full relative z-10">
                {/* Hero Text */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2 italic">
                        Predikt <span className="text-blue-500">.</span>
                    </h1>
                    <p className="text-white/60 text-sm font-medium tracking-widest uppercase">
                        AI Evaluation Protocol
                    </p>
                </div>

                {/* Score Card Preview */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl mb-8 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                    <div className="text-center">
                        <div className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-4">Project Score</div>
                        <div className="text-6xl sm:text-7xl font-black text-white mb-2 tracking-tighter">
                            {params.score || '0'}
                            <span className="text-2xl text-white/20 font-medium ml-2">/100</span>
                        </div>
                        <h2 className="text-lg font-bold text-blue-200">
                            {params.title || 'Untitled Project'}
                        </h2>
                    </div>
                </div>

                {/* CTA */}
                <div className="space-y-4">
                    <Link
                        href="/studio"
                        className="group w-full block bg-white text-black p-4 rounded-xl font-bold uppercase tracking-widest text-center text-xs hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
                    >
                        Validate Your Own Idea <ArrowRight className="inline ml-1 -mt-0.5 group-hover:translate-x-1 transition-transform" size={14} />
                    </Link>

                    <p className="text-center text-[10px] text-white/30 uppercase tracking-widest">
                        Join 2,400+ founders using Predikt
                    </p>
                </div>
            </div>
        </div>
    );
}
