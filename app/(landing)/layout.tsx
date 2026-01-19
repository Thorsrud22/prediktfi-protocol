export const metadata = {
    title: 'Predikt - Investor-Grade AI Analysis',
    description: 'AI-native evaluator for DeFi and emerging digital assets.',
    icons: {
        icon: '/icon.svg',
    },
};

import '../globals.css';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';

// Optimize font loading
const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable}>
            <body className="bg-slate-900 text-white antialiased">
                {children}
                <Analytics />
            </body>
        </html>
    );
}
