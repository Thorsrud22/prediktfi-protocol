// Test script for proof-first MVP
import {
  selectResolver,
  verifiabilityScore,
  confidenceToProbability,
  canonicalize,
} from './app/lib/resolvers';

console.log('🧪 Testing Proof-first MVP utilities...\n');

// Test 1: Resolver selection
console.log('1. Testing resolver selection:');
const testTexts = [
  'Bitcoin will reach $50,000 by end of January 2025',
  'Will the website https://example.com show "Hello World"?',
  'The next election will result in a victory',
  'ETH price will be above $3000 next week',
];

testTexts.forEach((text, i) => {
  const resolver = selectResolver(text);
  console.log(`  ${i + 1}. "${text}"`);
  console.log(`     → ${resolver.kind} (${resolver.resolverRef || 'no ref'})`);
  console.log(`     → Reasons: ${resolver.reasons.join(', ')}\n`);
});

// Test 2: Verifiability scoring
console.log('2. Testing verifiability scoring:');
const testDeadlines = [
  new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
  new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
];

['PRICE', 'URL', 'TEXT'].forEach(kind => {
  testDeadlines.forEach((deadline, i) => {
    const score = verifiabilityScore({
      kind: kind,
      deadline,
      evidenceCount: 1,
    });
    const timeDesc = ['24h', '1w', '3mo'][i];
    console.log(`  ${kind} + ${timeDesc}: ${score}`);
  });
});

// Test 3: Confidence conversion
console.log('\n3. Testing confidence conversion:');
['high', 'medium', 'low'].forEach(conf => {
  const prob = confidenceToProbability(conf);
  console.log(`  ${conf} → ${prob}`);
});

// Test 4: Canonicalization
console.log('\n4. Testing canonicalization:');
const testCanonical = [
  'Bitcoin will reach $50,000!!!',
  'Will    BTC   hit   100k?',
  '"The market" will crash next week.',
];

testCanonical.forEach(text => {
  const canonical = canonicalize(text);
  console.log(`  "${text}" → "${canonical}"`);
});

console.log('\n✅ All tests completed!');
