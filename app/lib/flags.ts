// app/lib/flags.ts
export interface FeatureFlags {
  ADVISOR: boolean;
  ALERTS: boolean;
  ACTIONS: boolean;
  EMBED_INTENT: boolean;
  INVITE_CODES: boolean;
  MONETIZATION: boolean;
  PRO_TRIALS: boolean;
  QUOTA_SYSTEM: boolean;
  QUALITY_MONITORING: boolean;
  CHAOS_TESTING: boolean;
  ENSEMBLE_ANALYSIS: boolean;
  CONTEXTUAL_ANALYSIS: boolean;
}

export function getFeatureFlags(): FeatureFlags {
  // Environment-based feature flags
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isStaging = process.env.NODE_ENV === 'staging';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    // Advisor features - default OFF in production, ON in staging/dev
    ADVISOR: process.env.FEATURE_ADVISOR === 'true' || isDevelopment || isStaging,
    ALERTS: process.env.FEATURE_ALERTS === 'true' || isDevelopment || isStaging,
    
    // Actions features - STRICT: OFF in production, ON in staging/dev
    ACTIONS: (process.env.FEATURE_ACTIONS === 'true' || isDevelopment || isStaging) && !isProduction,
    EMBED_INTENT: (process.env.FEATURE_EMBED_INTENT === 'true' || isDevelopment || isStaging) && !isProduction,
    INVITE_CODES: (process.env.FEATURE_INVITE_CODES === 'true' || isDevelopment || isStaging) && !isProduction,
    
    // Monetization features - enabled by default
    MONETIZATION: process.env.FEATURE_MONETIZATION !== 'false',
    PRO_TRIALS: process.env.FEATURE_PRO_TRIALS !== 'false',
    QUOTA_SYSTEM: process.env.FEATURE_QUOTA_SYSTEM !== 'false',
    
    // Quality monitoring - enabled by default
    QUALITY_MONITORING: process.env.FEATURE_QUALITY_MONITORING !== 'false',
    CHAOS_TESTING: process.env.FEATURE_CHAOS_TESTING === 'true' || isDevelopment || isStaging,
    
    // AI features - enabled by default
    ENSEMBLE_ANALYSIS: process.env.FEATURE_ENSEMBLE !== 'false',
    CONTEXTUAL_ANALYSIS: process.env.FEATURE_CONTEXTUAL !== 'false',
  };
}

export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature];
}

// Canary rollout helper
export function shouldShowFeature(feature: keyof FeatureFlags, userId?: string): boolean {
  const flags = getFeatureFlags();
  
  if (!flags[feature]) {
    return false;
  }
  
  // Canary rollout logic (default 10% in production)
  if (userId && process.env.NODE_ENV === 'production') {
    const hash = hashString(userId);
    const rolloutPercentage = parseInt(process.env[`FEATURE_${feature}_ROLLOUT`] || '10');
    return (hash % 100) < rolloutPercentage;
  }
  
  return true;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
