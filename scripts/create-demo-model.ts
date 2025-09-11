#!/usr/bin/env tsx
/**
 * Create Demo Model
 * 
 * Creates a demo logistic regression model and Platt scaling for testing
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { fit, saveModel } from '../src/models/logistic';
import { fitPlattScaling, savePlattScaling } from '../src/models/platt';
import { createFeatureVector, FeatureVector } from '../src/models/features';

// Create demo training data
function createDemoData(): { features: FeatureVector[]; labels: boolean[] } {
  const features: FeatureVector[] = [];
  const labels: boolean[] = [];
  
  // Generate 500 samples with stronger patterns
  for (let i = 0; i < 500; i++) {
    const oddsMid = Math.random() * 0.8 + 0.1; // 0.1 to 0.9
    const fgi = Math.random() * 100; // 0 to 100
    const liquidity = Math.random() * 1000000; // 0 to 1M
    const funding8h = (Math.random() - 0.5) * 0.02; // -1% to +1%
    const funding1d = (Math.random() - 0.5) * 0.1; // -5% to +5%
    const pnl30d = (Math.random() - 0.5) * 0.4; // -20% to +20%
    const vol30d = Math.random() * 1.0; // 0% to 100%
    
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
    
    // Create stronger patterns with more features
    // Higher odds_mid -> more likely YES
    const oddsEffect = (oddsMid - 0.1) / 0.8 * 0.4;
    
    // Higher FGI -> more likely YES (but with diminishing returns)
    const fgiEffect = Math.pow(fgi / 100, 0.7) * 0.3;
    
    // Higher liquidity -> more likely YES (but with diminishing returns)
    const liquidityEffect = Math.pow(liquidity / 1000000, 0.5) * 0.1;
    
    // Positive funding -> more likely YES
    const fundingEffect = Math.max(0, funding8h * 10) * 0.1;
    
    // Higher volatility -> less likely YES (risk aversion)
    const volEffect = -vol30d * 0.1;
    
    // Combine all effects
    const probability = Math.max(0.05, Math.min(0.95, 
      oddsEffect + fgiEffect + liquidityEffect + fundingEffect + volEffect
    ));
    
    labels.push(Math.random() < probability);
  }
  
  return { features, labels };
}

async function createDemoModel() {
  console.log('Creating demo model...');
  
  // Create training data
  const { features, labels } = createDemoData();
  console.log(`Generated ${features.length} training samples`);
  
  // Train logistic regression model with better parameters
  console.log('Training logistic regression...');
  const model = fit(features, labels, {
    learningRate: 0.05, // Higher learning rate for faster convergence
    maxIterations: 100, // More iterations
    convergenceThreshold: 1e-8, // Stricter convergence
    regularization: 0.1, // Higher regularization to prevent overfitting
  });
  
  // Save model
  const modelJson = saveModel(model, 'v1');
  const modelPath = join(process.cwd(), 'models', 'v1.json');
  writeFileSync(modelPath, modelJson);
  console.log(`Model saved to ${modelPath}`);
  
  // Get raw predictions for Platt scaling
  const { predictProba } = await import('../src/models/logistic');
  const rawPredictions = predictProba(model, features);
  
  // Train Platt scaling
  console.log('Training Platt scaling...');
  const plattScaling = fitPlattScaling(rawPredictions, labels, 0.2);
  
  // Save Platt scaling
  const plattJson = savePlattScaling(plattScaling, 'v1');
  const plattPath = join(process.cwd(), 'models', 'v1-platt.json');
  writeFileSync(plattPath, plattJson);
  console.log(`Platt scaling saved to ${plattPath}`);
  
  console.log('Demo model creation complete!');
  console.log(`Model performance:`);
  console.log(`  Training samples: ${model.metadata.trainingSamples}`);
  console.log(`  Convergence iterations: ${model.metadata.convergenceIterations}`);
  console.log(`  Final accuracy: ${model.trainingHistory[model.trainingHistory.length - 1]?.accuracy.toFixed(3)}`);
  console.log(`  Calibration improvement: ${plattScaling.metadata.improvement.toFixed(6)}`);
}

if (require.main === module) {
  createDemoModel().catch(console.error);
}

export { createDemoModel };
