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
        version: "1.10.0",
        date: "Feb 04, 2026",
        title: "SEO, CMS & UX Hardening",
        description: "Comprehensive update focusing on SEO correctness, legal compliance, accessibility, and sharing capabilities.",
        changes: [
            { category: 'feature', text: 'Added "Copy Link" features to evaluation reports.' },
            { category: 'feature', text: 'Added /.well-known/security.txt for vulnerability disclosure.' },
            { category: 'fix', text: 'Fixed Canonical Tags to prevent localhost indexing issues.' },
            { category: 'fix', text: 'Updated Sitemap to include pricing, legal, and share pages.' },
            { category: 'fix', text: 'Consolidated Privacy Policy pages and added proper redirects.' },
            { category: 'fix', text: 'Improved Studio form accessibility with aria-labels.' },
            { category: 'improvement', text: 'Updated "Print / Save PDF" button for better user expectations.' },
            { category: 'improvement', text: 'Hardened Content Security Policy (CSP) for production.' }
        ]
    },
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
