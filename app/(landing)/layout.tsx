import Aurora from '../components/ui/Aurora';

export const metadata = {
    title: 'Predikt - Investor-Grade AI Analysis',
    description: 'AI-native evaluator for DeFi and emerging digital assets.',
    icons: {
        icon: '/icon.svg',
    },
};

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen">
            {/* Shared Aurora Background - persists across pages */}
            <Aurora
                colorStops={['#0F172A', '#38bdf8', '#2563EB']}
                speed={0.5}
                amplitude={1.2}
                className="fixed inset-0 -z-10 scale-[2.0] md:scale-100"
            />
            {children}
        </div>
    );
}
