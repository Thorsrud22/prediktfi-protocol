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
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAccess = () => {
            const status = getCookie('predikt_auth_status');
            setHasAccess(!!status);
        };

        checkAccess();

        // Listen for access change events from dev toggle
        const handleAccessChange = () => checkAccess();
        window.addEventListener('predikt-access-changed', handleAccessChange);

        return () => window.removeEventListener('predikt-access-changed', handleAccessChange);
    }, []);

    // Don't render for invited users (they see AppPillNav instead)
    if (hasAccess === true) return null;

    // Don't render while checking (avoid flash)
    if (hasAccess === null) return null;

    return (
        <div className="fixed top-3 left-4 sm:left-6 z-50 animate-in fade-in zoom-in duration-500">
            <InstantLink
                href="/"
                className="group flex items-center gap-2.5 rounded-full bg-slate-900/95 px-2.5 py-1.5 pr-4 ring-1 ring-inset ring-white/10 transition-all hover:ring-white/20 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] duration-300"
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
                <span className="font-inter text-base font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
                    Predikt
                </span>
            </InstantLink>
        </div>
    );
}

