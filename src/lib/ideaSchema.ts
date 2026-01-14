import { z } from 'zod';

export const ideaSubmissionSchema = z.object({
    description: z.string().min(10, 'Description must be at least 10 characters long'),
    projectType: z.enum(['memecoin', 'defi', 'ai'], {
        errorMap: () => ({ message: 'Please select a project type' }),
    }),
    teamSize: z.enum(['solo', 'team_2_5', 'team_6_plus'], {
        errorMap: () => ({ message: 'Please select a team size' }),
    }),
    resources: z.array(z.string()).min(1, 'Select at least one available resource'),
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
});

export type IdeaSubmission = z.infer<typeof ideaSubmissionSchema>;
