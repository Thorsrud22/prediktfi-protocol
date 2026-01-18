import { z } from 'zod';

export const ideaSubmissionSchema = z.object({
    description: z.string().min(10, 'Description must be at least 10 characters long'),
    projectType: z.enum(['memecoin', 'defi', 'ai'], {
        errorMap: () => ({ message: 'Please select a project type' }),
    }),
    teamSize: z.enum(['solo', 'team_2_5', 'team_6_plus'], {
        errorMap: () => ({ message: 'Please select a team size' }),
    }),
    resources: z.array(z.string()).optional(),
    successDefinition: z.string().min(5, 'Please define what success means to you'),
    attachments: z.string().optional(), // Accepting a single string for now (URL or text) as per requirements "URLs or text fields" - simplified to string for text area or single input
    responseStyle: z.enum(['short', 'full', 'next_steps'], {
        errorMap: () => ({ message: 'Please select a response style' }),
    }),
    focusHints: z.array(z.string()).optional(),
    mvpScope: z.string().optional(),
    goToMarketPlan: z.string().optional(),
    launchLiquidityPlan: z.string().optional(),
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
}).superRefine((data, ctx) => {
    // Validation Rule: Must have at least one "Resource" execution signal

    const hasGenericResources = data.resources && data.resources.length > 0;
    const hasMemecoinResources = data.projectType === 'memecoin' && data.memecoinLaunchPreparation && data.memecoinLaunchPreparation.length > 0;
    const hasDeFiResources = data.projectType === 'defi' && data.defiSecurityMarks && data.defiSecurityMarks.length > 0;
    const hasAIResources = data.projectType === 'ai' && data.aiInfraReadiness && data.aiInfraReadiness.length > 0;

    // Determine if any resource list is populated based on project type
    let isValid = false;

    if (!data.projectType) {
        // No project type selected yet (should be caught by projectType check), but strict resources generic check
        isValid = !!hasGenericResources;
    } else if (data.projectType === 'memecoin') {
        isValid = !!hasMemecoinResources;
    } else if (data.projectType === 'defi') {
        isValid = !!hasDeFiResources;
    } else if (data.projectType === 'ai') {
        isValid = !!hasAIResources;
    } else {
        isValid = !!hasGenericResources;
    }

    if (!isValid) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please select at least one readiness/resource item.",
            path: ["resources"] // Point error to resources field for UI to catch it
        });
    }
});

export type IdeaSubmission = z.infer<typeof ideaSubmissionSchema>;
