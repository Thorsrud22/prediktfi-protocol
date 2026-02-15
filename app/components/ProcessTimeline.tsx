'use client';

import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    Lightbulb,
    BrainCircuit,
    Scale,
    FileText
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
    {
        id: 1,
        title: 'Submit Concept',
        description: 'Initialize the protocol with your ticker or project abstract. Workspace prepares for deep analysis.',
        icon: Lightbulb,
    },
    {
        id: 2,
        title: 'Core Extraction',
        description: 'Advanced analysis deconstructs the project—extracting tokenomics, technical debt, and team intent.',
        icon: BrainCircuit,
    },
    {
        id: 3,
        title: 'Market Resonance',
        description: 'Real-time cross-referencing against competitor signals, liquidity depth, and narrative trends.',
        icon: Scale,
    },
    {
        id: 4,
        title: 'Final Verdict',
        description: 'Generate a 0-100 institutional score and a comprehensive risk report with actionable intelligence.',
        icon: FileText,
    }
];

export default function ProcessTimeline() {
    const containerRef = useRef<HTMLDivElement>(null);
    const stepsRef = useRef<(HTMLLIElement | null)[]>([]);

    useLayoutEffect(() => {
        const mm = gsap.matchMedia();
        const ctx = gsap.context(() => {
            // Animate the central line (One-time animation, no scrubbing for performance)
            gsap.from('.timeline-line', {
                scaleY: 0,
                transformOrigin: 'top center',
                duration: 2,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top 70%',
                    toggleActions: 'play none none reverse'
                }
            });

            // Animate each step
            stepsRef.current.forEach((step, index) => {
                if (!step) return;

                const isLeft = index % 2 === 0;

                mm.add(
                    {
                        desktop: '(min-width: 768px)',
                        reducedMotion: '(prefers-reduced-motion: reduce)',
                    },
                    (context: gsap.Context) => {
                        const desktop = !!context.conditions?.desktop;
                        const reducedMotion = !!context.conditions?.reducedMotion;

                        if (reducedMotion) return;

                        gsap.from(step, {
                            opacity: 0,
                            x: desktop ? (isLeft ? -30 : 30) : 0,
                            y: desktop ? 0 : 20,
                            duration: 0.6,
                            ease: 'power2.out',
                            scrollTrigger: {
                                trigger: step,
                                start: 'top 85%',
                                toggleActions: 'play none none reverse'
                            }
                        });
                    }
                );
            });
        }, containerRef);

        return () => {
            mm.revert();
            ctx.revert();
        };
    }, []);

    return (
        <section
            ref={containerRef}
            aria-labelledby="process-timeline-heading"
            className="relative py-20 sm:py-32 px-5 sm:px-6 overflow-hidden"
        >
            {/* Background Glow - Optimized */}
            <div
                aria-hidden="true"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 60%)'
                }}
            />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16 sm:mb-32 space-y-4">
                    <p className="text-xs font-bold tracking-widest text-blue-500 uppercase italic border-l-2 border-blue-500 pl-3 inline-block">
                        The Protocol
                    </p>
                    <h2 id="process-timeline-heading" className="text-4xl md:text-7xl font-black text-white uppercase italic tracking-tighter">
                        From Idea to <span className="text-blue-500">Verdict</span>
                    </h2>
                </div>

                {/* Timeline Container */}
                <div className="relative">
                    {/* Central Line - Hidden on mobile for cleaner layout */}
                    <div
                        aria-hidden="true"
                        className="timeline-line absolute hidden md:block left-1/2 top-0 bottom-0 w-1 -ml-0.5 bg-gradient-to-b from-blue-600/20 via-blue-500/50 to-indigo-600/20 rounded-full"
                    />

                    <ol className="space-y-8 md:space-y-16 lg:space-y-24 list-none m-0 p-0">
                        {STEPS.map((step, index) => {
                            const isEven = index % 2 === 0;
                            return (
                                <li
                                    key={step.id}
                                    ref={el => { stepsRef.current[index] = el }}
                                    className={`relative flex flex-col md:flex-row gap-6 md:gap-24 items-center ${isEven ? 'md:flex-row-reverse' : ''
                                        }`}
                                >
                                    {/* Content Side */}
                                    <div className="flex-1 w-full md:w-1/2">
                                        <div className="p-10 rounded-[32px] glass-card hover:bg-white/5 transition-all duration-500 group shadow-xl relative overflow-hidden">
                                            <div className={`absolute top-0 w-1 h-full bg-gradient-to-b from-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity ${isEven ? 'left-0' : 'left-0 md:left-auto md:right-0'}`} />
                                            <div className="flex items-center gap-5 mb-5">
                                                <div className="p-4 rounded-2xl bg-gradient-to-br from-black to-gray-900 shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform duration-500">
                                                    <step.icon className="w-6 h-6 text-white" />
                                                </div>
                                                <h4 className="text-2xl font-black text-white uppercase italic tracking-tight">{step.title}</h4>
                                            </div>
                                            <p className="text-muted leading-relaxed font-medium">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Center Dot - Hidden on mobile */}
                                    <div
                                        aria-hidden="true"
                                        className="absolute hidden md:block left-1/2 -ml-2.5 w-5 h-5 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)] z-20 ring-4 ring-slate-950"
                                    />

                                    {/* Empty Side (for Desktop layout balance) */}
                                    <div className="hidden md:block flex-1 w-1/2" />
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </div>
        </section>
    );
}
