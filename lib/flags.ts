/**
 * Feature flags for Predikt Proof Agent V1
 * Controls rollout of new features across environments
 */

export const Flags = {
  AI_NORMALIZATION: process.env.FEATURE_AI_NORMALIZATION === 'true',
  SOCIAL_SHARING: process.env.FEATURE_SOCIAL_SHARING === 'true', 
  PRO_FEATURES: process.env.FEATURE_PRO_FEATURES === 'true',
  COMMIT_ENABLED: process.env.COMMIT_ENABLED === 'true',
  ANALYTICS_ENABLED: process.env.ANALYTICS_ENABLED !== 'false', // default true
} as const;

export type FeatureFlag = keyof typeof Flags;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return Flags[flag];
}

/**
 * Get all enabled features for debugging
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return Object.entries(Flags)
    .filter(([, enabled]) => enabled)
    .map(([flag]) => flag as FeatureFlag);
}
