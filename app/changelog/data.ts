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
        version: "1.11.0",
        date: "Feb 05, 2026",
        title: "Studio Polish & Security Hardening",
        description: "A significant polish to the Studio workflow, focusing on clarity, trust, mobile usability, and security hardening.",
        changes: [
            { category: 'feature', text: 'Revamped Post-Report Actions: A unified panel for Sharing, Refining, and Committing insights.' },
            { category: 'feature', text: 'Progressive Logs: New adaptive analysis view that keeps technical details accessible but unobtrusive.' },
            { category: 'improvement', text: 'Evaluation Trust: Refined terminology to strictly distinguish "Data Checks" from "Security verification".' },
            { category: 'improvement', text: 'Mobile Reading Mode: Optimized layout on legal pages for distraction-free reading.' },
            { category: 'fix', text: 'Token Validation: Enhanced error handling for pre-launch and invalid token addresses.' },
            { category: 'security', text: 'Hardening: Configured rewrite for /security.txt to serve centralized disclosure file.' },
            { category: 'removed', text: 'Cleanup: Removed legacy /api/studio/templates endpoint to reduce attack surface.' }
        ]
    },
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
