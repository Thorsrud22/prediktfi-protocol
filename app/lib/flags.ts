// app/lib/flags.ts
export interface FeatureFlags {
  ADVISOR: boolean;
  ALERTS: boolean;
  ACTIONS: boolean;
  EMBED_INTENT: boolean;
  SIGNALS: boolean;
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
  const isStaging = process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'staging';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    // Advisor features - default OFF in production, ON in staging/dev
    ADVISOR: process.env.FEATURE_ADVISOR === 'true' || isDevelopment || isStaging,
    ALERTS: process.env.FEATURE_ALERTS === 'true' || isDevelopment || isStaging,
    
    // Actions features - STRICT: OFF in production, ON in staging/dev
    ACTIONS: (process.env.FEATURE_ACTIONS === 'true' || isDevelopment || isStaging) && !isProduction,
    EMBED_INTENT: (process.env.FEATURE_EMBED_INTENT === 'true' || isDevelopment || isStaging) && !isProduction,
    
    // Signals API - controlled rollout in production
    SIGNALS: process.env.SIGNALS === 'on' || isDevelopment || isStaging,
    
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

/**
 * Check if signals API should be enabled for this request
 * Uses IP-based rollout for anonymous users
 */
export function shouldEnableSignals(clientIp?: string): boolean {
  const flags = getFeatureFlags();
  
  if (!flags.SIGNALS) {
    return false;
  }
  
  // Always enabled in development/staging
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }
  
  // Get rollout percentage from environment (default 0%)
  const rolloutPercent = parseInt(process.env.ROLLOUT_PERCENT || '0');
  
  if (rolloutPercent >= 100) {
    return true;
  }
  
  if (rolloutPercent <= 0) {
    return false;
  }
  
  // Use IP address for consistent rollout
  if (!clientIp) {
    return false;
  }
  
  const hash = hashString(clientIp);
  return (hash % 100) < rolloutPercent;
}
