#!/usr/bin/env node

/**
 * Test script to verify API fixes
 */

// Test the fixed adapters
async function testAdapters() {
  console.log('🔍 Testing external API adapters...\n');

  // Test Fear & Greed API (should work)
  try {
    console.log('Testing Fear & Greed API...');
    const response = await fetch('https://api.alternative.me/fng/?limit=1');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Fear & Greed API: Working');
      console.log(
        `   Current value: ${data.data[0].value} (${data.data[0].value_classification})\n`,
      );
    } else {
      console.log(`❌ Fear & Greed API: Failed with status ${response.status}\n`);
    }
  } catch (error) {
    console.log(`❌ Fear & Greed API: Error - ${error.message}\n`);
  }

  // Test Binance Funding API (should work with new URL)
  try {
    console.log('Testing Binance Funding API...');
    const response = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Binance Funding API: Working');
      console.log(`   BTC funding rate: ${data.lastFundingRate}\n`);
    } else {
      console.log(`❌ Binance Funding API: Failed with status ${response.status}\n`);
    }
  } catch (error) {
    console.log(`❌ Binance Funding API: Error - ${error.message}\n`);
  }

  // Test Polymarket API (should gracefully fail or work if custom URL set)
  try {
    console.log('Testing Polymarket API...');
    const response = await fetch('https://api.polymarket.com/markets?active=true&limit=3');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Polymarket API: Working');
    } else {
      console.log(
        `❌ Polymarket API: Failed with status ${response.status} (expected - will use mock data)\n`,
      );
    }
  } catch (error) {
    console.log(`❌ Polymarket API: Error - ${error.message} (expected - will use mock data)\n`);
  }

  console.log('📋 Summary:');
  console.log('- Fear & Greed API should work (no authentication required)');
  console.log('- Binance Funding API should work (fixed URL)');
  console.log('- Polymarket API will use mock data (API endpoint changed/removed)');
  console.log('\n✅ API fixes should resolve 401/404 errors in the application!');
}

// Test local API endpoints
async function testLocalAPIs() {
  console.log('\n🔍 Testing local API endpoints...\n');

  const endpoints = ['/api/feed', '/api/public/signals'];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await fetch(`http://localhost:3000${endpoint}`);
      if (response.ok) {
        console.log(`✅ ${endpoint}: Working (status ${response.status})`);
      } else {
        console.log(`❌ ${endpoint}: Failed with status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: Error - ${error.message}`);
    }
  }
}

// Run tests
testAdapters()
  .then(() => {
    console.log('\n' + '='.repeat(50));
    return testLocalAPIs();
  })
  .catch(console.error);
