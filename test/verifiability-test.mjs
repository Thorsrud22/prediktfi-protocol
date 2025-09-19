import { verifiabilityScore } from '../app/lib/resolvers.ts';

// Test verifiability score function
console.log('=== Testing Verifiability Score Function ===');

// Test PRICE resolver with Bitcoin (should have high verifiability)
const btcResolver = {
  symbol: 'BTC',
  exchange: 'coinbase',
  threshold: 120000,
  comparison: 'gte',
};
console.log('PRICE/BTC verifiability:', verifiabilityScore('PRICE', btcResolver));

// Test PRICE resolver with unknown symbol (should have lower verifiability)
const unknownResolver = {
  symbol: 'UNKNOWN',
  exchange: 'random',
  threshold: 100,
  comparison: 'gte',
};
console.log('PRICE/UNKNOWN verifiability:', verifiabilityScore('PRICE', unknownResolver));

// Test URL resolver (should have high verifiability)
const urlResolver = {
  url: 'https://example.com/results',
  selector: 'h1',
  expectedText: 'Success',
};
console.log('URL verifiability:', verifiabilityScore('URL', urlResolver));

// Test TEXT resolver (should have lowest verifiability)
const textResolver = {
  criteria: 'Manual verification required',
};
console.log('TEXT verifiability:', verifiabilityScore('TEXT', textResolver));

console.log('\n=== Expected Results ===');
console.log('PRICE/BTC should be ~0.9');
console.log('PRICE/UNKNOWN should be ~0.6');
console.log('URL should be ~0.8');
console.log('TEXT should be ~0.4');
