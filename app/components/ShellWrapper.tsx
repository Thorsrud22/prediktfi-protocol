'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import PersistentLogo from './PersistentLogo';

interface ShellWrapperProps {
    children: React.ReactNode;
    navbar: React.ReactNode;
    footer: React.ReactNode;
}

export default function ShellWrapper({ children, navbar, footer }: ShellWrapperProps) {
    const pathname = usePathname();
    const isPricingRoute = pathname === '/pricing' || pathname.startsWith('/pricing/');


    // We now allow full navigation for everyone (Public Beta)
    // Legacy logic for hiding nav is removed.
    // Changelog now uses standard global navigation.


    return (
        <>
            {isPricingRoute && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 -z-[8] bg-[#0f1012]/93"
                />
            )}
            <PersistentLogo />
            {navbar}
            <main className="flex min-h-screen flex-col pt-24">
                {children}
            </main>
            {footer}
        </>
    );
}
