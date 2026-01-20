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
    const isPublicShell =
        pathname === '/' ||
        pathname === '/redeem' ||
        pathname?.startsWith('/request-access') ||
        pathname?.startsWith('/images/'); // Pure images don't need shell if accessed directly

    if (isPublicShell) {
        return <main className="min-h-screen">{children}</main>;
    }

    return (
        <>
            {/* Persistent Aurora background - App Specific (Blue/Cyan) */}
            <Aurora
                colorStops={['#0ea5e9', '#3b82f6', '#0ea5e9']}
                amplitude={1.2}
                blend={0.6}
                speed={0.8}
                className="fixed inset-0 -z-10"
            />
            {/* Gradient overlay for text readability */}
            <div className="fixed inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900 -z-[9]" />

            {navbar}
            <main className="flex min-h-screen flex-col pt-24">
                {children}
            </main>
            {footer}
        </>
    );
}
