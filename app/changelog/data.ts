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
        version: "1.5.0",
        date: "Jan 25, 2026",
        title: "Quota Synchronization & Terminal UI",
        description: "A major logic overhaul to ensure fairer evaluation limits and a complete visual refresh of the reasoning terminal.",
        changes: [
            { category: 'feature', text: 'Implemented dual-layer rate limiting: Burst Protection (spam) vs Daily Quota (success-based).' },
            { category: 'improvement', text: 'Upgraded Reasoning Terminal with MacOS-style chrome, amber/cyan syntax highlighting, and CRT scanlines.' },
            { category: 'fix', text: 'Resolved persistent HMR module factory error by switching to canonical Lucide icon imports.' },
            { category: 'fix', text: 'Fixed production quota sync issue by normalizing client identifiers (IP/Wallet) across all API routes.' },
            { category: 'removed', text: 'Removed legacy Image Generation features to streamline the evaluation focus.' }
        ]
    },
    {
        version: "1.4.0",
        date: "Jan 25, 2026",
        title: "Security Hardening & Demo Mode",
        description: "Institutional-grade security updates and new onboarding flows.",
        changes: [
            { category: 'security', text: 'Added strict rate limiting for unauthenticated users.' },
            { category: 'feature', text: 'Launched Safe Demo Mode for unauthorized users to preview the Studio experience.' },
            { category: 'improvement', text: 'Enhanced ownership verification for token-gated features.' }
        ]
    },
    {
        version: "1.3.0",
        date: "Jan 24, 2026",
        title: "Gemini 3 Integration",
        description: "The next generation of AI reasoning arrives on PrediktFi.",
        changes: [
            { category: 'feature', text: 'Integrated Gemini 3 Pro model for deeper, more nuanced project evaluations.' },
            { category: 'improvement', text: 'Refined prompts to eliminate "AI slop" and prioritize "institutional degen" tone.' },
            { category: 'feature', text: 'Added real-time streaming for reasoning steps and thoughts.' }
        ]
    }
];
