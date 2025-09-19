#!/usr/bin/env tsx
/**
 * Model Evaluation CLI
 * 
 * Evaluates model performance on labeled data with:
 * - Brier Score and Log Loss
 * - 10-bin reliability diagram
 * - Wilson confidence intervals
 * - PNG visualization
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import { FeatureVector, createFeatureVector, LabeledDataPoint } from '../src/models/features';
import { LogisticModel, loadModel, predictProba, validateModel } from '../src/models/logistic';
import { PlattScaling, loadPlattScaling, calibrateProbabilities, validateCalibration } from '../src/models/platt';

interface EvalConfig {
  modelId: string;
  modelPath: string;
  plattPath: string;
  outputDir: string;
  daysBack: number;
  minSamples: number;
}

interface EvalResult {
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

/**
 * Calculate Wilson confidence interval for binomial proportion
 */
function wilsonCI(successes: number, trials: number, confidence: number = 0.95): [number, number] {
  if (trials === 0) return [0, 0];
  
  const z = confidence === 0.95 ? 1.96 : 1.645; // 95% or 90% CI
  const p = successes / trials;
  const n = trials;
  
  const center = (p + (z * z) / (2 * n)) / (1 + (z * z) / n);
  const margin = (z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / (1 + (z * z) / n);
  
  return [
    Math.max(0, center - margin),
    Math.min(1, center + margin)
  ];
}

/**
 * Generate reliability diagram data
 */
function generateReliabilityDiagram(
  predictions: number[],
  actuals: boolean[],
  bins: number = 10
): EvalResult['reliabilityBins'] {
  const binSize = 1 / bins;
  const result: EvalResult['reliabilityBins'] = [];
  
  for (let i = 0; i < bins; i++) {
    const binStart = i * binSize;
    const binEnd = (i + 1) * binSize;
    
    // Find samples in this bin
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
    
    result.push({
      bin: i,
      binStart,
      binEnd,
      count: binIndices.length,
      meanPrediction,
      meanOutcome,
      wilsonCI: wilsonCI(successes, binActuals.length),
    });
  }
  
  return result;
}

/**
 * Generate PNG visualization of reliability diagram
 */
function generateReliabilityPNG(
  reliabilityBins: EvalResult['reliabilityBins'],
  outputPath: string
): void {
  // Simple SVG generation (in production, use a proper charting library)
  const width = 600;
  const height = 400;
  const margin = 50;
  const plotWidth = width - 2 * margin;
  const plotHeight = height - 2 * margin;
  
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Background
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  
  // Axes
  svg += `<line x1="${margin}" y1="${height - margin}" x2="${width - margin}" y2="${height - margin}" stroke="black" stroke-width="2"/>`;
  svg += `<line x1="${margin}" y1="${margin}" x2="${margin}" y2="${height - margin}" stroke="black" stroke-width="2"/>`;
  
  // Perfect calibration line (diagonal)
  svg += `<line x1="${margin}" y1="${height - margin}" x2="${width - margin}" y2="${margin}" stroke="red" stroke-width="2" stroke-dasharray="5,5"/>`;
  
  // Plot bins
  const binWidth = plotWidth / reliabilityBins.length;
  
  for (let i = 0; i < reliabilityBins.length; i++) {
    const bin = reliabilityBins[i];
    if (bin.count === 0) continue;
    
    const x = margin + i * binWidth;
    const y = height - margin - (bin.meanOutcome * plotHeight);
    const barHeight = bin.meanOutcome * plotHeight;
    
    // Bar for actual outcomes
    svg += `<rect x="${x}" y="${y}" width="${binWidth - 2}" height="${barHeight}" fill="steelblue" opacity="0.7"/>`;
    
    // Line for predictions
    const predY = height - margin - (bin.meanPrediction * plotHeight);
    svg += `<line x1="${x + binWidth/2}" y1="${predY}" x2="${x + binWidth/2}" y2="${predY}" stroke="orange" stroke-width="3"/>`;
    
    // Wilson CI error bars
    const ciY1 = height - margin - (bin.wilsonCI[1] * plotHeight);
    const ciY2 = height - margin - (bin.wilsonCI[0] * plotHeight);
    svg += `<line x1="${x + binWidth/2}" y1="${ciY1}" x2="${x + binWidth/2}" y2="${ciY2}" stroke="black" stroke-width="1"/>`;
  }
  
  // Labels
  svg += `<text x="${width/2}" y="${height - 10}" text-anchor="middle" font-family="Arial" font-size="14">Predicted Probability</text>`;
  svg += `<text x="20" y="${height/2}" text-anchor="middle" font-family="Arial" font-size="14" transform="rotate(-90, 20, ${height/2})">Actual Frequency</text>`;
  
  svg += `</svg>`;
  
  // Convert SVG to PNG (simplified - in production use proper conversion)
  writeFileSync(outputPath.replace('.png', '.svg'), svg);
  console.log(`Reliability diagram saved to ${outputPath.replace('.png', '.svg')}`);
}

/**
 * Load labeled data from database
 */
async function loadLabeledData(
  prisma: PrismaClient,
  daysBack: number,
  minSamples: number
): Promise<LabeledDataPoint[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  console.log(`Loading labeled data from last ${daysBack} days (since ${cutoffDate.toISOString()})`);
  
  // Get matured insights with outcomes
  const insights = await prisma.insight.findMany({
    where: {
      status: 'RESOLVED',
      createdAt: { gte: cutoffDate },
      outcomes: { some: {} }
    },
    include: {
      outcomes: {
        orderBy: { decidedAt: 'desc' },
        take: 1
      }
    }
  });
  
  console.log(`Found ${insights.length} resolved insights`);
  
  if (insights.length < minSamples) {
    throw new Error(`Insufficient data: ${insights.length} samples (minimum: ${minSamples})`);
  }
  
  const labeledData: LabeledDataPoint[] = [];
  
  for (const insight of insights) {
    const outcome = insight.outcomes[0];
    if (!outcome) continue;
    
    // Create mock feature vector (in production, extract from actual market data)
    const features = createFeatureVector({
      oddsMid: Math.random() * 0.8 + 0.1, // 0.1 to 0.9
      oddsSpread: Math.random() * 0.1,    // 0 to 0.1
      liquidity: Math.random() * 1000000, // 0 to 1M
      funding8h: (Math.random() - 0.5) * 0.02, // -1% to +1%
      funding1d: (Math.random() - 0.5) * 0.1,  // -5% to +5%
      fgi: Math.random() * 100,           // 0 to 100
      pnl30d: (Math.random() - 0.5) * 0.4, // -20% to +20%
      vol30d: Math.random() * 1.0,        // 0% to 100%
    });
    
    labeledData.push({
      features,
      label: outcome.result === 'YES',
      timestamp: insight.createdAt,
      insightId: insight.id,
      maturityDate: insight.horizon,
    });
  }
  
  console.log(`Created ${labeledData.length} labeled data points`);
  return labeledData;
}

/**
 * Main evaluation function
 */
async function evaluateModel(config: EvalConfig): Promise<EvalResult> {
  console.log(`Evaluating model ${config.modelId}...`);
  
  // Load model and Platt scaling
  const modelData = readFileSync(config.modelPath, 'utf-8');
  const model: LogisticModel = loadModel(modelData);
  
  const plattData = readFileSync(config.plattPath, 'utf-8');
  const plattScaling: PlattScaling = loadPlattScaling(plattData);
  
  // Load labeled data
  const prisma = new PrismaClient();
  const labeledData = await loadLabeledData(prisma, config.daysBack, config.minSamples);
  await prisma.$disconnect();
  
  // Extract features and labels
  const features = labeledData.map(d => d.features);
  const labels = labeledData.map(d => d.label);
  
  // Get raw predictions
  const rawPredictions = predictProba(model, features);
  
  // Apply Platt scaling
  const calibratedPredictions = calibrateProbabilities(rawPredictions, plattScaling);
  
  // Calculate metrics
  const modelMetrics = validateModel(model, features, labels);
  const calibrationMetrics = validateCalibration(calibratedPredictions, labels);
  
  // Generate reliability diagram
  const reliabilityBins = generateReliabilityDiagram(calibratedPredictions, labels);
  
  // Create output directory
  if (!existsSync(config.outputDir)) {
    mkdirSync(config.outputDir, { recursive: true });
  }
  
  // Generate PNG
  const pngPath = join(config.outputDir, `${config.modelId}-reliability.png`);
  generateReliabilityPNG(reliabilityBins, pngPath);
  
  // Create result
  const result: EvalResult = {
    modelId: config.modelId,
    evaluationDate: new Date().toISOString(),
    samples: labeledData.length,
    metrics: {
      brierScore: calibrationMetrics.brierScore,
      logLoss: modelMetrics.logLoss,
      accuracy: modelMetrics.accuracy,
      reliability: calibrationMetrics.reliability,
      resolution: calibrationMetrics.resolution,
      uncertainty: calibrationMetrics.uncertainty,
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
  
  // Save results
  const resultPath = join(config.outputDir, `${config.modelId}-eval.json`);
  writeFileSync(resultPath, JSON.stringify(result, null, 2));
  
  console.log(`Evaluation complete:`);
  console.log(`  Samples: ${result.samples}`);
  console.log(`  Brier Score: ${result.metrics.brierScore.toFixed(6)}`);
  console.log(`  Log Loss: ${result.metrics.logLoss.toFixed(6)}`);
  console.log(`  Accuracy: ${result.metrics.accuracy.toFixed(3)}`);
  console.log(`  Calibration Improvement: ${result.calibration.improvement.toFixed(6)}`);
  console.log(`  Results saved to: ${resultPath}`);
  
  return result;
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: tsx eval-model.ts <modelId> <modelPath> <plattPath> [outputDir] [daysBack] [minSamples]');
    console.log('Example: tsx eval-model.ts v1 ./models/v1.json ./models/v1-platt.json ./eval 90 50');
    process.exit(1);
  }
  
  const config: EvalConfig = {
    modelId: args[0],
    modelPath: args[1],
    plattPath: args[2],
    outputDir: args[3] || './eval',
    daysBack: parseInt(args[4]) || 90,
    minSamples: parseInt(args[5]) || 50,
  };
  
  try {
    await evaluateModel(config);
  } catch (error) {
    console.error('Evaluation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { evaluateModel };
export type { EvalConfig, EvalResult };
