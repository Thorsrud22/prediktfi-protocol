/**
 * Calibration profiles for the analysis engine
 * Defines weights, thresholds and parameters for different analysis modes
 */

export interface CalibrationProfile {
  id: string;
  name: string;
  description: string;
  version: string;
  weights: {
    technical: number;
    sentiment: number;
    risk: number;
  };
  thresholds: {
    rsi: {
      overbought: number;
      oversold: number;
    };
    atr: {
      high_volatility: number; // ATR relative threshold
    };
    fng: {
      extreme_fear: number;
      fear: number;
      greed: number;
      extreme_greed: number;
    };
  };
  intervals: {
    multipliers: {
      '24h': number;
      '7d': number;
      '30d': number;
    };
  };
}

let activeProfile: CalibrationProfile | null = null;

/**
 * Load calibration profile from JSON
 */
export async function loadCalibrationProfile(profileId: string = 'default'): Promise<CalibrationProfile> {
  try {
    // Dynamic import of profile JSON
    const profiles = await import('./calibration_profiles.json');
    const profile = profiles.profiles.find((p: CalibrationProfile) => p.id === profileId);
    
    if (!profile) {
      throw new Error(`Calibration profile '${profileId}' not found`);
    }
    
    // Validate weights sum to 1
    const weightSum = profile.weights.technical + profile.weights.sentiment + profile.weights.risk;
    if (Math.abs(weightSum - 1.0) > 0.001) {
      console.warn(`Profile ${profileId} weights sum to ${weightSum}, should be 1.0`);
    }
    
    activeProfile = profile;
    return profile;
  } catch (error) {
    console.error('Failed to load calibration profile:', error);
    // Return fallback profile
    return getDefaultProfile();
  }
}

/**
 * Get current active calibration profile
 */
export function getCalibration(): CalibrationProfile {
  if (!activeProfile) {
    console.warn('No active calibration profile loaded, using default');
    return getDefaultProfile();
  }
  return activeProfile;
}

/**
 * Default fallback calibration profile
 */
function getDefaultProfile(): CalibrationProfile {
  return {
    id: 'default',
    name: 'Default Profile',
    description: 'Balanced weights for general analysis',
    version: '1.0.0',
    weights: {
      technical: 0.5,
      sentiment: 0.3,
      risk: 0.2,
    },
    thresholds: {
      rsi: {
        overbought: 70,
        oversold: 30,
      },
      atr: {
        high_volatility: 2.0, // 2x recent average
      },
      fng: {
        extreme_fear: 25,
        fear: 45,
        greed: 55,
        extreme_greed: 75,
      },
    },
    intervals: {
      multipliers: {
        '24h': 1.2,
        '7d': 2.0,
        '30d': 3.0,
      },
    },
  };
}

// Legacy exports for backward compatibility
export const weights = {
  technical: 0.55,
  sentiment: 0.25,
  risk: 0.2,
};

export const thresholds = {
  rsiOverbought: 70,
  rsiOversold: 30,
};

export const horizonDays = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
};
