'use client';

import React from 'react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import HeroActions from './HeroActions';
import AnalysisVisual from './AnalysisVisual';

export default function LandingHero() {
    const reduceMotion = useReducedMotion();
    const badgeControls = useAnimationControls();
    const line1Controls = useAnimationControls();
    const line2Controls = useAnimationControls();
    const sublineControls = useAnimationControls();
    const subcopyControls = useAnimationControls();

    React.useEffect(() => {
        if (reduceMotion) return;

        let active = true;

        const runSequence = async () => {
            await Promise.all([
                badgeControls.start({
                    y: [0, -4, 0],
                    scale: [1, 1.04, 1],
                    transition: {
                        duration: 0.9,
                        times: [0, 0.5, 1],
                        ease: [0.22, 1, 0.36, 1],
                    },
                }),
                line1Controls.start({
                    y: [0, 14, -4, 0],
                    scale: [1, 1.045, 0.995, 1],
                    transition: {
                        delay: 0.05,
                        duration: 1.05,
                        times: [0, 0.42, 0.78, 1],
                        ease: [0.22, 1, 0.36, 1],
                    },
                }),
                line2Controls.start({
                    y: [0, 18, -5, 0],
                    scale: [1, 1.05, 0.995, 1],
                    transition: {
                        delay: 0.16,
                        duration: 1.1,
                        times: [0, 0.42, 0.8, 1],
                        ease: [0.22, 1, 0.36, 1],
                    },
                }),
                sublineControls.start({
                    scale: [1, 1.08, 1],
                    opacity: [1, 1, 1],
                    transition: {
                        delay: 0.28,
                        duration: 0.9,
                        times: [0, 0.45, 1],
                        ease: [0.22, 1, 0.36, 1],
                    },
                }),
                subcopyControls.start({
                    y: [0, 8, 0],
                    transition: {
                        delay: 0.38,
                        duration: 0.85,
                        times: [0, 0.5, 1],
                        ease: [0.22, 1, 0.36, 1],
                    },
                }),
            ]);

            if (!active) return;

            badgeControls.start({
                y: [0, -1.5, 0],
                opacity: [0.92, 1, 0.92],
                transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
            });
            line1Controls.start({
                y: [0, -2.1, 0],
                transition: { duration: 5.4, repeat: Infinity, ease: 'easeInOut' },
            });
            line2Controls.start({
                y: [0, -2.5, 0],
                transition: { duration: 5.9, repeat: Infinity, ease: 'easeInOut', delay: 0.18 },
            });
            sublineControls.start({
                opacity: [0.9, 1, 0.9],
                transition: { duration: 4.1, repeat: Infinity, ease: 'easeInOut' },
            });
            subcopyControls.start({
                opacity: [0.9, 1, 0.9],
                transition: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
            });
        };

        void runSequence();

        return () => {
            active = false;
            badgeControls.stop();
            line1Controls.stop();
            line2Controls.stop();
            sublineControls.stop();
            subcopyControls.stop();
        };
    }, [badgeControls, line1Controls, line2Controls, sublineControls, subcopyControls, reduceMotion]);

    return (
        <div className="text-center max-w-5xl mx-auto space-y-5 md:space-y-6">
            <AnalysisVisual />
            {/* Main Heading */}
            <div className="space-y-5">
                <motion.span
                    initial={false}
                    animate={badgeControls}
                    className="text-xs sm:text-sm font-bold tracking-widest text-accent-light uppercase bg-accent/10 px-4 py-2 rounded-full inline-block mb-5 text-shadow-hero"
                >
                    Stop guessing. Start shipping.
                </motion.span>
                <h1 className="flex flex-col items-center justify-center font-black text-white leading-[0.9] uppercase italic">
                    <motion.span
                        initial={false}
                        animate={line1Controls}
                        className="px-4 text-[2rem] sm:text-[4.1rem] md:text-[5.4rem] tracking-tight bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent filter drop-shadow-2xl text-balance"
                    >
                        investor-grade
                    </motion.span>
                    <motion.span
                        initial={false}
                        animate={line2Controls}
                        className="px-4 text-[2rem] sm:text-[4.1rem] md:text-[5.4rem] tracking-tight bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent filter drop-shadow-2xl text-balance"
                    >
                        due diligence
                    </motion.span>
                    <motion.span
                        initial={false}
                        animate={sublineControls}
                        className="mt-6 text-xl sm:text-3xl md:text-4xl font-bold text-accent tracking-wider relative block"
                    >
                        IN UNDER 2 MINUTES
                    </motion.span>
                </h1>
            </div>

            {/* Subheading */}
            <motion.p
                initial={false}
                animate={subcopyControls}
                className="text-base sm:text-lg md:text-xl text-muted max-w-[52rem] mx-auto font-medium leading-relaxed sm:leading-[1.75] tracking-[0.01em] mb-0"
            >
                Brutally honest feedback on your project idea with <span className="text-white">live market data</span> and <span className="text-white">expert-level analysis</span>.
            </motion.p>

            {/* CTA Buttons */}
            <div className="pt-2 sm:pt-3">
                <HeroActions />
            </div>

            {/* Live Activity Mock */}
            <motion.div
                initial={false}
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
        </div>
    );
}
