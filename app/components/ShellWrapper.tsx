'use client';

import { usePathname, useRouter } from 'next/navigation';
import PersistentLogo from './PersistentLogo';

interface ShellWrapperProps {
    children: React.ReactNode;
    navbar: React.ReactNode;
    footer: React.ReactNode;
}

function getCookie(name: string) {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
}

export default function ShellWrapper({ children, navbar, footer }: ShellWrapperProps) {
    const pathname = usePathname();
    const router = useRouter();


    // We now allow full navigation for everyone (Public Beta)
    // Legacy logic for hiding nav is removed.
    // Changelog now uses standard global navigation.

    const isStudio = pathname?.startsWith('/studio');
    const isPricing = pathname === '/pricing';

    const handlePricingBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
            return;
        }
        router.push('/studio');
    };

    if (isStudio) {
        return (
            <>
                {/* Minimal Studio Header */}
                <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 pointer-events-none">
                    {/* Back Arrow - click to home */}
                    <a
                        href="/"
                        className="pointer-events-auto group flex items-center justify-center h-9 w-9 rounded-lg bg-black/45 border border-white/10 text-white/80 shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out hover:bg-black/65 hover:border-white/20 hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                        aria-label="Back to Home"
                    >
                        <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transition-transform duration-200 ease-out group-hover:-translate-x-0.5 group-active:-translate-x-1 motion-reduce:transform-none"
                        >
                            <path d="M19 12H5" />
                            <path d="M12 19l-7-7 7-7" />
                        </svg>
                    </a>
                </header>

                <main className="flex min-h-screen flex-col pt-0">
                    {children}
                </main>
            </>
        );
    }

    if (isPricing) {
        return (
            <>
                <header className="fixed top-4 left-4 z-50">
                    <button
                        type="button"
                        onClick={handlePricingBack}
                        className="group flex items-center justify-center h-9 w-9 rounded-lg bg-black/45 border border-white/10 text-white/80 shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out hover:bg-black/65 hover:border-white/20 hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                        aria-label="Go back"
                    >
                        <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transition-transform duration-200 ease-out group-hover:-translate-x-0.5 group-active:-translate-x-1 motion-reduce:transform-none"
                        >
                            <path d="M19 12H5" />
                            <path d="M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                </header>

                <main className="flex min-h-screen flex-col pt-16">
                    {children}
                </main>
            </>
        );
    }

    return (
        <>
            <PersistentLogo />
            {navbar}
            <main className="flex min-h-screen flex-col pt-24">
                {children}
            </main>
            {footer}
        </>
    );
}
