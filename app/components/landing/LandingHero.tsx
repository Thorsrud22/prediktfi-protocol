'use client';

import React from 'react';
import { motion, useInView, useReducedMotion, type Variants } from 'framer-motion';
import HeroActions from './HeroActions';

const ENTRY_EASE = [0.22, 1, 0.36, 1] as const;
const HERO_IN_VIEW_AMOUNT = 0.35;
const HERO_LINE_CLASS =
    'px-4 text-[2rem] sm:text-[4.1rem] md:text-[5.4rem] tracking-tight bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent filter drop-shadow-2xl text-balance';

const containerVariants: Variants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.05,
        },
    },
};

function makeEnterVariants(yOffset: number, duration: number): Variants {
    return {
        hidden: { y: yOffset, opacity: 0, scale: 0.99 },
        show: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: { duration, ease: ENTRY_EASE },
        },
    };
}

function makeFloatTransition(duration: number, delay = 0) {
    return {
        duration,
        repeat: Infinity,
        ease: 'easeInOut' as const,
        delay,
    };
}

const softEnterVariants = makeEnterVariants(6, 0.72);
const mediumEnterVariants = makeEnterVariants(8, 0.78);
const strongEnterVariants = makeEnterVariants(10, 0.82);

export default function LandingHero() {
    const heroRef = React.useRef<HTMLDivElement | null>(null);
    const reduceMotion = useReducedMotion();
    const isInView = useInView(heroRef, { amount: HERO_IN_VIEW_AMOUNT });
    const floatEnabled = !reduceMotion && isInView;

    return (
        <motion.div
            ref={heroRef}
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: HERO_IN_VIEW_AMOUNT }}
            className="text-center max-w-5xl mx-auto space-y-5 md:space-y-6"
        >
            {/* Main Heading */}
            <div className="space-y-5">
                <motion.div variants={softEnterVariants}>
                    <motion.span className="text-xs sm:text-sm font-bold tracking-widest text-accent-light uppercase bg-accent/10 px-4 py-2 rounded-full inline-block mb-5 text-shadow-hero">
                        Stop guessing. Start shipping.
                    </motion.span>
                </motion.div>
                <h1 className="flex flex-col items-center justify-center font-black text-white leading-[0.9] uppercase italic">
                    <motion.span
                        variants={strongEnterVariants}
                        className="block"
                    >
                        <motion.span
                            animate={floatEnabled ? { y: [0, -2, 0] } : undefined}
                            transition={floatEnabled ? makeFloatTransition(5.8) : undefined}
                            className={HERO_LINE_CLASS}
                        >
                            investor-grade
                        </motion.span>
                    </motion.span>
                    <motion.span
                        variants={strongEnterVariants}
                        className="block"
                    >
                        <motion.span
                            animate={floatEnabled ? { y: [0, -2.4, 0] } : undefined}
                            transition={floatEnabled ? makeFloatTransition(6.2, 0.16) : undefined}
                            className={HERO_LINE_CLASS}
                        >
                            due diligence
                        </motion.span>
                    </motion.span>
                    <motion.span
                        variants={strongEnterVariants}
                        className="mt-6 text-xl sm:text-3xl md:text-4xl font-bold text-accent tracking-wider relative block"
                    >
                        <motion.span className="block">
                            IN UNDER 2 MINUTES
                        </motion.span>
                    </motion.span>
                </h1>
            </div>

            {/* Subheading */}
            <motion.div variants={mediumEnterVariants}>
                <motion.p className="text-base sm:text-lg md:text-xl text-muted max-w-[52rem] mx-auto font-medium leading-relaxed sm:leading-[1.75] tracking-[0.01em] mb-0">
                    Brutally honest feedback on your project idea with <span className="text-white">live market data</span> and <span className="text-white">expert-level analysis</span>.
                </motion.p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={mediumEnterVariants} className="pt-2 sm:pt-3">
                <HeroActions />
            </motion.div>

            {/* Example Activity */}
            <motion.div
                variants={mediumEnterVariants}
                className="pt-8 sm:pt-12"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-[10px] font-bold uppercase tracking-widest text-muted border-white/5">
                    Example analysis: <span className="text-white">$DOGE</span> (Deep audit in ~2m)
                </div>
            </motion.div>

            {/* Trust Signals */}
            <motion.div
                variants={mediumEnterVariants}
                className="pt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-x-12 text-[10px] font-black uppercase tracking-[0.2em] italic text-slate-500/50"
            >
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
            </motion.div>
        </motion.div>
    );
}
