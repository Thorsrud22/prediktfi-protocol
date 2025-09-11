#!/usr/bin/env tsx
/**
 * Input Guarding Test
 * 
 * Tests model robustness against invalid inputs
 */

import { loadModel } from '../src/models/logistic';
import { loadPlattScaling, calibrateProbabilities } from '../src/models/platt';
import { createFeatureVector } from '../src/models/features';

interface TestCase {
  name: string;
  input: any;
  shouldThrow: boolean;
  expectedBehavior: string;
}

const testCases: TestCase[] = [
  {
    name: 'NaN odds_mid',
    input: { oddsMid: NaN, fgi: 50, liquidity: 100000 },
    shouldThrow: false,
    expectedBehavior: 'Should normalize to 0.5 (mid-range)'
  },
  {
    name: 'Infinity odds_mid',
    input: { oddsMid: Infinity, fgi: 50, liquidity: 100000 },
    shouldThrow: false,
    expectedBehavior: 'Should clamp to [0,1] range'
  },
  {
    name: 'Negative funding',
    input: { oddsMid: 0.5, fgi: 50, liquidity: 100000, funding8h: -0.1 },
    shouldThrow: false,
    expectedBehavior: 'Should normalize negative funding correctly'
  },
  {
    name: 'Extreme odds (0.001)',
    input: { oddsMid: 0.001, fgi: 50, liquidity: 100000 },
    shouldThrow: false,
    expectedBehavior: 'Should normalize to [0,1] range'
  },
  {
    name: 'Extreme odds (0.999)',
    input: { oddsMid: 0.999, fgi: 50, liquidity: 100000 },
    shouldThrow: false,
    expectedBehavior: 'Should normalize to [0,1] range'
  },
  {
    name: 'Negative liquidity',
    input: { oddsMid: 0.5, fgi: 50, liquidity: -1000 },
    shouldThrow: false,
    expectedBehavior: 'Should clamp to [0,1] range'
  },
  {
    name: 'Extreme FGI (150)',
    input: { oddsMid: 0.5, fgi: 150, liquidity: 100000 },
    shouldThrow: false,
    expectedBehavior: 'Should clamp to [0,1] range'
  },
  {
    name: 'Missing fields',
    input: {},
    shouldThrow: false,
    expectedBehavior: 'Should use default values'
  },
  {
    name: 'Null values',
    input: { oddsMid: null, fgi: null, liquidity: null },
    shouldThrow: false,
    expectedBehavior: 'Should use default values'
  },
  {
    name: 'String values',
    input: { oddsMid: '0.5', fgi: '50', liquidity: '100000' },
    shouldThrow: false,
    expectedBehavior: 'Should convert to numbers'
  }
];

async function testInputGuarding(modelPath: string, plattPath: string) {
  console.log('Loading model and Platt scaling...');
  
  const { readFileSync } = 'fs';
  const modelData = require('fs').readFileSync(modelPath, 'utf-8');
  const model = loadModel(modelData);
  
  const plattData = require('fs').readFileSync(plattPath, 'utf-8');
  const plattScaling = loadPlattScaling(plattData);
  
  console.log('\n=== Input Guarding Test Results ===');
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    try {
      console.log(`\nTesting: ${testCase.name}`);
      console.log(`Input: ${JSON.stringify(testCase.input)}`);
      console.log(`Expected: ${testCase.expectedBehavior}`);
      
      // Test feature vector creation
      const features = createFeatureVector(testCase.input);
      console.log(`Features: ${JSON.stringify(features)}`);
      
      // Test model prediction
      const { predictProba } = await import('../src/models/logistic');
      const rawPredictions = predictProba(model, [features]);
      const calibratedPredictions = calibrateProbabilities(rawPredictions, plattScaling);
      
      console.log(`Raw prediction: ${rawPredictions[0].toFixed(6)}`);
      console.log(`Calibrated prediction: ${calibratedPredictions[0].toFixed(6)}`);
      
      // Check if prediction is valid
      const isValid = 
        !isNaN(calibratedPredictions[0]) && 
        !isFinite(calibratedPredictions[0]) === false &&
        calibratedPredictions[0] >= 0 && 
        calibratedPredictions[0] <= 1;
      
      if (isValid) {
        console.log('✅ PASSED');
        passed++;
      } else {
        console.log('❌ FAILED - Invalid prediction');
        failed++;
      }
      
    } catch (error) {
      if (testCase.shouldThrow) {
        console.log('✅ PASSED - Threw as expected');
        passed++;
      } else {
        console.log(`❌ FAILED - Unexpected error: ${error.message}`);
        failed++;
      }
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${testCases.length}`);
  
  if (failed === 0) {
    console.log('🎉 All input guarding tests passed!');
  } else {
    console.log('⚠️  Some input guarding tests failed - model needs hardening');
  }
  
  return { passed, failed, total: testCases.length };
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: tsx input-guarding.ts <modelPath> <plattPath>');
    console.log('Example: tsx input-guarding.ts models/v1.json models/v1-platt.json');
    process.exit(1);
  }
  
  const modelPath = args[0];
  const plattPath = args[1];
  
  try {
    await testInputGuarding(modelPath, plattPath);
  } catch (error) {
    console.error('Input guarding test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { testInputGuarding };
