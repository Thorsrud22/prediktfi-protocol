'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { InstantLink } from '../InstantLink';

function getCookie(name: string) {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
}

export default function LandingPill() {
    const [hasAuth, setHasAuth] = useState(false);

    useEffect(() => {
        // Check if user is authenticated via the public status cookie
        // If so, we hide this pill because the Global App Shell will show the main nav instead
        const status = getCookie('predikt_auth_status');
        setHasAuth(!!status);
    }, []);

    // If authenticated, render nothing (to avoid double nav)
    if (hasAuth) return null;

    return (
        <div className="fixed top-3 left-4 sm:left-6 z-50 animate-in fade-in zoom-in duration-500">
            <InstantLink
                href="/"
                className="group flex items-center gap-2.5 rounded-full bg-slate-900/90 px-2.5 py-1.5 pr-4 ring-1 ring-inset ring-white/10 transition-all hover:ring-white/20 duration-300"
                aria-label="Predikt home"
            >
                <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-white/20 transition-all duration-300 group-hover:scale-110 group-hover:ring-white/30">
                    <Image
                        src="/images/predikt-orb.svg"
                        alt="Predikt logo"
                        width={36}
                        height={36}
                        className="h-full w-full object-contain p-0.5 drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
                        priority
                    />
                    {/* Subtle rotating glow effect */}
                    <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/20 via-transparent to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                </span>
                <span className="font-inter text-base font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
                    Predikt
                </span>
            </InstantLink>
        </div>
    );
}
