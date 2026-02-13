import { EvidenceClaim, EvidencePack } from "@/lib/ai/evidenceTypes";

export type IdeaEvaluationResult = {
  overallScore: number;

  // Phase 2: Proof of Reasoning
  reasoningSteps?: string[];

  fatalFlaw?: {
    identified: boolean;
    flawTitle: string;
    flawDescription: string;
    evidence: string;
  };

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
    modelQualityComment?: string;
    dataMoatScore: number;
    dataMoatComment?: string;
    userAcquisitionScore: number;
    userAcquisitionComment?: string;
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
    // Enhanced Birdeye Metrics
    isLiquidityLocked?: boolean;
    top10HolderPercentage?: number;
    totalLiquidity?: number;
    creatorPercentage?: number;
    // Verification status
    isVerified?: boolean; // true when token address was provided and on-chain check ran
    tokenAddress?: string; // The token address that was checked (if any)
  };

  calibrationNotes?: string[];

  launchReadinessScore?: number;
  launchReadinessLabel?: 'low' | 'medium' | 'high';
  launchReadinessSignals?: string[];

  projectType?: string;
  confidenceLevel?: 'low' | 'medium' | 'high';
  meta?: {
    confidenceLevel?: 'low' | 'medium' | 'high';
    confidenceReasons?: string[];
    debateDisagreementIndex?: number;
    evidenceCoverage?: number;
    modelRoute?: {
      bear: string;
      bull: string;
      competitive: string;
      judge: string;
      judgeFallback: string;
      verifier: string;
      fallbackUsed: boolean;
    };
    fallbackUsed?: boolean;
    verifierStatus?: 'pass' | 'soft_fail' | 'hard_fail' | 'error';
    verifierIssues?: string[];
    dataFreshness?: string | null;
  };
  evidence?: EvidencePack & {
    claims?: EvidenceClaim[];
  };
};
