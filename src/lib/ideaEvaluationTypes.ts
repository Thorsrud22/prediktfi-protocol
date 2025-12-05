export type IdeaEvaluationResult = {
  overallScore: number;

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

  market: {
    marketFitScore: number;
    targetAudience: string[];
    competitorSignals: string[];
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
    isAnonTeam: boolean;
  };

  calibrationNotes?: string[];

  launchReadinessScore?: number;
  launchReadinessLabel?: 'low' | 'medium' | 'high';
  launchReadinessSignals?: string[];
};
