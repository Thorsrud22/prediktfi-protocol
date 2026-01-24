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
        color: 'from-accent to-accent-light',
        delay: 0
    },
    {
        id: 2,
        title: 'Core Extraction',
        description: 'Advanced analysis deconstructs the project—extracting tokenomics, technical debt, and team intent.',
        icon: BrainCircuit,
        color: 'from-accent-secondary to-accent-secondary-light',
        delay: 0.2
    },
    {
        id: 3,
        title: 'Market Resonance',
        description: 'Real-time cross-referencing against competitor signals, liquidity depth, and narrative trends.',
        icon: Scale,
        color: 'from-accent to-accent-secondary',
        delay: 0.4
    },
    {
        id: 4,
        title: 'Final Verdict',
        description: 'Generate a 0-100 institutional score and a comprehensive risk report with actionable intelligence.',
        icon: FileText,
        color: 'from-white/20 to-white/5',
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
                <div className="text-center mb-16 sm:mb-32 space-y-4">
                    <h2 className="text-[10px] font-black tracking-[0.2em] text-blue-500 uppercase italic border-l-2 border-blue-500 pl-3 inline-block">
                        The Protocol
                    </h2>
                    <h3 className="text-4xl md:text-7xl font-black text-white uppercase italic tracking-tighter">
                        From Idea to <span className="text-blue-500">Verdict</span>
                    </h3>
                </div>

                {/* Timeline Container */}
                <div className="relative">
                    {/* Central Line - Hidden on mobile for cleaner layout */}
                    <div className="timeline-line absolute hidden md:block left-1/2 top-0 bottom-0 w-1 -ml-0.5 bg-gradient-to-b from-blue-600/20 via-blue-500/50 to-indigo-600/20 rounded-full" />

                    <div className="space-y-8 md:space-y-16 lg:space-y-24">
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
                                        <div className="p-10 rounded-[32px] glass-card hover:bg-white/5 transition-all duration-500 group shadow-xl relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex items-center gap-5 mb-5">
                                                <div className={`p-4 rounded-2xl bg-gradient-to-br ${step.color} shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform duration-500`}>
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
                                    <div className="absolute hidden md:block left-1/2 -ml-2.5 w-5 h-5 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)] z-20 ring-4 ring-slate-950" />

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
