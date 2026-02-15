export const WIZARD_CONSTANTS = {
    DEBOUNCE_MS: 500,
    NAV_COOLDOWN_MS: 50,
    FOCUS_RETRIES: 6,
    FOCUS_RETRY_DELAY_MS: 50,
    MIN_NAME_LENGTH: 3,
    MIN_PITCH_CHARS: 10,
    SAVED_MSG_DURATION: 2000,
    SCROLL_DELAY_MS: 10,
} as const;

import { Cpu, Globe, Zap, Palette, Gamepad2, MoreHorizontal } from 'lucide-react';

export const STEPS = [
    { id: 'sector', title: 'Select Sector', subtitle: 'What area does your project belong to?' },
    { id: 'details', title: 'Project Identity', subtitle: 'Give it a name or ticker.' },
    { id: 'pitch', title: 'The Pitch', subtitle: 'Describe your vision in detail.' },
    { id: 'insights', title: 'Strategic Insights', subtitle: 'Add more context for a deeper analysis.' },
    { id: 'review', title: 'Ready to Launch?', subtitle: 'Review your submission.' }
] as const;

export type StepId = (typeof STEPS)[number]['id'];

function stepIndex(id: StepId): number {
    const idx = STEPS.findIndex((step) => step.id === id);
    if (idx === -1) throw new Error(`Unknown step: ${id}`);
    return idx;
}

export const STEP_INDEX = {
    SECTOR: stepIndex('sector'),
    DETAILS: stepIndex('details'),
    PITCH: stepIndex('pitch'),
    INSIGHTS: stepIndex('insights'),
    REVIEW: stepIndex('review'),
} as const;

export const SECTOR_OPTIONS = [
    { id: 'ai', icon: Cpu, label: 'AI Agent', desc: 'LLM & Infra', colorClass: 'text-purple-400' },
    { id: 'defi', icon: Globe, label: 'DeFi / Utility', desc: 'Protocol & Yield', colorClass: 'text-blue-400' },
    { id: 'memecoin', icon: Zap, label: 'Memecoin', desc: 'Viral & Hype', colorClass: 'text-yellow-400' },
    { id: 'nft', icon: Palette, label: 'NFT / Art', desc: 'Digital Collectibles', colorClass: 'text-pink-400' },
    { id: 'gaming', icon: Gamepad2, label: 'Gaming', desc: 'GameFi & Metaverse', colorClass: 'text-emerald-400' },
    { id: 'other', icon: MoreHorizontal, label: 'Other', desc: 'Everything Else', colorClass: 'text-slate-300' },
] as const;
