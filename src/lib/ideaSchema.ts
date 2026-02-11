import { z } from 'zod';

const PROJECT_TYPES = ['memecoin', 'defi', 'ai', 'nft', 'gaming', 'other'] as const;

/**
 * Validate Solana address format (base58, 32-44 chars)
 */
function isValidSolanaAddress(address: string): boolean {
    if (!address || address.length < 32 || address.length > 44) return false;
    // Base58 character set (no 0, O, I, l)
    return /^[1-9A-HJ-NP-Za-km-z]+$/.test(address);
}

export const ideaSubmissionSchema = z.object({
    description: z.string().refine(
        (value) => value.replace(/\s/g, '').length >= 10,
        { message: 'Description must be at least 10 non-space characters long' }
    ),
    projectType: z.enum(PROJECT_TYPES, {
        errorMap: () => ({ message: 'Please select a project type' }),
    }),
    name: z.string().optional(),

    // Quick Scan Mode: Defaults applied if skipped
    teamSize: z.string().optional().default('solo'),
    resources: z.array(z.string()).optional().default([]),

    successDefinition: z.string().optional(),
    attachments: z.string().optional(),

    responseStyle: z.string().optional().default('balanced'),

    focusHints: z.array(z.string()).optional().default([]),
    mvpScope: z.string().optional().default('Standard MVP'),
    goToMarketPlan: z.string().optional().default('Organic Growth'),
    launchLiquidityPlan: z.string().optional().default('Not yet decided'),
    tokenAddress: z.string().optional().refine(
        (val) => !val || isValidSolanaAddress(val),
        { message: 'Invalid Solana address format (must be 32-44 base58 characters)' }
    ),
    walletAddress: z.string().optional(),


    // --- Smart Evaluation Fields ---
    // Memecoin
    memecoinNarrative: z.string().optional(),
    memecoinVibe: z.string().optional(),

    // DeFi
    defiRevenue: z.string().optional(),
    defiMechanism: z.string().optional(),

    // AI
    aiModelType: z.string().optional(),
    aiDataMoat: z.string().optional(),

    // --- Phase 2: Adaptive Execution & Goals ---
    // Instead of generic resources array, we might want specific boolean flags or sub-arrays
    // For simplicity, we can keep using 'resources' array but populate it with specific strings from the UI
    // BUT, let's add specific optional fields if we want strict typing for the new inputs

    // Execution Checklists
    defiSecurityMarks: z.array(z.string()).optional(), // Audit, Multisig, Timelock
    memecoinLaunchPreparation: z.array(z.string()).optional(), // Art, Community, KOLs
    aiInfraReadiness: z.array(z.string()).optional(), // GPU, Data Pipeline

    // Specific Goals
    targetTVL: z.string().optional(),
    targetMarketCap: z.string().optional(),
    targetDAU: z.string().optional(),
});

export type IdeaSubmission = z.infer<typeof ideaSubmissionSchema>;

export const copilotSubmissionSchema = z.object({
    text: z.string().min(1, 'Text is required'),
    field: z.string().optional(),
    projectType: z.enum(PROJECT_TYPES).optional(),
});

export type CopilotSubmission = z.infer<typeof copilotSubmissionSchema>;
