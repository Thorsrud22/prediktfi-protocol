// Simple demonstration of RefPanel URL generation logic
console.log('=== RefPanel URL Generation Test ===\n');

// Mock URL construction (similar to what RefPanel does)
function generateRefLink(marketId, creatorId, storedRef = null) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const marketPath = `/market/${encodeURIComponent(marketId)}`;
  
  // Determine ref value: use stored ref if exists, otherwise creatorId
  const refValue = storedRef || creatorId || "";
  const creatorValue = creatorId || "";
  
  // Build URL with query parameters
  const url = new URL(marketPath, baseUrl);
  if (refValue) {
    url.searchParams.set("ref", refValue);
  }
  if (creatorValue) {
    url.searchParams.set("creator", creatorValue);
  }
  
  return url.toString();
}

// Test scenarios
const scenarios = [
  {
    name: 'Market with creator, no stored ref',
    marketId: 'bitcoin-2024',
    creatorId: 'crypto_analyst',
    storedRef: null,
    expected: 'ref=crypto_analyst&creator=crypto_analyst'
  },
  {
    name: 'Market with creator and stored ref',
    marketId: 'bitcoin-2024', 
    creatorId: 'crypto_analyst',
    storedRef: 'partner123',
    expected: 'ref=partner123&creator=crypto_analyst'
  },
  {
    name: 'Market without creator, with stored ref',
    marketId: 'simple-market',
    creatorId: null,
    storedRef: 'affiliate456',
    expected: 'ref=affiliate456'
  },
  {
    name: 'Market without creator or stored ref',
    marketId: 'basic-market',
    creatorId: null,
    storedRef: null,
    expected: 'no query params'
  }
];

scenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. ${scenario.name}`);
  
  const link = generateRefLink(scenario.marketId, scenario.creatorId, scenario.storedRef);
  const url = new URL(link);
  const queryPart = url.search;
  
  console.log(`   Generated: ${link}`);
  console.log(`   Query: ${queryPart || '(none)'}`);
  console.log(`   Expected: ${scenario.expected}`);
  
  const hasExpectedParams = queryPart.includes(scenario.expected.split('&')[0]) || 
    (scenario.expected === 'no query params' && !queryPart);
  
  console.log(`   ✓ ${hasExpectedParams ? 'PASS' : 'FAIL'}\n`);
});

console.log('=== Example Generated Links ===');
console.log('Default (localhost):', generateRefLink('1', 'crypto_analyst_sol'));
console.log('With stored ref:', generateRefLink('1', 'crypto_analyst_sol', 'myref'));
console.log('Production style:', 
  generateRefLink('bitcoin-price', 'analyst123', 'partner456')
    .replace('localhost:3000', 'predikt.fi')
);

console.log('\n=== Manual Testing Instructions ===');
console.log('1. Visit http://localhost:3000/market/1');
console.log('2. Check CreatorPill shows: SolanaMax, KOL badge, X icon');
console.log('3. Scroll to RefPanel below betting section');
console.log('4. Verify link format includes current market');
console.log('5. Click "Kopier" and check for "Kopiert!" confirmation');
console.log('6. Paste link in new tab to test attribution capture');
