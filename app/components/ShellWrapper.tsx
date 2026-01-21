'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
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
    const searchParams = useSearchParams();
    const isGuestView = searchParams?.get('view') === 'guest';
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAccess = () => {
            const status = getCookie('predikt_auth_status');
            setHasAccess(!!status);
        };

        checkAccess();
    }, []);

    // Public pages where we never show full nav
    const isPublicPage =
        pathname === '/' ||
        pathname === '/redeem' ||
        pathname?.startsWith('/request-access') ||
        pathname?.startsWith('/images/');

    // Hide nav if: guest view explicitly requested, or on public page without access
    const hideNav = isGuestView || (isPublicPage && hasAccess === false);

    if (hideNav) {
        return (
            <>
                <PersistentLogo />
                <main className="min-h-screen pt-24">{children}</main>
            </>
        );
    }

    // While checking access, show minimal shell
    if (hasAccess === null && isPublicPage) {
        return (
            <>
                <PersistentLogo />
                <main className="min-h-screen pt-24">{children}</main>
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

