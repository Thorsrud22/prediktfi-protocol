import { EvidenceClaim, EvidencePack } from "@/lib/ai/evidenceTypes";

export interface CompetitiveMemo {
    // Core Fields
    /**
     * e.g. "DeFi - Lending", "Memecoin - Animal", "AI - Infra"
     */
    categoryLabel: string;

    crowdednessLevel: 'empty' | 'moderate' | 'high' | 'saturated';

    /**
     * A 1-2 sentence summary of the current landscape for this specific idea.
     */
    shortLandscapeSummary: string;

    referenceProjects: ReferenceProject[];

    tractionDifficulty: {
        label: 'low' | 'medium' | 'high' | 'extreme';
        explanation: string;
    };

    differentiationWindow: {
        label: 'wide_open' | 'narrow' | 'closed';
        explanation: string;
    };

    noiseVsSignal: 'mostly_noise' | 'mixed' | 'high_signal';

    /**
     * Additional notes from the evaluator about specific risks or opportunities.
     */
    evaluatorNotes: string;

    /**
     * Key claims the scout is making. Facts should include supporting evidence IDs.
     */
    claims: EvidenceClaim[];

    // Category Specific Hints (Optional/Nullable)
    memecoin?: {
        narrativeLabel: string;
        narrativeCrowdedness: 'low' | 'medium' | 'high';
    };
    defi?: {
        defiBucket: string;
        categoryKings: string[];
    };
    ai?: {
        aiPattern: string;
        moatType: string;
    };

    timestamp: string;
}

export interface ReferenceProject {
    name: string;
    chainOrPlatform: string;
    note: string;
    metrics?: {
        marketCap?: string;
        tvl?: string;
        dailyUsers?: string;
        funding?: string; // e.g. "$5M Seed"
        revenue?: string;
    };
}

export type CompetitiveMemoResult =
    | { status: 'ok'; memo: CompetitiveMemo; evidencePack: EvidencePack }
    | { status: 'not_available'; reason: string };
