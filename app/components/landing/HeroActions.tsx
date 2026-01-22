export default function HeroActions() {
    // Static view - no client-side checks needed anymore
    // This resolves hydration mismatches by ensuring server and client always render the same thing.

    return (
        <div className="flex flex-col items-center justify-center gap-4 pt-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in zoom-in duration-300">
                <InstantLink
                    href="/studio"
                    className="btn-shimmer px-10 py-5 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] italic shadow-lg shadow-blue-900/40 transition-all duration-300 hover:brightness-110 min-w-[220px] text-center"
                >
                    <span className="relative">
                        Start Validation
                    </span>
                </InstantLink>

                <InstantLink
                    href="/example-report"
                    className="px-10 py-5 rounded-2xl bg-white/5 border border-white/5 text-slate-300 font-black text-xs uppercase tracking-[0.2em] italic hover:bg-white/10 hover:border-white/10 transition-all duration-300 min-w-[220px] text-center"
                >
                    View Sample Report
                </InstantLink>
            </div>

        </div>
    );
}

