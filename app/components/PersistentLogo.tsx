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
            className={`fixed top-6 left-6 z-[9999] transition-transform duration-300 ${scaleClass}`}
        >
            <InstantLink
                href="/"
                className="group flex items-center gap-2.5 rounded-full bg-slate-900/95 px-2.5 py-1.5 sm:pr-4 ring-1 ring-inset ring-white/10 transition-all hover:ring-white/20 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] duration-300"
                aria-label="Predikt home"
            >
                <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/20 shadow-[0_8px_32px_rgba(59,130,246,0.4)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_12px_40px_rgba(59,130,246,0.6)] group-hover:ring-white/30 overflow-hidden">
                    <Image
                        src="/images/logo.png"
                        alt="Predikt logo"
                        width={40}
                        height={40}
                        className="absolute inset-0 h-full w-full object-cover scale-[1.3]"
                        priority
                    />
                    {/* Subtle rotating glow effect */}
                    <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/20 via-transparent to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                </span>
                <span className="font-inter text-base font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)] hidden sm:inline-block">
                    Predikt
                </span>
            </InstantLink>
        </div>
    );
}
