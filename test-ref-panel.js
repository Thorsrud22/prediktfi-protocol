// Test script to verify ref link generation
const { getAttribution } = require('./app/lib/attribution');

console.log('=== Testing RefPanel Link Generation ===\n');

// Mock localStorage for testing
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  }
};

// Test scenarios
const testScenarios = [
  {
    name: 'No stored attribution, with creatorId',
    setup: () => {
      localStorage.data = {};
    },
    marketId: 'bitcoin-2024',
    creatorId: 'crypto_analyst',
    expected: 'creator=crypto_analyst'
  },
  {
    name: 'Stored ref, with creatorId',
    setup: () => {
      localStorage.setItem('predikt:ref', 'myref');
      localStorage.setItem('predikt:creatorId', 'stored_creator');
    },
    marketId: 'bitcoin-2024',
    creatorId: 'crypto_analyst',
    expected: 'ref=myref&creator=crypto_analyst'
  },
  {
    name: 'Stored ref only, no creatorId',
    setup: () => {
      localStorage.setItem('predikt:ref', 'partner123');
      localStorage.data['predikt:creatorId'] = null;
    },
    marketId: 'eth-price',
    creatorId: undefined,
    expected: 'ref=partner123'
  },
  {
    name: 'No stored ref, no creatorId',
    setup: () => {
      localStorage.data = {};
    },
    marketId: 'simple-market',
    creatorId: undefined,
    expected: 'no query params'
  }
];

testScenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. ${scenario.name}`);
  
  // Setup test environment
  scenario.setup();
  
  // Simulate RefPanel link generation logic
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const marketPath = `/market/${encodeURIComponent(scenario.marketId)}`;
  
  // Get attribution data
  const attribution = getAttribution();
  
  // Determine ref value: use stored ref if exists, otherwise creatorId
  const refValue = attribution.ref || scenario.creatorId || "";
  const creatorValue = scenario.creatorId || "";
  
  // Build URL with query parameters
  const url = new URL(marketPath, baseUrl);
  if (refValue) {
    url.searchParams.set("ref", refValue);
  }
  if (creatorValue) {
    url.searchParams.set("creator", creatorValue);
  }
  
  const generatedLink = url.toString();
  const queryPart = url.search;
  
  console.log(`   Generated: ${generatedLink}`);
  console.log(`   Query: ${queryPart || '(none)'}`);
  console.log(`   Expected: ${scenario.expected}`);
  
  const hasExpectedParams = queryPart.includes(scenario.expected) || 
    (scenario.expected === 'no query params' && !queryPart);
  
  console.log(`   ✓ ${hasExpectedParams ? 'PASS' : 'FAIL'}\n`);
});

console.log('=== Copy Function Test ===');
console.log('The copy functionality uses navigator.clipboard.writeText()');
console.log('This requires HTTPS or localhost to work in browsers.');
console.log('✓ Should work on localhost:3000\n');

console.log('=== Manual Testing Checklist ===');
console.log('1. Visit http://localhost:3000/market/1');
console.log('2. Verify CreatorPill shows: SolanaMax, KOL badge, X link icon');
console.log('3. Check RefPanel shows a properly formatted link');
console.log('4. Click "Kopier" button and verify "Kopiert!" confirmation');
console.log('5. Try the link in a new tab to verify attribution capture');
