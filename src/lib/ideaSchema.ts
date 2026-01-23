import { z } from 'zod';

export const ideaSubmissionSchema = z.object({
    description: z.string().min(10, 'Description must be at least 10 characters long'),
    projectType: z.enum(['memecoin', 'defi', 'ai'], {
        errorMap: () => ({ message: 'Please select a project type' }),
    }),

    // Quick Scan Mode: Defaults applied if skipped
    teamSize: z.string().optional().default('solo'),
    resources: z.array(z.string()).optional().default([]),

    successDefinition: z.string().optional().default('Launch and learn'),
    attachments: z.string().optional(),

    responseStyle: z.string().optional().default('short'),

    focusHints: z.array(z.string()).optional().default([]),
    mvpScope: z.string().optional().default('Standard MVP'),
    goToMarketPlan: z.string().optional().default('Organic Growth'),
    launchLiquidityPlan: z.string().optional().default('Not yet decided'),
    tokenAddress: z.string().optional(),
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
    projectType: z.enum(['memecoin', 'defi', 'ai']).optional(),
});

export type CopilotSubmission = z.infer<typeof copilotSubmissionSchema>;
