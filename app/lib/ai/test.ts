// Test file for AI kernel - remove after validation
import { predict } from './kernel';

async function testKernel() {
  console.log('Testing AI Kernel v0...\n');
  
  // Test 1: Mock adapter (non-crypto)
  const mockTest = await predict({
    topic: 'politics',
    question: 'Will the next election result favor incumbents?',
    horizon: '6months',
    context: 'Current polling data shows tight race'
  });
  
  console.log('Mock Test Result:');
  console.log(`Probability: ${mockTest.prob}`);
  console.log(`Drivers: ${mockTest.drivers.join(', ')}`);
  console.log(`Rationale: ${mockTest.rationale}`);
  console.log(`Model: ${mockTest.model}`);
  console.log(`Scenario ID: ${mockTest.scenarioId}\n`);
  
  // Test 2: Baseline adapter (crypto)
  const baselineTest = await predict({
    topic: 'crypto',
    question: 'Will Bitcoin price increase?',
    horizon: '24h',
    context: 'Recent market volatility'
  });
  
  console.log('Baseline Test Result:');
  console.log(`Probability: ${baselineTest.prob}`);
  console.log(`Drivers: ${baselineTest.drivers.join(', ')}`);
  console.log(`Rationale: ${baselineTest.rationale}`);
  console.log(`Model: ${baselineTest.model}`);
  console.log(`Scenario ID: ${baselineTest.scenarioId}`);
}

// Only run if called directly
if (require.main === module) {
  testKernel().catch(console.error);
}
