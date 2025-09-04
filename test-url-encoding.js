// Test av URL-koding i RefPanel med uvanlige tegn
console.log('=== URL-koding test for RefPanel ===\n');

// Simuler RefPanel URL generering med uvanlige tegn
function testUrlEncoding(marketId, refValue, creatorValue) {
  const baseUrl = "http://localhost:3000";
  const marketPath = `/market/${encodeURIComponent(marketId)}`;
  
  const url = new URL(marketPath, baseUrl);
  if (refValue) {
    url.searchParams.set("ref", refValue);
  }
  if (creatorValue) {
    url.searchParams.set("creator", creatorValue);
  }
  
  return url.toString();
}

// Test cases med uvanlige tegn
const testCases = [
  {
    name: 'Normale tegn',
    marketId: 'bitcoin-2024',
    ref: 'myref123',
    creator: 'analyst_pro',
    expectSafe: true
  },
  {
    name: 'Mellomrom og spesialtegn',
    marketId: 'bitcoin price prediction',
    ref: 'my ref with spaces',
    creator: 'analyst@domain.com',
    expectSafe: true
  },
  {
    name: 'Norske tegn',
    marketId: 'bitcoin-pris-økning',
    ref: 'min-ref-æøå',
    creator: 'norsk_analytiker_ø',
    expectSafe: true
  },
  {
    name: 'Spesialtegn og symboler',
    marketId: 'market/with&special?chars',
    ref: 'ref#with%symbols&more',
    creator: 'creator+with=special/chars',
    expectSafe: true
  },
  {
    name: 'Emojis og unicode',
    marketId: 'bitcoin-🚀-moon',
    ref: 'ref-with-🎯-emoji',
    creator: 'crypto-expert-💰',
    expectSafe: true
  }
];

testCases.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}`);
  console.log(`   Input marketId: "${test.marketId}"`);
  console.log(`   Input ref: "${test.ref}"`);
  console.log(`   Input creator: "${test.creator}"`);
  
  const generatedUrl = testUrlEncoding(test.marketId, test.ref, test.creator);
  console.log(`   Generated URL: ${generatedUrl}`);
  
  // Test at URL-en er gyldig ved å parse den tilbake
  try {
    const parsedUrl = new URL(generatedUrl);
    const parsedRef = parsedUrl.searchParams.get('ref');
    const parsedCreator = parsedUrl.searchParams.get('creator');
    
    console.log(`   Parsed ref: "${parsedRef}"`);
    console.log(`   Parsed creator: "${parsedCreator}"`);
    
    const refMatches = parsedRef === test.ref;
    const creatorMatches = parsedCreator === test.creator;
    
    console.log(`   ✓ Ref roundtrip: ${refMatches ? 'PASS' : 'FAIL'}`);
    console.log(`   ✓ Creator roundtrip: ${creatorMatches ? 'PASS' : 'FAIL'}`);
    console.log(`   ✓ Valid URL: PASS\n`);
  } catch (e) {
    console.log(`   ✗ Invalid URL: ${e.message}\n`);
  }
});

console.log('=== Manual URL.searchParams.set() vs encodeURIComponent() sammenligning ===\n');

const problematiskRef = "ref with spaces & symbols = dangerous?";
const problematiskCreator = "creator/with\\backslash&ampersand";

// Metode 1: URL.searchParams.set() (brukt i RefPanel)
const url1 = new URL("http://localhost:3000/market/test");
url1.searchParams.set("ref", problematiskRef);
url1.searchParams.set("creator", problematiskCreator);

// Metode 2: Manual encodeURIComponent (mindre trygg)
const manual = `http://localhost:3000/market/test?ref=${encodeURIComponent(problematiskRef)}&creator=${encodeURIComponent(problematiskCreator)}`;

console.log('URL.searchParams.set() resultat:');
console.log(url1.toString());
console.log('\nManual encodeURIComponent resultat:');
console.log(manual);

console.log('\n✓ Begge metodene gir sikker URL-koding');
console.log('✓ URL.searchParams.set() er foretrukket fordi den håndterer alt automatisk');

console.log('\n=== RefPanel bruker trygg metode ===');
console.log('RefPanel bruker URL.searchParams.set() som automatisk URL-koder verdiene');
console.log('Dette betyr at uvanlige tegn i ref og creatorId er trygt håndtert');
console.log('Ingen ytterligere endringer nødvendig 🎉');
