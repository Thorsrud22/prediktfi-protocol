'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { InstantLink } from './InstantLink';

const SCROLL_THRESHOLD = 50;

export default function PersistentLogo() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        let frame = -1;
        const handleScroll = () => {
            if (frame === -1) {
                frame = window.requestAnimationFrame(() => {
                    setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
                    frame = -1;
                });
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (frame !== -1) {
                window.cancelAnimationFrame(frame);
            }
        };
    }, []);

    // During SSR/initial mount, render with default state to prevent hydration mismatch/layout shift
    const scaleClass = mounted && isScrolled ? 'scale-[0.98]' : 'scale-100';

    return (
        <div
            className={`fixed top-6 left-6 z-[9999] flex items-center gap-2 transition-transform duration-300 ${scaleClass}`}
        >
            <InstantLink
                href="/"
                className="group flex items-center gap-1.5 rounded-full bg-slate-900/95 px-2 py-1 sm:pr-3 ring-1 ring-inset ring-white/10 transition-all hover:ring-white/20 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] duration-300"
                aria-label="Predikt home"
            >
                <span className="relative flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-950 ring-1 ring-white/20 shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-700 group-hover:scale-125 group-hover:shadow-[0_0_50px_rgba(59,130,246,0.8)] group-hover:ring-white/50 overflow-hidden">
                    <Image
                        src="/images/logo.png"
                        alt="Predikt logo"
                        width={40}
                        height={40}
                        className="absolute inset-0 h-full w-full object-cover scale-[1.3] transition-all duration-1000 ease-out group-hover:scale-[1.5] group-hover:animate-[spin_1s_linear_infinite]"
                        priority
                    />

                    {/* High-speed "Hyper-drive" Energy Glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(59,130,246,0.8)_180deg,transparent_360deg)] animate-[spin_0.6s_linear_infinite]" />
                        <div className="absolute inset-0.5 rounded-full bg-slate-950/40 backdrop-blur-[2px]" />

                        {/* Rapid pulse ring */}
                        <div className="absolute inset-0 rounded-full border border-blue-400/50 animate-ping opacity-20" />
                    </div>

                    {/* High-intensity highlight */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/30 via-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </span>
                <span className="font-inter text-base sm:text-lg font-black tracking-tighter bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)] hidden sm:inline-block">
                    Predikt
                </span>
            </InstantLink>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] border border-white/5 bg-white/5 px-1.5 py-0.5 rounded-md select-none pointer-events-none">
                v1
            </span>
        </div>
    );
}
