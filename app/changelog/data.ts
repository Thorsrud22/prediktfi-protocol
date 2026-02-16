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

export const changelogData = [
    {
        version: "1.15.0",
        date: "2026-02-16",
        title: "Deterministic Analysis & Report Visualization",
        description: "A major update to the evaluation engine's reliability and the visual depth of the institutional report.",
        changes: [
            { category: 'feature', text: 'Deterministic Parsing: Refactored engine to use typed JSON objects for analysis, achieving 100% sub-score parse accuracy across all project types.' },
            { category: 'improvement', text: 'Structured Analysis UX: New report section featuring animated score bars, collapsible evidence lists, and explicit uncertainty callouts.' },
            { category: 'fix', text: 'Engine Reliability: Increased LLM reasoning timeouts and hardened competitive research pipeline for more stable deep-data extraction.' },
            { category: 'fix', text: 'Icon Architecture: Replaced barrel icon imports with inline SVG components to resolve dynamic chunk loading issues in the studio.' }
        ]
    },
    {
        version: "1.14.0",
        date: "2026-02-14",
        title: "Studio Architecture Upgrade & Reliability Hardening",
        description: "A major two-day release focused on evaluation quality, studio maintainability, and production reliability.",
        changes: [
            { category: 'feature', text: 'Studio Wizard Refactor: Rebuilt submission flow into modular step components and dedicated state/navigation/persistence hooks.' },
            { category: 'feature', text: 'Trust + Accuracy Pipeline: Integrated evidence-backed committee evaluation with routing/verifier support for stronger final verdict quality.' },
            { category: 'improvement', text: 'Report UX Overhaul: Expanded institutional report surfaces including committee debate context, evidence visibility, and risk/trust sections.' },
            { category: 'fix', text: 'Evaluation API Improvements: Upgraded sync + streaming evaluation paths with category-aware preflight behavior and tighter runtime flow.' },
            { category: 'fix', text: 'Reliability Hardening: Shipped critical fixes to chart accessibility/guards, URL validation edge cases, and client performance instrumentation accuracy.' }
        ]
    },
    {
        version: "1.13.0",
        date: "2026-02-08",
        title: "The Committee Update & AI Verification",
        description: "Major architectural upgrade to the evaluation engine, introducing Multi-Agent Verdicts and universal security scanning for AI agents.",
        changes: [
            { category: 'feature', text: 'Evaluation Committee: New Bear/Bull/Judge agent architecture for balanced, debate-style analysis.' },
            { category: 'feature', text: 'Verdict Cards: Replaced generic comments with specific "AVOID" vs "ALL IN" theses.' },
            { category: 'security', text: 'Universal Scanning: Security checks (RugCheck, Liquidity) now active for AI Agent tokens.' },
            { category: 'improvement', text: 'Trust Signals: Explicit "Verified" vs "Simulated" badges for on-chain data.' },
            { category: 'improvement', text: 'Example Report: Updated to reflect the new "Institutional Grade" standard.' }
        ]
    },
    {
        version: "1.12.0",
        date: "2026-02-06",
        title: "Security, Trust & UX Enhancements",
        description: "Significant improvements to the authentication experience, security messaging, and first-time user flow.",
        changes: [
            { category: 'improvement', text: 'Updated Account page with clearer "Sign In" vs "Dashboard" states.' },
            { category: 'improvement', text: 'Added explicit trust signals to wallet connection (Signature only, No seed phrase).' },
            { category: 'improvement', text: 'Improved wallet benefit messaging in "Why a Wallet?".' },
            { category: 'feature', text: 'Added "Continue without login" flow for quicker access to Studio.' },
            { category: 'improvement', text: 'Refined Token Address label to explicitly mention Solana.' },
            { category: 'security', text: 'Hardening: Enforced strict visual warnings for unverified share links.' },
            { category: 'improvement', text: 'Reset evaluation quotas for all users.' }
        ]
    },
    {
        version: "1.11.0",
        date: "2026-02-05",
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
        date: "2026-02-04",
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
    // Versions 1.8.0-1.9.0 were internal-only releases and are intentionally omitted.
    {
        version: "1.7.0",
        date: "2026-02-01",
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
        date: "2026-01-26",
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
] satisfies ChangelogEntry[];
