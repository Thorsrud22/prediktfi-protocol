/**
 * Attribution system for tracking referrals and creators
 */

// localStorage keys
const REF_KEY = "predikt:ref";
const CREATOR_ID_KEY = "predikt:creatorId";

// Maximum allowed length for attribution values
const MAX_ATTRIBUTION_LENGTH = 64;

/**
 * Sanitize attribution value
 * - Max 64 characters
 * - Only letters, numbers, underscore, and dot allowed
 */
function sanitizeAttributionValue(value: string): string {
  if (!value) return "";
  
  // Remove invalid characters (only allow a-z, A-Z, 0-9, _, .)
  const sanitized = value.replace(/[^a-zA-Z0-9_.]/g, "");
  
  // Limit to max length
  return sanitized.slice(0, MAX_ATTRIBUTION_LENGTH);
}

/**
 * Save attribution data from URL query parameters
 * Reads 'ref' and 'creator'/'creatorId' parameters and stores them in localStorage
 */
export function saveAttributionFromUrl(): void {
  if (typeof window === "undefined") return;
  
  try {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Get ref parameter
    const ref = urlParams.get("ref");
    if (ref) {
      const sanitizedRef = sanitizeAttributionValue(ref);
      if (sanitizedRef) {
        localStorage.setItem(REF_KEY, sanitizedRef);
      }
    }
    
    // Get creator or creatorId parameter (support both)
    const creator = urlParams.get("creator") || urlParams.get("creatorId");
    if (creator) {
      const sanitizedCreator = sanitizeAttributionValue(creator);
      if (sanitizedCreator) {
        localStorage.setItem(CREATOR_ID_KEY, sanitizedCreator);
      }
    }
  } catch (error) {
    console.warn("Failed to save attribution from URL:", error);
  }
}

/**
 * Get stored attribution data
 * @returns Object with ref and creatorId values, or empty strings if not found
 */
export function getAttribution(): { ref: string; creatorId: string } {
  if (typeof window === "undefined") {
    return { ref: "", creatorId: "" };
  }
  
  try {
    const ref = localStorage.getItem(REF_KEY) || "";
    const creatorId = localStorage.getItem(CREATOR_ID_KEY) || "";
    
    return {
      ref: sanitizeAttributionValue(ref),
      creatorId: sanitizeAttributionValue(creatorId)
    };
  } catch (error) {
    console.warn("Failed to get attribution:", error);
    return { ref: "", creatorId: "" };
  }
}

/**
 * Clear stored attribution data (useful for testing)
 */
export function clearAttribution(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(REF_KEY);
    localStorage.removeItem(CREATOR_ID_KEY);
  } catch (error) {
    console.warn("Failed to clear attribution:", error);
  }
}
