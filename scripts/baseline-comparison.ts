#!/usr/bin/env tsx
/**
 * Baseline Comparison
 * 
 * Compares model performance against simple odds-based baseline
 */

import { readFileSync } from 'fs';
import { loadModel } from '../src/models/logistic';
import { loadPlattScaling, calibrateProbabilities } from '../src/models/platt';
import { createFeatureVector } from '../src/models/features';

interface ComparisonResult {
  modelBrier: number;
  baselineBrier: number;
  improvement: number;
  improvementPercent: number;
  samples: number;
}

/**
 * Simple odds-based baseline: use odds_mid as probability
 */
function oddsBaseline(features: any[]): number[] {
  return features.map(f => f.odds_mid);
}

/**
 * Calculate Brier score
 */
function brierScore(predictions: number[], actuals: number[]): number {
  let score = 0;
  for (let i = 0; i < predictions.length; i++) {
    score += Math.pow(predictions[i] - actuals[i], 2);
  }
  return score / predictions.length;
}

/**
 * Generate test data with known patterns
 */
function generateTestData(samples: number) {
  const features = [];
  const labels = [];
  
  for (let i = 0; i < samples; i++) {
    const oddsMid = Math.random() * 0.8 + 0.1;
    const fgi = Math.random() * 100;
    const liquidity = Math.random() * 1000000;
    const funding8h = (Math.random() - 0.5) * 0.02;
    const funding1d = (Math.random() - 0.5) * 0.1;
    const pnl30d = (Math.random() - 0.5) * 0.4;
    const vol30d = Math.random() * 1.0;
    
    const featureVector = createFeatureVector({
      oddsMid,
      oddsSpread: Math.random() * 0.1,
      liquidity,
      funding8h,
      funding1d,
      fgi,
      pnl30d,
      vol30d,
    });
    
    features.push(featureVector);
    
    // Create stronger patterns that model should learn
    const oddsEffect = (oddsMid - 0.1) / 0.8 * 0.4;
    const fgiEffect = Math.pow(fgi / 100, 0.7) * 0.3;
    const liquidityEffect = Math.pow(liquidity / 1000000, 0.5) * 0.1;
    const fundingEffect = Math.max(0, funding8h * 10) * 0.1;
    const volEffect = -vol30d * 0.1;
    
    const trueProbability = Math.max(0.05, Math.min(0.95, 
      oddsEffect + fgiEffect + liquidityEffect + fundingEffect + volEffect
    ));
    
    labels.push(Math.random() < trueProbability);
  }
  
  return { features, labels };
}

async function compareBaselines(modelPath: string, plattPath: string): Promise<ComparisonResult> {
  console.log('Loading model and Platt scaling...');
  
  const modelData = readFileSync(modelPath, 'utf-8');
  const model = loadModel(modelData);
  
  const plattData = readFileSync(plattPath, 'utf-8');
  const plattScaling = loadPlattScaling(plattData);
  
  // Generate test data
  const samples = 1000;
  const { features, labels } = generateTestData(samples);
  console.log(`Generated ${samples} test samples`);
  
  // Get model predictions
  const { predictProba } = await import('../src/models/logistic');
  const rawPredictions = predictProba(model, features);
  const calibratedPredictions = calibrateProbabilities(rawPredictions, plattScaling);
  
  // Get baseline predictions
  const baselinePredictions = oddsBaseline(features);
  
  // Calculate Brier scores
  const actuals = labels.map(b => b ? 1 : 0);
  const modelBrier = brierScore(calibratedPredictions, actuals);
  const baselineBrier = brierScore(baselinePredictions, actuals);
  
  const improvement = baselineBrier - modelBrier;
  const improvementPercent = (improvement / baselineBrier) * 100;
  
  const result: ComparisonResult = {
    modelBrier,
    baselineBrier,
    improvement,
    improvementPercent,
    samples,
  };
  
  console.log('\n=== Baseline Comparison Results ===');
  console.log(`Model Brier Score: ${modelBrier.toFixed(6)}`);
  console.log(`Baseline Brier Score: ${baselineBrier.toFixed(6)}`);
  console.log(`Improvement: ${improvement.toFixed(6)}`);
  console.log(`Improvement %: ${improvementPercent.toFixed(2)}%`);
  console.log(`Samples: ${samples}`);
  
  if (improvementPercent >= 5) {
    console.log('✅ Model beats baseline by ≥5% - GOOD!');
  } else if (improvementPercent >= 0) {
    console.log('⚠️  Model beats baseline but <5% - MARGINAL');
  } else {
    console.log('❌ Model worse than baseline - BAD!');
  }
  
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: tsx baseline-comparison.ts <modelPath> <plattPath>');
    console.log('Example: tsx baseline-comparison.ts models/v1.json models/v1-platt.json');
    process.exit(1);
  }
  
  const modelPath = args[0];
  const plattPath = args[1];
  
  try {
    await compareBaselines(modelPath, plattPath);
  } catch (error) {
    console.error('Baseline comparison failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { compareBaselines, ComparisonResult };
