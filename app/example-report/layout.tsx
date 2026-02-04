import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sample Evaluation Report • PrediktFi',
    description: 'See an example of the deep AI-powered analysis you receive from PrediktFi. Institutional-grade evaluation for Web3 projects.',
    alternates: {
        canonical: '/example-report',
    },
    openGraph: {
        title: 'Sample Evaluation Report • PrediktFi',
        description: 'See an example of the deep AI-powered analysis you receive from PrediktFi.',
        type: 'website',
    },
};

export default function ExampleReportLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
