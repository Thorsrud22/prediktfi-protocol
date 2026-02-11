'use client';

import React from 'react';
import { motion } from 'framer-motion';
import HeroActions from './HeroActions';
import AnalysisVisual from './AnalysisVisual';

export default function LandingHero() {
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="text-center max-w-5xl mx-auto space-y-3 md:space-y-4 opacity-0" suppressHydrationWarning>
                {/* Static Server Render (SEO Friendly) */}
                <div className="space-y-4">
                    <span className="text-xs sm:text-sm font-bold tracking-widest text-accent-light uppercase bg-accent/10 px-4 py-2 rounded-full inline-block mb-4">
                        Stop guessing. Start shipping.
                    </span>
                    <h1 className="flex flex-col items-center justify-center font-black text-white leading-[0.9] uppercase italic">
                        <span className="px-4 text-3xl sm:text-7xl md:text-8xl tracking-tight bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent filter drop-shadow-2xl text-balance">
                            investor-grade
                        </span>
                        <span className="px-4 text-3xl sm:text-7xl md:text-8xl tracking-tight bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent filter drop-shadow-2xl text-balance">
                            due diligence
                        </span>
                        <span className="mt-6 text-xl sm:text-3xl md:text-4xl font-bold text-accent tracking-wider relative block">
                            IN UNDER 2 MINUTES
                        </span>
                    </h1>
                </div>
                <p className="text-lg md:text-xl text-muted max-w-3xl mx-auto font-medium leading-relaxed">
                    Brutally honest feedback on your project idea with <span className="text-white">live market data</span> and <span className="text-white">expert-level analysis</span>.
                </p>
                {/* Keep link-heavy CTA subtree client-only to avoid hydration attribute drift */}
                <div className="h-20" aria-hidden="true" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-5xl mx-auto space-y-3 md:space-y-4"
        >
            <AnalysisVisual />
            {/* Main Heading */}
            <div className="space-y-3">
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 1.0, ease: "easeOut" }}
                    className="text-xs sm:text-sm font-bold tracking-widest text-accent-light uppercase bg-accent/10 px-4 py-2 rounded-full inline-block mb-3"
                >
                    Stop guessing. Start shipping.
                </motion.span>
                <h1 className="flex flex-col items-center justify-center font-black text-white leading-[0.9] uppercase italic">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
                        className="px-4 text-3xl sm:text-7xl md:text-8xl tracking-tight bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent filter drop-shadow-2xl text-balance"
                    >
                        investor-grade
                    </motion.span>
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 1.2, ease: "easeOut" }}
                        className="px-4 text-3xl sm:text-7xl md:text-8xl tracking-tight bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent filter drop-shadow-2xl text-balance"
                    >
                        due diligence
                    </motion.span>
                    <motion.span
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.9, duration: 1.0, ease: "easeOut" }}
                        className="mt-4 text-xl sm:text-3xl md:text-4xl font-bold text-accent tracking-wider relative block"
                    >
                        IN UNDER 2 MINUTES
                    </motion.span>
                </h1>
            </div>

            {/* Subheading */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 1.2, ease: "easeOut" }}
                className="text-lg md:text-xl text-muted max-w-3xl mx-auto font-medium leading-relaxed mb-0"
            >
                Brutally honest feedback on your project idea with <span className="text-white">live market data</span> and <span className="text-white">expert-level analysis</span>.
            </motion.p>

            {/* CTA Buttons */}
            <HeroActions />

            {/* Live Activity Mock */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="pt-8 sm:pt-12"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-[10px] font-bold uppercase tracking-widest text-muted border-white/5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                    </span>
                    Example: User analyzed <span className="text-white">$DOGE</span> (Deep Audit in ~2m)
                </div>
            </motion.div>

            {/* Trust Signals */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-x-12 text-[10px] font-black uppercase tracking-[0.2em] italic text-slate-500/50">
                <div className="flex items-center gap-3">
                    <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                    Live Market Data
                </div>
                <div className="flex items-center gap-3">
                    <span className="w-1 h-1 rounded-full bg-accent-secondary animate-pulse" />
                    Deterministic Hard Rails
                </div>
                <div className="flex items-center gap-3">
                    <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                    Risk Modeling
                </div>
            </div>
        </motion.div>
    );
}
