/**
 * Analysis explainability and driver attribution
 * Builds human-readable explanations for model decisions
 */

import { getCalibration } from './calibration';

export interface Driver {
  label: string;
  weight: number;
  contribution_note: string;
}

export interface ConfidenceFactors {
  confidence: number;
  reasons: string[];
}

export interface ExplanationContext {
  technical: {
    score: number;
    rsi?: number;
    atr_relative?: number;
    trend_direction?: 'up' | 'down' | 'neutral';
    volatility_regime?: 'low' | 'normal' | 'high';
  };
  sentiment: {
    score: number;
    fng_value?: number;
    fng_classification?: string;
  };
  risk: {
    score: number;
    volatility_level?: 'low' | 'normal' | 'high';
    market_stress?: boolean;
  };
  data_quality: {
    completeness: number;
    freshness: number;
  };
}

/**
 * Compute confidence score based on data quality, consistency, and volatility
 */
export function computeConfidence(
  dataQuality: number,    // k: 0-1, data completeness and freshness
  consistency: number,    // c: 0-1, agreement between indicators  
  relativeVolatility: number  // v: 0-3+, current volatility vs average
): ConfidenceFactors {
  // Start with base data quality
  let confidence = dataQuality;
  const reasons: string[] = [];

  // Add data quality reason
  if (dataQuality >= 0.9) {
    reasons.push('High data quality and freshness');
  } else if (dataQuality >= 0.7) {
    reasons.push('Good data availability');
  } else {
    reasons.push('Limited data quality impacts confidence');
  }

  // Bonus for high consistency between indicators (up to +0.15)
  if (consistency >= 0.8) {
    const bonus = Math.min(0.15, (consistency - 0.8) * 0.75); // Max 0.15 bonus
    confidence += bonus;
    reasons.push('Strong agreement between indicators');
  } else if (consistency >= 0.6) {
    const bonus = Math.min(0.08, (consistency - 0.6) * 0.4);
    confidence += bonus;
    reasons.push('Moderate indicator alignment');
  } else {
    reasons.push('Mixed signals reduce confidence');
  }

  // Penalty for high volatility (up to -0.25)
  if (relativeVolatility >= 2.5) {
    const penalty = Math.min(0.25, (relativeVolatility - 2.5) * 0.1);
    confidence -= penalty;
    reasons.push('High volatility increases uncertainty');
  } else if (relativeVolatility >= 1.5) {
    const penalty = Math.min(0.15, (relativeVolatility - 1.5) * 0.15);
    confidence -= penalty;
    reasons.push('Elevated volatility affects prediction');
  } else if (relativeVolatility <= 0.8) {
    reasons.push('Low volatility supports stable outlook');
  }

  // Clamp to valid range [0, 1]
  confidence = Math.max(0, Math.min(1, confidence));

  return {
    confidence: Math.round(confidence * 100) / 100, // Round to 2 decimals
    reasons: reasons.slice(0, 3), // Top 3 reasons
  };
}

/**
 * Build top 3 drivers explaining the analysis result
 */
export function buildDrivers(context: ExplanationContext): Driver[] {
  const calibration = getCalibration();
  const drivers: Driver[] = [];

  // Technical analysis driver
  const techNote = buildTechnicalNote(context.technical, calibration);
  drivers.push({
    label: 'Technical Analysis',
    weight: calibration.weights.technical,
    contribution_note: techNote,
  });

  // Sentiment analysis driver
  const sentimentNote = buildSentimentNote(context.sentiment, calibration);
  drivers.push({
    label: 'Market Sentiment',
    weight: calibration.weights.sentiment,
    contribution_note: sentimentNote,
  });

  // Risk assessment driver
  const riskNote = buildRiskNote(context.risk, calibration);
  drivers.push({
    label: 'Risk Assessment',
    weight: calibration.weights.risk,
    contribution_note: riskNote,
  });

  // Sort by weight (descending) and round weights to 2 decimals
  return drivers
    .sort((a, b) => b.weight - a.weight)
    .map(driver => ({
      ...driver,
      weight: Math.round(driver.weight * 100) / 100,
    }))
    .slice(0, 3); // Top 3 drivers
}

/**
 * Build technical analysis explanation note
 */
function buildTechnicalNote(
  technical: ExplanationContext['technical'],
  calibration: ReturnType<typeof getCalibration>
): string {
  const notes = [];

  // RSI analysis
  if (technical.rsi !== undefined) {
    if (technical.rsi > calibration.thresholds.rsi.overbought) {
      notes.push('RSI indicates overbought conditions');
    } else if (technical.rsi < calibration.thresholds.rsi.oversold) {
      notes.push('RSI suggests oversold levels');
    } else {
      notes.push('RSI shows neutral momentum');
    }
  }

  // Volatility analysis
  if (technical.volatility_regime) {
    if (technical.volatility_regime === 'high') {
      notes.push('elevated volatility detected');
    } else if (technical.volatility_regime === 'low') {
      notes.push('low volatility environment');
    }
  }

  // Trend direction
  if (technical.trend_direction) {
    notes.push(`${technical.trend_direction}ward trend signal`);
  }

  return notes.length > 0 ? notes.join(', ') : 'Standard technical patterns observed';
}

/**
 * Build sentiment analysis explanation note
 */
function buildSentimentNote(
  sentiment: ExplanationContext['sentiment'],
  calibration: ReturnType<typeof getCalibration>
): string {
  if (!sentiment.fng_value || !sentiment.fng_classification) {
    return 'Neutral market sentiment detected';
  }

  const fng = sentiment.fng_value;
  const classification = sentiment.fng_classification;

  if (fng <= calibration.thresholds.fng.extreme_fear) {
    return `Extreme fear (${fng}) suggests potential oversold bounce`;
  } else if (fng <= calibration.thresholds.fng.fear) {
    return `Fear sentiment (${fng}) indicates cautious market mood`;
  } else if (fng >= calibration.thresholds.fng.extreme_greed) {
    return `Extreme greed (${fng}) warns of potential correction`;
  } else if (fng >= calibration.thresholds.fng.greed) {
    return `Greed sentiment (${fng}) shows optimistic positioning`;
  } else {
    return `Neutral sentiment (${fng}) with balanced market psychology`;
  }
}

/**
 * Build risk assessment explanation note
 */
function buildRiskNote(
  risk: ExplanationContext['risk'],
  calibration: ReturnType<typeof getCalibration>
): string {
  const notes = [];

  if (risk.volatility_level === 'high') {
    notes.push('heightened volatility increases uncertainty');
  } else if (risk.volatility_level === 'low') {
    notes.push('low volatility supports stability');
  }

  if (risk.market_stress) {
    notes.push('market stress indicators elevated');
  }

  return notes.length > 0 ? notes.join(', ') : 'Normal risk environment observed';
}

/**
 * Validate that driver weights sum to approximately 1.0
 */
export function validateDriverWeights(drivers: Driver[]): boolean {
  const totalWeight = drivers.reduce((sum, driver) => sum + driver.weight, 0);
  return Math.abs(totalWeight - 1.0) < 0.01; // Allow 1% tolerance
}
