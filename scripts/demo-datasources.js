#!/usr/bin/env node
// Quick demo script for manual QA of datasources

import { fetchMarketChart } from '../src/lib/data/price.js';
import { fetchFng } from '../src/lib/sentiment/fearGreed.js';

async function demo() {
  console.log('🚀 Testing datasources...\n');
  
  try {
    // Test price data
    console.log('📈 Fetching Bitcoin price data...');
    const start1 = Date.now();
    const priceData = await fetchMarketChart('bitcoin', 'usd', 1);
    const duration1 = Date.now() - start1;
    
    console.log(`✓ Price data fetched in ${duration1}ms`);
    console.log(`  Quality: ${priceData.quality}`);
    console.log(`  Candles: ${priceData.candles.length}`);
    console.log(`  Latest price: $${priceData.candles[priceData.candles.length - 1]?.c}\n`);
    
    // Test cache hit
    console.log('⚡ Testing cache (same request)...');
    const start2 = Date.now();
    await fetchMarketChart('bitcoin', 'usd', 1);
    const duration2 = Date.now() - start2;
    console.log(`✓ Cached fetch completed in ${duration2}ms (should be much faster)\n`);
    
    // Test FNG data
    console.log('😰 Fetching Fear & Greed Index...');
    const start3 = Date.now();
    const fngData = await fetchFng();
    const duration3 = Date.now() - start3;
    
    console.log(`✓ FNG data fetched in ${duration3}ms`);
    console.log(`  Current FNG: ${fngData.fngNow}`);
    console.log(`  Previous FNG: ${fngData.fngPrev}`);
    console.log(`  Regime: ${fngData.regime}`);
    console.log(`  Quality: ${fngData.quality}\n`);
    
    // Test FNG cache hit
    console.log('⚡ Testing FNG cache...');
    const start4 = Date.now();
    await fetchFng();
    const duration4 = Date.now() - start4;
    console.log(`✓ Cached FNG fetch completed in ${duration4}ms (should be much faster)\n`);
    
    console.log('🎉 All datasource tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during demo:', error.message);
    process.exit(1);
  }
}

demo();
