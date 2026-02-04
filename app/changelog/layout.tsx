import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Changelog • PrediktFi',
    description: 'See what\'s new in PrediktFi. Latest updates, improvements, and feature releases.',
    alternates: {
        canonical: '/changelog',
    },
    openGraph: {
        title: 'Changelog • PrediktFi',
        description: 'See what\'s new in PrediktFi. Latest updates, improvements, and feature releases.',
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
