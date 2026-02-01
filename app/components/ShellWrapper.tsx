'use client';

import { usePathname } from 'next/navigation';
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


    // We now allow full navigation for everyone (Public Beta)
    // Legacy logic for hiding nav is removed.
    // Changelog now uses standard global navigation.


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

