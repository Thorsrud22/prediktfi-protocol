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
        title: 'Submit Idea',
        description: 'Enter your ticker or concept. Our system instantly prepares the workspace for deep analysis.',
        icon: Lightbulb,
        color: 'from-blue-500 to-cyan-400',
        delay: 0
    },
    {
        id: 2,
        title: 'AI Swarm Analysis',
        description: 'Multiple AI agents dive deep—analyzing tokenomics, whitepapers, and team backgrounds.',
        icon: BrainCircuit,
        color: 'from-cyan-400 to-teal-400',
        delay: 0.2
    },
    {
        id: 3,
        title: 'Market Validation',
        description: 'We cross-reference with live market data, competitor landscape, and historical sentiment.',
        icon: Scale,
        color: 'from-teal-400 to-emerald-400',
        delay: 0.4
    },
    {
        id: 4,
        title: 'Verdict & Report',
        description: 'Receive a final 0-100 score and a comprehensive report with actionable insights.',
        icon: FileText,
        color: 'from-emerald-400 to-green-400',
        delay: 0.6
    }
];

export default function ProcessTimeline() {
    const containerRef = useRef<HTMLDivElement>(null);
    const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

    useLayoutEffect(() => {
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
                    toggleActions: 'play none none none' // Play once
                }
            });

            // Animate each step
            stepsRef.current.forEach((step, index) => {
                if (!step) return;

                const isLeft = index % 2 === 0;

                gsap.fromTo(step,
                    {
                        opacity: 0,
                        x: isLeft ? -30 : 30, // Reduced travel distance
                    },
                    {
                        opacity: 1,
                        x: 0,
                        duration: 0.6,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: step,
                            start: 'top 85%',
                            toggleActions: 'play none none reverse'
                        }
                    }
                );
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="relative py-20 sm:py-32 px-5 sm:px-6 overflow-hidden">
            {/* Background Glow - Optimized */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 60%)'
                }}
            />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16 sm:mb-32 space-y-3 sm:space-y-4">
                    <h2 className="text-sm font-bold tracking-[0.2em] text-cyan-400 uppercase">
                        The Process
                    </h2>
                    <h3 className="text-3xl md:text-5xl font-bold text-white">
                        From Idea to <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Verdict</span>
                    </h3>
                </div>

                {/* Timeline Container */}
                <div className="relative">
                    {/* Central Line - Hidden on mobile for cleaner layout */}
                    <div className="timeline-line absolute hidden md:block left-1/2 top-0 bottom-0 w-1 -ml-0.5 bg-gradient-to-b from-blue-500/20 via-cyan-500/50 to-emerald-500/20 rounded-full" />

                    <div className="space-y-8 sm:space-y-24">
                        {STEPS.map((step, index) => {
                            const isEven = index % 2 === 0;
                            return (
                                <div
                                    key={step.id}
                                    ref={el => { stepsRef.current[index] = el }}
                                    className={`relative flex flex-col md:flex-row gap-6 md:gap-24 items-center ${isEven ? 'md:flex-row-reverse' : ''
                                        }`}
                                >
                                    {/* Content Side */}
                                    <div className="flex-1 w-full md:w-1/2">
                                        <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800/50 hover:bg-slate-800/80 hover:border-cyan-500/30 transition-all duration-300 group shadow-2xl">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className={`p-3 rounded-xl bg-gradient-to-br ${step.color} bg-opacity-10 opacity-90 group-hover:scale-110 transition-transform duration-300`}>
                                                    <step.icon className="w-6 h-6 text-white" />
                                                </div>
                                                <h4 className="text-xl font-bold text-white">{step.title}</h4>
                                            </div>
                                            <p className="text-slate-400 leading-relaxed">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Center Dot - Hidden on mobile */}
                                    <div className="absolute hidden md:block left-1/2 -ml-2 w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)] z-20 ring-4 ring-slate-950" />

                                    {/* Empty Side (for Desktop layout balance) */}
                                    <div className="hidden md:block flex-1 w-1/2" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
