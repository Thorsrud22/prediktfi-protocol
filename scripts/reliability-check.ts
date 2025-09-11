#!/usr/bin/env tsx
/**
 * Reliability Check
 * 
 * Generates reliability diagram to check calibration quality
 */

import { readFileSync } from 'fs';
import { loadModel } from '../src/models/logistic';
import { loadPlattScaling, calibrateProbabilities } from '../src/models/platt';
import { createFeatureVector } from '../src/models/features';

interface ReliabilityBin {
  bin: number;
  binStart: number;
  binEnd: number;
  count: number;
  meanPrediction: number;
  meanOutcome: number;
  wilsonCI: [number, number];
}

/**
 * Generate reliability diagram data
 */
function generateReliabilityDiagram(
  predictions: number[],
  actuals: boolean[],
  bins: number = 10
): ReliabilityBin[] {
  const binSize = 1 / bins;
  const result: ReliabilityBin[] = [];
  
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
        wilsonCI: [0, 0],
      });
      continue;
    }
    
    const binPredictions = binIndices.map(idx => predictions[idx]);
    const binActuals = binIndices.map(idx => actuals[idx]);
    
    const meanPrediction = binPredictions.reduce((sum, p) => sum + p, 0) / binPredictions.length;
    const meanOutcome = binActuals.reduce((sum, a) => sum + (a ? 1 : 0), 0) / binActuals.length;
    const successes = binActuals.filter(a => a).length;
    
    // Wilson CI
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
      ],
    });
  }
  
  return result;
}

/**
 * Calculate calibration metrics
 */
function calculateCalibrationMetrics(bins: ReliabilityBin[]) {
  let reliability = 0;
  let resolution = 0;
  let uncertainty = 0;
  
  const totalSamples = bins.reduce((sum, bin) => sum + bin.count, 0);
  const overallMean = bins.reduce((sum, bin) => sum + bin.meanOutcome * bin.count, 0) / totalSamples;
  uncertainty = overallMean * (1 - overallMean);
  
  for (const bin of bins) {
    if (bin.count > 0) {
      // Reliability: mean((prediction - bin_mean)^2)
      const binReliability = Math.pow(bin.meanPrediction - bin.meanOutcome, 2);
      reliability += binReliability * bin.count;
      
      // Resolution: (bin_mean - overall_mean)^2 * bin_weight
      resolution += Math.pow(bin.meanOutcome - overallMean, 2) * bin.count;
    }
  }
  
  reliability /= totalSamples;
  resolution /= totalSamples;
  
  return { reliability, resolution, uncertainty };
}

/**
 * Check if reliability is good (close to 45° line)
 */
function checkReliability(bins: ReliabilityBin[]): { isGood: boolean; maxDeviation: number; issues: string[] } {
  const issues: string[] = [];
  let maxDeviation = 0;
  
  for (const bin of bins) {
    if (bin.count > 0) {
      const deviation = Math.abs(bin.meanPrediction - bin.meanOutcome);
      maxDeviation = Math.max(maxDeviation, deviation);
      
      // Check for systematic over/under-estimation
      if (deviation > 0.1) {
        issues.push(`Bin ${bin.bin} (${bin.binStart.toFixed(2)}-${bin.binEnd.toFixed(2)}): deviation ${deviation.toFixed(3)}`);
      }
      
      // Check if prediction is outside confidence interval
      if (bin.meanPrediction < bin.wilsonCI[0] || bin.meanPrediction > bin.wilsonCI[1]) {
        issues.push(`Bin ${bin.bin}: prediction ${bin.meanPrediction.toFixed(3)} outside CI [${bin.wilsonCI[0].toFixed(3)}, ${bin.wilsonCI[1].toFixed(3)}]`);
      }
    }
  }
  
  const isGood = maxDeviation < 0.1 && issues.length === 0;
  
  return { isGood, maxDeviation, issues };
}

async function runReliabilityCheck(modelPath: string, plattPath: string) {
  console.log('Loading model and Platt scaling...');
  
  const modelData = readFileSync(modelPath, 'utf-8');
  const model = loadModel(modelData);
  
  const plattData = readFileSync(plattPath, 'utf-8');
  const plattScaling = loadPlattScaling(plattData);
  
  // Generate test data with stronger patterns
  const samples = 1000;
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
    
    // Create stronger patterns
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
  
  console.log(`Generated ${samples} test samples`);
  
  // Get predictions
  const { predictProba } = await import('../src/models/logistic');
  const rawPredictions = predictProba(model, features);
  const calibratedPredictions = calibrateProbabilities(rawPredictions, plattScaling);
  
  // Generate reliability diagram
  const bins = generateReliabilityDiagram(calibratedPredictions, labels);
  
  // Calculate metrics
  const metrics = calculateCalibrationMetrics(bins);
  
  // Check reliability
  const reliabilityCheck = checkReliability(bins);
  
  console.log('\n=== Reliability Check Results ===');
  console.log(`Reliability: ${metrics.reliability.toFixed(6)}`);
  console.log(`Resolution: ${metrics.resolution.toFixed(6)}`);
  console.log(`Uncertainty: ${metrics.uncertainty.toFixed(6)}`);
  console.log(`Max Deviation: ${reliabilityCheck.maxDeviation.toFixed(3)}`);
  console.log(`Is Good: ${reliabilityCheck.isGood ? '✅ YES' : '❌ NO'}`);
  
  if (reliabilityCheck.issues.length > 0) {
    console.log('\nIssues found:');
    reliabilityCheck.issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  console.log('\nReliability Bins:');
  console.log('Bin | Range      | Count | Pred   | Actual | CI Low | CI High');
  console.log('----|------------|-------|--------|--------|--------|--------');
  
  for (const bin of bins) {
    if (bin.count > 0) {
      console.log(
        `${bin.bin.toString().padStart(3)} | ` +
        `${bin.binStart.toFixed(2)}-${bin.binEnd.toFixed(2)} | ` +
        `${bin.count.toString().padStart(5)} | ` +
        `${bin.meanPrediction.toFixed(3)} | ` +
        `${bin.meanOutcome.toFixed(3)} | ` +
        `${bin.wilsonCI[0].toFixed(3)} | ` +
        `${bin.wilsonCI[1].toFixed(3)}`
      );
    }
  }
  
  return { bins, metrics, reliabilityCheck };
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: tsx reliability-check.ts <modelPath> <plattPath>');
    console.log('Example: tsx reliability-check.ts models/v1.json models/v1-platt.json');
    process.exit(1);
  }
  
  const modelPath = args[0];
  const plattPath = args[1];
  
  try {
    await runReliabilityCheck(modelPath, plattPath);
  } catch (error) {
    console.error('Reliability check failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { runReliabilityCheck };
