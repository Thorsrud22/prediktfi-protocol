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
            {!isLoading && hasAccess ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in zoom-in duration-300">
                    <InstantLink
                        href="/studio"
                        className="btn-shimmer px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-semibold text-lg shadow-md transition-all duration-200 ease-out hover:brightness-105 min-w-[200px] text-center"
                    >
                        <span className="relative">
                            Start Validation
                        </span>
                    </InstantLink>

                    <InstantLink
                        href="/example-report"
                        className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-medium text-lg hover:bg-white/10 hover:border-white/30 transition-all duration-300 backdrop-blur-sm min-w-[200px] text-center"
                    >
                        View Sample Report
                    </InstantLink>
                </div>
            ) : (
                <>
                    <InstantLink
                        href="/request-access"
                        className="btn-shimmer px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-semibold text-lg shadow-md transition-all duration-200 ease-out hover:brightness-105"
                    >
                        <span className="relative">
                            Request Access
                        </span>
                    </InstantLink>
                    <InstantLink
                        href="/redeem"
                        className="text-slate-400 hover:text-white transition-colors text-sm underline underline-offset-4"
                    >
                        Already have access?
                    </InstantLink>
                </>
            )}
        </div>
    );
}
