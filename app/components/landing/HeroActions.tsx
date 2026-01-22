'use client';

import React, { useEffect, useState } from 'react';
import { InstantLink } from '../InstantLink';
import { useRouter } from 'next/navigation';

function getCookie(name: string) {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
}

function setCookie(name: string, value: string, days: number = 30) {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

function deleteCookie(name: string) {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export default function HeroActions() {
    const [hasAccess, setHasAccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const checkAccess = () => {
            // Check public status cookie first (fastest)
            const status = getCookie('predikt_auth_status');
            setHasAccess(!!status);
            setIsLoading(false);
        };
        checkAccess();
    }, []);

    // Prevent hydration mismatch by rendering a placeholder or default valid state initially
    // However, for SEO/Performance on hero, we might default to Request Access
    // and only swap if we detect the cookie client-side.

    return (
        <div className="flex flex-col items-center justify-center gap-4 pt-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in zoom-in duration-300">
                <InstantLink
                    href="/studio"
                    className="btn-shimmer px-10 py-5 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] italic shadow-lg shadow-blue-900/40 transition-all duration-300 hover:brightness-110 min-w-[220px] text-center"
                >
                    <span className="relative">
                        Start Validation
                    </span>
                </InstantLink>

                <InstantLink
                    href="/example-report"
                    className="px-10 py-5 rounded-2xl bg-white/5 border border-white/5 text-slate-300 font-black text-xs uppercase tracking-[0.2em] italic hover:bg-white/10 hover:border-white/10 transition-all duration-300 min-w-[220px] text-center"
                >
                    View Sample Report
                </InstantLink>
            </div>

        </div>
    );
}

