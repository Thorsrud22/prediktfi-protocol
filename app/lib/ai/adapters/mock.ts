import { PredictInput, PredictOutput } from '../kernel';
import { slugify, nowTs } from '../util';

// Seeded random number generator for stable responses
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const x = Math.sin(Math.abs(hash)) * 10000;
  return x - Math.floor(x);
}

export async function mockAdapter(input: PredictInput): Promise<PredictOutput> {
  const scenarioId = slugify(`${input.topic}-${input.question}-${input.horizon}`);
  const seed = scenarioId + input.horizon;
  
  // Generate stable probability between 0.05 and 0.95
  const random1 = seededRandom(seed + 'prob');
  const prob = 0.05 + (random1 * 0.90);
  
  // Generate stable drivers
  const driverSets = [
    ['Market sentiment', 'Technical indicators', 'Volume trends'],
    ['Regulatory environment', 'Adoption rates', 'Competition'],
    ['Economic conditions', 'User behavior', 'Technology advancement'],
    ['News sentiment', 'Historical patterns', 'Network effects'],
    ['Supply dynamics', 'Demand factors', 'Market cycles']
  ];
  
  const random2 = seededRandom(seed + 'drivers');
  const drivers = driverSets[Math.floor(random2 * driverSets.length)];
  
  // Generate stable rationale
  const templates = [
    `Based on current trends and historical patterns, the probability appears ${prob > 0.5 ? 'favorable' : 'challenging'}.`,
    `Market indicators suggest ${prob > 0.6 ? 'strong' : prob > 0.4 ? 'moderate' : 'weak'} likelihood for this scenario.`,
    `Analysis of key factors indicates ${prob > 0.7 ? 'high' : prob > 0.3 ? 'medium' : 'low'} confidence in this outcome.`,
    `Current data points to a ${prob > 0.5 ? 'positive' : 'negative'} outlook for the specified timeframe.`
  ];
  
  const random3 = seededRandom(seed + 'rationale');
  const rationale = templates[Math.floor(random3 * templates.length)];
  
  return {
    prob: Math.round(prob * 100) / 100, // Round to 2 decimals
    drivers,
    rationale,
    model: 'mock-v0',
    scenarioId,
    ts: nowTs()
  };
}
