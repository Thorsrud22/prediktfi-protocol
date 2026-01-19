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
import Aurora from '../components/ui/Aurora';

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
            <body className="bg-[#0F172A] text-white antialiased">
                {/* Shared Aurora Background - persists across pages */}
                <Aurora
                    colorStops={['#0F172A', '#38bdf8', '#2563EB']}
                    speed={0.5}
                    amplitude={1.2}
                    className="fixed inset-0 -z-10 scale-[2.0] md:scale-100"
                />
                {children}
                <Analytics />
            </body>
        </html>
    );
}
