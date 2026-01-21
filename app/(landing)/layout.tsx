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
            {children}
        </div>
    );
}
