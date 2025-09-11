/**
 * CTA A/B Testing Bucketing
 * 
 * Provides stable bucketing for CTA copy experiments
 * Uses consistent hashing to ensure same session gets same variant
 */

export const EXPERIMENT_KEY = 'cta_copy_v1';
export type CTAVariant = 'A' | 'B';

/**
 * Simple hash function for consistent bucketing
 */
function hash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get CTA variant for a session
 * Returns stable assignment based on session ID
 */
export function ctaBucket(sessionId: string): CTAVariant {
  const bucket = hash(EXPERIMENT_KEY + sessionId) % 2;
  return bucket === 0 ? 'A' : 'B';
}

/**
 * Get experiment metadata for a session
 */
export function getCTAExperiment(sessionId: string): {
  experimentKey: string;
  variant: CTAVariant;
} {
  return {
    experimentKey: EXPERIMENT_KEY,
    variant: ctaBucket(sessionId),
  };
}

/**
 * Check if experiment is active
 * Can be used for feature flags or gradual rollouts
 */
export function isCTAExperimentActive(): boolean {
  // In production, this could check environment variables or feature flags
  return process.env.NODE_ENV === 'production' || process.env.CTA_AB_ENABLED === 'true';
}

/**
 * Get session ID from various sources
 * Tries localStorage, then generates a new one
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side: generate a random session ID
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  
  // Client-side: try localStorage first
  let sessionId = localStorage.getItem('prediktfi_session_id');
  
  if (!sessionId) {
    // Generate new session ID
    sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('prediktfi_session_id', sessionId);
  }
  
  return sessionId;
}

/**
 * Get CTA experiment for current session
 */
export function getCurrentCTAExperiment(): {
  experimentKey: string;
  variant: CTAVariant;
} | null {
  if (!isCTAExperimentActive()) {
    return null;
  }
  
  const sessionId = getSessionId();
  return getCTAExperiment(sessionId);
}
