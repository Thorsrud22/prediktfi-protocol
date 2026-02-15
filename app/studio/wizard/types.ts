import { IdeaProjectType } from '@/lib/ideaCategories';

export type ProjectType = IdeaProjectType | null;

export interface WizardFormData {
    projectType: ProjectType;
    name: string; // Ticker or Project Name
    description: string;
    website?: string; // Optional context
    // Contextual fields
    memecoinVibe?: string;
    memecoinNarrative?: string;
    defiMechanism?: string;
    defiRevenue?: string;
    aiModelType?: string;
    aiDataMoat?: string;
    nftUtility?: string;
    nftCollectorHook?: string;
    gamingCoreLoop?: string;
    gamingEconomyModel?: string;
    otherTargetUser?: string;
    otherDifferentiation?: string;
    teamSize?: string;
    successDefinition?: string;
}

export interface WizardErrors {
    projectType?: string;
    name?: string;
    description?: string;
    [key: string]: string | undefined;
}
