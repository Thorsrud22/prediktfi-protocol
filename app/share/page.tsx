import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Share2, Search, ExternalLink, AlertTriangle } from 'lucide-react';

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

    // Check if this is a valid share link with actual data
    const hasValidParams = params.title && params.score;

    if (!hasValidParams) {
        // No params = base /share route, should not be indexed
        return {
            title: 'Share Your Evaluation • Predikt',
            description: 'Share your AI-powered crypto project evaluation results with others.',
            robots: {
                index: false,  // Don't index the base /share page
                follow: true,
            },
        };
    }

    const title = params.title!;  // Safe: hasValidParams guarantees these exist
    const score = params.score!;

    // Construct OG Image URL for valid share links
    const ogUrl = new URL('https://prediktfi.xyz/og');
    ogUrl.searchParams.set('title', title);
    ogUrl.searchParams.set('score', score);
    if (params.tech) ogUrl.searchParams.set('tech', params.tech);
    if (params.market) ogUrl.searchParams.set('market', params.market);
    if (params.execution) ogUrl.searchParams.set('execution', params.execution);
    if (params.token) ogUrl.searchParams.set('token', params.token);

    // SECURITY: Param-based shares are unverified - use noindex and remove exact score from title
    return {
        title: `${title} - Shared Score • Predikt`,
        description: `Shared evaluation preview for ${title}. For verified results, visit prediktfi.xyz/idea/{id}.`,
        robots: {
            index: false,  // Don't index param-based shares (can be forged)
            follow: true,
        },
        openGraph: {
            title: `${title} - Shared Preview (Unverified)`,
            description: `This is an unverified share link. Authentic evaluations are available at prediktfi.xyz/idea/{id}`,
            images: [
                {
                    url: ogUrl.toString(),
                    width: 1200,
                    height: 630,
                    alt: `${title} Evaluation Preview`,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${title} - Shared Preview (Unverified)`,
            description: `Unverified share link. For authentic evaluations, visit prediktfi.xyz`,
            images: [ogUrl.toString()],
        },
    }
}

export default async function SharePage({ searchParams }: Props) {
    const params = await searchParams;

    // Check if this is a valid share link
    const hasValidParams = params.title && params.score;

    // If no valid params, show an informational landing page
    if (!hasValidParams) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[100px] rounded-full" />
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 blur-[80px] rounded-full" />
                </div>

                <div className="max-w-lg w-full relative z-10 text-center">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-8">
                        <Share2 className="w-10 h-10 text-blue-400" />
                    </div>

                    {/* Hero Text */}
                    <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter mb-4 italic">
                        Share Page <span className="text-blue-500">.</span>
                    </h1>
                    <p className="text-white/60 text-base mb-10 max-w-md mx-auto leading-relaxed">
                        This page displays shared evaluation results.
                        To view a result, use the share link provided after completing an evaluation.
                    </p>

                    {/* Info Box */}
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl mb-8 text-left">
                        <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Search size={14} className="text-blue-400" />
                            How to Get a Share Link
                        </h2>
                        <ol className="space-y-3 text-sm text-white/60">
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-5 h-5 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                <span>Go to the Studio and evaluate your project</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-5 h-5 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                <span>After receiving your score, click the Share button</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-5 h-5 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                <span>Copy the link and share it with others</span>
                            </li>
                        </ol>
                    </div>

                    {/* CTAs */}
                    <div className="space-y-4">
                        <Link
                            href="/studio"
                            className="group w-full block bg-white text-black p-4 rounded-xl font-bold uppercase tracking-widest text-center text-xs hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
                        >
                            Start an Evaluation <ArrowRight className="inline ml-1 -mt-0.5 group-hover:translate-x-1 transition-transform" size={14} />
                        </Link>

                        <Link
                            href="/example-report"
                            className="group w-full block bg-white/5 hover:bg-white/10 border border-white/10 text-white p-4 rounded-xl font-bold uppercase tracking-widest text-center text-xs transition-colors"
                        >
                            See Example Report <ExternalLink className="inline ml-1 -mt-0.5" size={12} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Valid share link - show the score card
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

                {/* UNVERIFIED WARNING BANNER */}
                <div className="bg-amber-500/20 border border-amber-500/30 text-amber-200 p-3 rounded-xl mb-4 text-center flex items-center justify-center gap-2">
                    <AlertTriangle size={14} className="text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-widest">
                        UNVERIFIED PREVIEW — Score not validated by Predikt
                    </span>
                </div>

                {/* Score Card Preview */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl mb-8 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                    <div className="text-center">
                        <div className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-4">Shared Score</div>
                        <div className="text-6xl sm:text-7xl font-black text-white mb-2 tracking-tighter">
                            {params.score}
                            <span className="text-2xl text-white/20 font-medium ml-2">/100</span>
                        </div>
                        <h2 className="text-lg font-bold text-blue-200">
                            {params.title}
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

