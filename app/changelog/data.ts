export interface ChangelogEntry {
    version: string;
    date: string;
    title: string;
    description: string;
    changes: {
        category: 'feature' | 'fix' | 'improvement' | 'security' | 'removed';
        text: string;
    }[];
}

export const changelogData: ChangelogEntry[] = [
    {
        version: "1.7.0",
        date: "Feb 01, 2026",
        title: "Market Intelligence & Security Hardening",
        description: "Major improvements to market data accuracy, security hardening, and grading logic.",
        changes: [
            { category: 'feature', text: 'Integrated Coingecko & Global DeFiLlama for accurate competitor tracking.' },
            { category: 'security', text: 'Implemented strict Content Security Policy (CSP) to mitigate XSS risks.' },
            { category: 'improvement', text: 'Enhanced Analysis Terminal UX with high-visibility progress tracking.' },
            { category: 'fix', text: 'Split "Crypto & Web3" into distinct Memecoin/DeFi categories for better grading.' },
            { category: 'fix', text: 'Fixed Sitemap domain and resolved grading logic mismatches.' }
        ]
    },
    {
        version: "1.6.0",
        date: "Jan 26, 2026",
        title: "Visual Overhaul & Performance",
        description: "A complete refresh of the PrediktFi interface with improved performance and a cleaner aesthetic.",
        changes: [
            { category: 'feature', text: 'New "Predikt" branding and simplified navigation structure.' },
            { category: 'improvement', text: 'Redesigned Changelog with categorized updates and clean list view.' },
            { category: 'improvement', text: 'Optimized animation performance for smoother scrolling on all devices.' },
            { category: 'fix', text: 'Fixed layout shifting issues on mobile viewports.' },
            { category: 'security', text: 'Enhanced headers for better protection against XSS attacks.' }
        ]
    }
];
