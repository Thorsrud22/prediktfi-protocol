// Test script to demonstrate market filtering and sorting functionality
const { markets } = require('./app/lib/markets');
const { timeUntil, lamportsToSol } = require('./app/lib/market-helpers');

console.log('=== Market Cards and Filtering Test ===\n');

console.log(`Total markets available: ${markets.length}\n`);

// Test category filtering
const categories = ["All", "KOL", "Expert", "Sports", "Crypto", "Culture", "Predikt"];

categories.forEach(category => {
  const filtered = category === "All" 
    ? markets.filter(m => m.isActive)
    : markets.filter(m => m.isActive && m.category === category);
  
  console.log(`${category}: ${filtered.length} markets`);
  
  if (filtered.length > 0) {
    filtered.forEach(market => {
      console.log(`  - ${market.title} (${market.creatorName})`);
    });
  }
  console.log();
});

// Test search functionality
const searchTerms = ["Bitcoin", "SOL", "Premier", "Taylor"];

console.log('=== Search Test ===');
searchTerms.forEach(term => {
  const results = markets.filter(market => 
    market.isActive && (
      market.title.toLowerCase().includes(term.toLowerCase()) ||
      market.description.toLowerCase().includes(term.toLowerCase())
    )
  );
  
  console.log(`Search "${term}": ${results.length} results`);
  results.forEach(market => {
    console.log(`  - ${market.title}`);
  });
  console.log();
});

// Test sorting
console.log('=== Sorting Test ===');

// Sort by ending soon
const sortedByTime = [...markets]
  .filter(m => m.isActive)
  .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

console.log('Sorted by ending soon:');
sortedByTime.forEach((market, i) => {
  console.log(`${i + 1}. ${market.title} - Ends: ${market.endDate}`);
});
console.log();

// Sort by most volume
const sortedByVolume = [...markets]
  .filter(m => m.isActive)
  .sort((a, b) => b.totalVolume - a.totalVolume);

console.log('Sorted by most volume:');
sortedByVolume.forEach((market, i) => {
  console.log(`${i + 1}. ${market.title} - Volume: ${market.totalVolume.toLocaleString()} SOL`);
});
console.log();

// Test helper functions
console.log('=== Helper Functions Test ===');
const testMarket = markets[0];

console.log(`Market: ${testMarket.title}`);
console.log(`End date: ${testMarket.endDate}`);
console.log(`Time until: ${timeUntil(testMarket.endDate)}`);
console.log(`Pool lamports: ${testMarket.poolLamports.toLocaleString()}`);
console.log(`Pool SOL: ${lamportsToSol(testMarket.poolLamports)} SOL`);
console.log(`Participants: ${testMarket.participants}`);
console.log(`Creator: ${testMarket.creatorName} (${testMarket.creatorType})`);
console.log(`Category: ${testMarket.category}`);

console.log('\n=== Manual Testing Instructions ===');
console.log('1. Visit http://localhost:3000/markets');
console.log('2. Wait for skeleton loading to complete (800ms)');
console.log('3. Verify 8 market cards are displayed in grid layout');
console.log('4. Test category filtering:');
console.log('   - Click "Crypto" - should show 1 market (SOL)');
console.log('   - Click "Sports" - should show 2 markets (Premier League, Super Bowl)');
console.log('   - Click "Expert" - should show 3 markets');
console.log('5. Test search:');
console.log('   - Search "Bitcoin" - should show 1 result');
console.log('   - Search "Taylor" - should show 1 result');
console.log('   - Search "xyz" - should show empty state');
console.log('6. Test sorting:');
console.log('   - "Ending soon" - Super Bowl should be first (Feb 2025)');
console.log('   - "Most volume" - Bitcoin ETF should be first (22,100 SOL)');
console.log('7. Click any card - should navigate to market detail page');
console.log('8. Test empty state by searching for non-existent term');
