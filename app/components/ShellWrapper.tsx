'use client';

import { usePathname } from 'next/navigation';
import Aurora from './ui/Aurora';

interface ShellWrapperProps {
    children: React.ReactNode;
    navbar: React.ReactNode;
    footer: React.ReactNode;
}

export default function ShellWrapper({ children, navbar, footer }: ShellWrapperProps) {
    const pathname = usePathname();

    // Routes that should NOT have the app shell (navbar, footer, padding, global aurora)
    // BUT: If user is authenticated (public cookie), we WANT the shell on the home page
    const hasAuth = typeof document !== 'undefined' && document.cookie.includes('predikt_auth_status=1');

    const isPublicShell =
        (pathname === '/' && !hasAuth) ||
        pathname === '/redeem' ||
        pathname?.startsWith('/request-access') ||
        pathname?.startsWith('/images/'); // Pure images don't need shell if accessed directly

    // Persistent Aurora background - Global for seamless transitions
    const auroraBg = (
        <Aurora
            colorStops={['#0F172A', '#38bdf8', '#2563EB']}
            amplitude={1.2}
            blend={0.6}
            speed={0.5}
            className="fixed inset-0 -z-10"
        />
    );

    const gradientOverlay = (
        <div className="fixed inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900 -z-[9]" />
    );

    if (isPublicShell) {
        return (
            <>
                {auroraBg}
                <main className="min-h-screen">{children}</main>
            </>
        );
    }

    return (
        <>
            {auroraBg}
            {gradientOverlay}

            {navbar}
            <main className="flex min-h-screen flex-col pt-24">
                {children}
            </main>
            {footer}
        </>
    );
}
