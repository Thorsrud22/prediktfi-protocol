import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Changelog • Predikt',
    description: "Stay updated with the latest features, improvements, and fixes in Predikt - the AI-powered evaluation protocol.",
    alternates: {
        canonical: '/changelog',
    },
    openGraph: {
        title: 'Changelog • Predikt',
        description: "Stay updated with the latest features, improvements, and fixes in Predikt.",
        type: 'website',
    },
};

export default function ChangelogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
