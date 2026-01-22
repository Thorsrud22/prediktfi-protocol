export type IdeaEvaluationResult = {
  overallScore: number;

  // Phase 2: Proof of Reasoning
  reasoningSteps?: string[];

  summary: {
    title: string;
    oneLiner: string;
    mainVerdict: string;
  };

  technical: {
    feasibilityScore: number;
    keyRisks: string[];
    requiredComponents: string[];
    comments: string;
  };

  tokenomics: {
    tokenNeeded: boolean;
    designScore: number;
    mainIssues: string[];
    suggestions: string[];
  };

  aiStrategy?: {
    modelQualityScore: number;
    dataMoatScore: number;
    userAcquisitionScore: number;
    notes: string[];
  };

  market: {
    marketFitScore: number;
    targetAudience: string[];
    competitorSignals: string[];
    competitors?: {
      name: string;
      price?: string;
      metrics?: {
        marketCap?: string;
        tvl?: string;
        dailyUsers?: string;
        funding?: string;
        revenue?: string;
      };
    }[];
    goToMarketRisks: string[];
  };

  execution: {
    complexityLevel: 'low' | 'medium' | 'high';
    founderReadinessFlags: string[];
    estimatedTimeline: string;
    executionRiskScore: number;
    executionRiskLabel: 'low' | 'medium' | 'high';
    executionSignals: string[];
  };

  recommendations: {
    mustFixBeforeBuild: string[];
    recommendedPivots: string[];
    niceToHaveLater: string[];
  };

  cryptoNativeChecks?: {
    rugPullRisk: 'low' | 'medium' | 'high';
    auditStatus: 'audited' | 'planned' | 'none' | 'not_applicable';
    liquidityStatus: 'locked' | 'burned' | 'unclear' | 'not_applicable';
    liquidityDetail?: string; // e.g. "Locked for 1 year"
    liquidityGrade?: 'weak' | 'medium' | 'strong';
    isAnonTeam: boolean;
  };

  calibrationNotes?: string[];

  launchReadinessScore?: number;
  launchReadinessLabel?: 'low' | 'medium' | 'high';
  launchReadinessSignals?: string[];

  projectType?: string;
  confidenceLevel?: 'low' | 'medium' | 'high';
};
