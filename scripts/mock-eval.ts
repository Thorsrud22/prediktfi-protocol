#!/usr/bin/env tsx
/**
 * Mock Evaluation for Testing
 * 
 * Creates mock evaluation results without requiring database data
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { loadModel } from '../src/models/logistic';
import { loadPlattScaling } from '../src/models/platt';
import { createFeatureVector } from '../src/models/features';

interface MockEvalResult {
  modelId: string;
  evaluationDate: string;
  samples: number;
  metrics: {
    brierScore: number;
    logLoss: number;
    accuracy: number;
    reliability: number;
    resolution: number;
    uncertainty: number;
  };
  calibration: {
    originalBrier: number;
    calibratedBrier: number;
    improvement: number;
  };
  reliabilityBins: {
    bin: number;
    binStart: number;
    binEnd: number;
    count: number;
    meanPrediction: number;
    meanOutcome: number;
    wilsonCI: [number, number];
  }[];
  modelMetadata: {
    trainedAt: string;
    trainingSamples: number;
    convergenceIterations: number;
  };
  plattMetadata: {
    trainedAt: string;
    holdoutSamples: number;
    originalBrierScore: number;
    calibratedBrierScore: number;
    improvement: number;
  };
}

function generateMockData(samples: number) {
  const features = [];
  const labels = [];
  
  for (let i = 0; i < samples; i++) {
    const oddsMid = Math.random() * 0.8 + 0.1;
    const fgi = Math.random() * 100;
    const liquidity = Math.random() * 1000000;
    
    const featureVector = createFeatureVector({
      oddsMid,
      oddsSpread: Math.random() * 0.1,
      liquidity,
      funding8h: (Math.random() - 0.5) * 0.02,
      funding1d: (Math.random() - 0.5) * 0.1,
      fgi,
      pnl30d: (Math.random() - 0.5) * 0.4,
      vol30d: Math.random() * 1.0,
    });
    
    features.push(featureVector);
    
    // Create some patterns
    const probability = (oddsMid - 0.1) / 0.8 * 0.6 + (fgi / 100) * 0.4;
    labels.push(Math.random() < probability);
  }
  
  return { features, labels };
}

function generateReliabilityBins(predictions: number[], actuals: boolean[], bins: number = 10) {
  const binSize = 1 / bins;
  const result = [];
  
  for (let i = 0; i < bins; i++) {
    const binStart = i * binSize;
    const binEnd = (i + 1) * binSize;
    
    const binIndices = predictions
      .map((p, idx) => p >= binStart && p < binEnd ? idx : -1)
      .filter(idx => idx !== -1);
    
    if (binIndices.length === 0) {
      result.push({
        bin: i,
        binStart,
        binEnd,
        count: 0,
        meanPrediction: 0,
        meanOutcome: 0,
        wilsonCI: [0, 0] as [number, number],
      });
      continue;
    }
    
    const binPredictions = binIndices.map(idx => predictions[idx]);
    const binActuals = binIndices.map(idx => actuals[idx]);
    
    const meanPrediction = binPredictions.reduce((sum, p) => sum + p, 0) / binPredictions.length;
    const meanOutcome = binActuals.reduce((sum, a) => sum + (a ? 1 : 0), 0) / binActuals.length;
    const successes = binActuals.filter(a => a).length;
    
    // Simple Wilson CI
    const n = binActuals.length;
    const p = meanOutcome;
    const z = 1.96;
    const center = (p + (z * z) / (2 * n)) / (1 + (z * z) / n);
    const margin = (z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / (1 + (z * z) / n);
    
    result.push({
      bin: i,
      binStart,
      binEnd,
      count: binIndices.length,
      meanPrediction,
      meanOutcome,
      wilsonCI: [
        Math.max(0, center - margin),
        Math.min(1, center + margin)
      ] as [number, number],
    });
  }
  
  return result;
}

async function createMockEval(modelId: string, modelPath: string, plattPath: string, outputDir: string) {
  console.log(`Creating mock evaluation for model ${modelId}...`);
  
  // Load model and Platt scaling
  const { readFileSync } = await import('fs');
  const modelData = readFileSync(modelPath, 'utf-8');
  const model = loadModel(modelData);
  
  const plattData = readFileSync(plattPath, 'utf-8');
  const plattScaling = loadPlattScaling(plattData);
  
  // Generate mock test data
  const samples = 50;
  const { features, labels } = generateMockData(samples);
  
  // Get predictions
  const { predictProba } = await import('../src/models/logistic');
  const { calibrateProbabilities } = await import('../src/models/platt');
  
  const rawPredictions = predictProba(model, features);
  const calibratedPredictions = calibrateProbabilities(rawPredictions, plattScaling);
  
  // Calculate metrics
  const actuals = labels.map(b => b ? 1 : 0);
  
  // Brier score
  let brierScore = 0;
  for (let i = 0; i < calibratedPredictions.length; i++) {
    brierScore += Math.pow(calibratedPredictions[i] - actuals[i], 2);
  }
  brierScore /= calibratedPredictions.length;
  
  // Log loss
  let logLoss = 0;
  for (let i = 0; i < calibratedPredictions.length; i++) {
    const p = Math.max(1e-15, Math.min(1 - 1e-15, calibratedPredictions[i]));
    logLoss += -(actuals[i] * Math.log(p) + (1 - actuals[i]) * Math.log(1 - p));
  }
  logLoss /= calibratedPredictions.length;
  
  // Accuracy
  let correct = 0;
  for (let i = 0; i < calibratedPredictions.length; i++) {
    if ((calibratedPredictions[i] > 0.5) === (actuals[i] > 0.5)) {
      correct++;
    }
  }
  const accuracy = correct / calibratedPredictions.length;
  
  // Reliability and resolution
  const overallMean = actuals.reduce((sum: number, a) => sum + a, 0) / actuals.length;
  const uncertainty = overallMean * (1 - overallMean);
  
  let reliability = 0;
  let resolution = 0;
  const bins = 10;
  const binSize = 1 / bins;
  
  for (let i = 0; i < bins; i++) {
    const binStart = i * binSize;
    const binEnd = (i + 1) * binSize;
    
    const binIndices = calibratedPredictions
      .map((p, idx) => p >= binStart && p < binEnd ? idx : -1)
      .filter(idx => idx !== -1);
    
    if (binIndices.length > 0) {
      const binProbs = binIndices.map(idx => calibratedPredictions[idx]);
      const binActuals = binIndices.map(idx => actuals[idx]);
      const binMean = binActuals.reduce((sum: number, a) => sum + a, 0) / binActuals.length;
      const binProbMean = binProbs.reduce((sum, p) => sum + p, 0) / binProbs.length;
      
      const binReliability = binProbs.reduce((sum, p) => sum + Math.pow(p - binMean, 2), 0) / binProbs.length;
      reliability += binReliability * binIndices.length;
      
      resolution += Math.pow(binMean - overallMean, 2) * binIndices.length;
    }
  }
  
  reliability /= calibratedPredictions.length;
  resolution /= calibratedPredictions.length;
  
  // Generate reliability bins
  const reliabilityBins = generateReliabilityBins(calibratedPredictions, labels);
  
  // Create result
  const result: MockEvalResult = {
    modelId,
    evaluationDate: new Date().toISOString(),
    samples,
    metrics: {
      brierScore,
      logLoss,
      accuracy,
      reliability,
      resolution,
      uncertainty,
    },
    calibration: {
      originalBrier: plattScaling.metadata.originalBrierScore,
      calibratedBrier: plattScaling.metadata.calibratedBrierScore,
      improvement: plattScaling.metadata.improvement,
    },
    reliabilityBins,
    modelMetadata: {
      trainedAt: model.metadata.trainedAt.toISOString(),
      trainingSamples: model.metadata.trainingSamples,
      convergenceIterations: model.metadata.convergenceIterations,
    },
    plattMetadata: {
      trainedAt: plattScaling.metadata.trainedAt.toISOString(),
      holdoutSamples: plattScaling.metadata.holdoutSamples,
      originalBrierScore: plattScaling.metadata.originalBrierScore,
      calibratedBrierScore: plattScaling.metadata.calibratedBrierScore,
      improvement: plattScaling.metadata.improvement,
    },
  };
  
  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  // Save results
  const resultPath = join(outputDir, `${modelId}-eval.json`);
  writeFileSync(resultPath, JSON.stringify(result, null, 2));
  
  console.log(`Mock evaluation complete:`);
  console.log(`  Samples: ${result.samples}`);
  console.log(`  Brier Score: ${result.metrics.brierScore.toFixed(6)}`);
  console.log(`  Log Loss: ${result.metrics.logLoss.toFixed(6)}`);
  console.log(`  Accuracy: ${result.metrics.accuracy.toFixed(3)}`);
  console.log(`  Calibration Improvement: ${result.calibration.improvement.toFixed(6)}`);
  console.log(`  Results saved to: ${resultPath}`);
  
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: tsx mock-eval.ts <modelId> <modelPath> <plattPath> [outputDir]');
    console.log('Example: tsx mock-eval.ts v1 models/v1.json models/v1-platt.json eval');
    process.exit(1);
  }
  
  const modelId = args[0];
  const modelPath = args[1];
  const plattPath = args[2];
  const outputDir = args[3] || './eval';
  
  try {
    await createMockEval(modelId, modelPath, plattPath, outputDir);
  } catch (error) {
    console.error('Mock evaluation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { createMockEval };
export type { MockEvalResult };
