#!/usr/bin/env node

/**
 * Performance testing script for page navigation
 * Tests API response times and page load performance
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Test endpoints
const endpoints = [
  { path: '/api/studio/templates', name: 'Studio Templates' },
  { path: '/api/feed?limit=10', name: 'Feed (10 items)' },
  { path: '/api/status', name: 'Status Check' },
];

// Pages to test
const pages = [
  { path: '/', name: 'Home' },
  { path: '/studio', name: 'Studio' },
  { path: '/feed', name: 'Feed' },
  { path: '/account', name: 'Account' },
];

async function measureAPIEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint.path}`;
  const measurements = [];
  const runs = 5;

  console.log(`\nTesting ${colorize(endpoint.name, 'cyan')} (${runs} runs)...`);

  for (let i = 0; i < runs; i++) {
    const start = Date.now();
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      const duration = Date.now() - start;
      const cacheStatus = response.headers.get('x-cache') || 'MISS';
      
      measurements.push({
        duration,
        status: response.status,
        ok: response.ok,
        cache: cacheStatus,
      });

      const statusColor = response.ok ? 'green' : 'red';
      const cacheColor = cacheStatus === 'HIT' ? 'green' : 'yellow';
      
      console.log(
        `  Run ${i + 1}: ${colorize(`${duration}ms`, statusColor)} | ` +
        `Status: ${colorize(response.status, statusColor)} | ` +
        `Cache: ${colorize(cacheStatus, cacheColor)}`
      );
    } catch (error) {
      console.log(
        `  Run ${i + 1}: ${colorize('FAILED', 'red')} - ${error.message}`
      );
      measurements.push({ duration: -1, status: 0, ok: false, error: error.message });
    }

    // Small delay between requests
    if (i < runs - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Calculate stats
  const successfulMeasurements = measurements.filter(m => m.ok);
  
  if (successfulMeasurements.length === 0) {
    console.log(colorize('  All requests failed!', 'red'));
    return null;
  }

  const durations = successfulMeasurements.map(m => m.duration);
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const min = Math.min(...durations);
  const max = Math.max(...durations);
  const cacheHits = measurements.filter(m => m.cache === 'HIT').length;

  console.log(colorize('\n  Summary:', 'blue'));
  console.log(`    Average: ${colorize(`${avg.toFixed(0)}ms`, avg < 200 ? 'green' : avg < 500 ? 'yellow' : 'red')}`);
  console.log(`    Min: ${colorize(`${min}ms`, 'green')}`);
  console.log(`    Max: ${colorize(`${max}ms`, max < 300 ? 'green' : max < 600 ? 'yellow' : 'red')}`);
  console.log(`    Cache hits: ${colorize(`${cacheHits}/${runs}`, cacheHits > runs / 2 ? 'green' : 'yellow')}`);
  console.log(`    Success rate: ${colorize(`${successfulMeasurements.length}/${runs}`, successfulMeasurements.length === runs ? 'green' : 'yellow')}`);

  return { avg, min, max, cacheHits, successRate: successfulMeasurements.length / runs };
}

async function measurePageLoad(page) {
  const url = `${BASE_URL}${page.path}`;
  const start = Date.now();

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html',
      },
    });

    const duration = Date.now() - start;
    const html = await response.text();
    const size = Buffer.byteLength(html, 'utf8');

    return {
      duration,
      status: response.status,
      ok: response.ok,
      size,
    };
  } catch (error) {
    return {
      duration: -1,
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

async function testPages() {
  console.log(colorize('\n\n📄 Testing Page Load Times', 'blue'));
  console.log('='.repeat(60));

  const results = [];

  for (const page of pages) {
    console.log(`\nTesting ${colorize(page.name, 'cyan')} (${page.path})...`);
    
    const result = await measurePageLoad(page);
    results.push({ ...result, name: page.name });

    if (result.ok) {
      const durationColor = result.duration < 500 ? 'green' : result.duration < 1000 ? 'yellow' : 'red';
      console.log(`  Load time: ${colorize(`${result.duration}ms`, durationColor)}`);
      console.log(`  Size: ${colorize(`${(result.size / 1024).toFixed(1)}KB`, 'cyan')}`);
    } else {
      console.log(colorize(`  Failed: ${result.error || 'Unknown error'}`, 'red'));
    }

    // Delay between page tests
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}

async function testCacheEffectiveness() {
  console.log(colorize('\n\n🔄 Testing Cache Effectiveness', 'blue'));
  console.log('='.repeat(60));

  const testEndpoint = '/api/studio/templates';
  const url = `${BASE_URL}${testEndpoint}`;

  console.log(`\nMaking 3 sequential requests to ${testEndpoint}...`);

  const results = [];

  for (let i = 0; i < 3; i++) {
    const start = Date.now();
    const response = await fetch(url);
    const duration = Date.now() - start;
    const cache = response.headers.get('x-cache') || 'MISS';

    results.push({ duration, cache, run: i + 1 });

    const cacheColor = cache === 'HIT' ? 'green' : 'yellow';
    console.log(
      `  Request ${i + 1}: ${colorize(`${duration}ms`, duration < 100 ? 'green' : 'yellow')} | ` +
      `Cache: ${colorize(cache, cacheColor)}`
    );

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Check if caching is working
  const cacheHits = results.filter(r => r.cache === 'HIT').length;
  
  if (cacheHits > 0) {
    console.log(colorize('\n  ✅ Caching is working!', 'green'));
  } else {
    console.log(colorize('\n  ⚠️  No cache hits detected - caching may not be working', 'yellow'));
  }

  return results;
}

async function main() {
  console.log(colorize('\n🚀 PrediktFi Navigation Performance Test', 'blue'));
  console.log(colorize('='.repeat(60), 'blue'));
  console.log(`Testing against: ${colorize(BASE_URL, 'cyan')}\n`);

  // Check if server is running
  try {
    const response = await fetch(`${BASE_URL}/api/status`);
    if (!response.ok) {
      throw new Error('Server health check failed');
    }
    console.log(colorize('✅ Server is running\n', 'green'));
  } catch (error) {
    console.log(colorize('❌ Server is not accessible!', 'red'));
    console.log(colorize(`   Make sure the dev server is running on ${BASE_URL}`, 'yellow'));
    process.exit(1);
  }

  // Test API endpoints
  console.log(colorize('📡 Testing API Endpoints', 'blue'));
  console.log('='.repeat(60));

  const apiResults = [];
  for (const endpoint of endpoints) {
    const result = await measureAPIEndpoint(endpoint);
    if (result) {
      apiResults.push({ name: endpoint.name, ...result });
    }
  }

  // Test page loads
  const pageResults = await testPages();

  // Test cache effectiveness
  const cacheResults = await testCacheEffectiveness();

  // Final summary
  console.log(colorize('\n\n📊 Performance Summary', 'blue'));
  console.log('='.repeat(60));

  console.log(colorize('\nAPI Endpoints:', 'cyan'));
  apiResults.forEach(result => {
    const avgColor = result.avg < 200 ? 'green' : result.avg < 500 ? 'yellow' : 'red';
    console.log(`  ${result.name.padEnd(25)} Avg: ${colorize(`${result.avg.toFixed(0)}ms`, avgColor)}`);
  });

  console.log(colorize('\nPage Load Times:', 'cyan'));
  pageResults.forEach(result => {
    if (result.ok) {
      const color = result.duration < 500 ? 'green' : result.duration < 1000 ? 'yellow' : 'red';
      console.log(`  ${result.name.padEnd(25)} ${colorize(`${result.duration}ms`, color)}`);
    } else {
      console.log(`  ${result.name.padEnd(25)} ${colorize('FAILED', 'red')}`);
    }
  });

  // Performance recommendations
  console.log(colorize('\n\n💡 Recommendations:', 'blue'));
  console.log('='.repeat(60));

  const slowAPIs = apiResults.filter(r => r.avg > 500);
  if (slowAPIs.length > 0) {
    console.log(colorize('\n⚠️  Slow API endpoints detected:', 'yellow'));
    slowAPIs.forEach(api => {
      console.log(`  - ${api.name}: Consider adding caching or optimization`);
    });
  }

  const slowPages = pageResults.filter(r => r.ok && r.duration > 1000);
  if (slowPages.length > 0) {
    console.log(colorize('\n⚠️  Slow page loads detected:', 'yellow'));
    slowPages.forEach(page => {
      console.log(`  - ${page.name}: Consider reducing initial bundle size or lazy loading`);
    });
  }

  if (slowAPIs.length === 0 && slowPages.length === 0) {
    console.log(colorize('\n✅ All endpoints and pages are performing well!', 'green'));
  }

  console.log('\n');
}

main().catch(error => {
  console.error(colorize('\n❌ Test failed:', 'red'), error.message);
  process.exit(1);
});
