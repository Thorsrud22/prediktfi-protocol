import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Studio • PrediktFi',
    description: 'AI-powered evaluation studio for Web3 projects. Get institutional-grade analysis of your memecoin, DeFi, or AI project.',
    alternates: {
        canonical: '/studio',
    },
    openGraph: {
        title: 'Studio • PrediktFi',
        description: 'AI-powered evaluation studio for Web3 projects.',
        type: 'website',
    },
};

export default function StudioLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
