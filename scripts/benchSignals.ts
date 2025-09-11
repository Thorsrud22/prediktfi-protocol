/**
 * Local benchmark script for signals API
 * Measures P95, 5xx rate, and ETag 304 rate
 */

import { performance } from 'perf_hooks';

interface BenchmarkResult {
  count: number;
  min: number;
  p50: number;
  p95: number;
  max: number;
  successCount: number;
  errorCount: number;
  notModifiedCount: number;
  totalTime: number;
}

async function makeRequest(url: string, etag?: string): Promise<{
  status: number;
  time: number;
  etag?: string;
  xCache?: string;
}> {
  const start = performance.now();
  
  try {
    const headers: HeadersInit = {};
    if (etag) {
      headers['If-None-Match'] = etag;
    }
    
    const response = await fetch(url, { headers });
    const time = performance.now() - start;
    const responseEtag = response.headers.get('ETag');
    const xCache = response.headers.get('X-Cache');
    
    return {
      status: response.status,
      time,
      etag: responseEtag || undefined,
      xCache: xCache || undefined
    };
  } catch (error) {
    const time = performance.now() - start;
    return {
      status: 500,
      time
    };
  }
}

async function runBenchmark(): Promise<void> {
  const baseUrl = process.env.BENCH_SIGNALS_URL || 'http://localhost:3000/api/public/signals';
  const totalRequests = 250;
  const coldRequests = 50;
  const warmRequests = totalRequests - coldRequests;
  
  console.log('🚀 Starting signals API benchmark...');
  console.log(`📊 ${totalRequests} requests (${coldRequests} cold, ${warmRequests} warm)`);
  console.log(`🌐 URL: ${baseUrl}`);
  console.log('');

  const results: Array<{ status: number; time: number; etag?: string; xCache?: string }> = [];
  let etag: string | undefined;

  // Cold requests (first 50)
  console.log('❄️  Cold requests...');
  for (let i = 0; i < coldRequests; i++) {
    const result = await makeRequest(baseUrl);
    results.push(result);
    
    // Capture ETag from first 200 response
    if (result.status === 200 && result.etag && !etag) {
      etag = result.etag;
      console.log(`\n  📌 Captured ETag: ${etag}`);
    }
    
    // Log first few requests for debugging
    if (i < 3) {
      console.log(`  #${i+1} status=${result.status} x-cache=${result.xCache || 'N/A'} dur=${result.time.toFixed(1)}ms`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 5));
    
    if ((i + 1) % 10 === 0) {
      process.stdout.write(`\r  ${i + 1}/${coldRequests} completed`);
    }
  }
  console.log('');

  // Warm requests (remaining 200) - use ETag for If-None-Match
  console.log('🔥 Warm requests...');
  for (let i = 0; i < warmRequests; i++) {
    const result = await makeRequest(baseUrl, etag);
    results.push(result);
    
    // Log first few warm requests for debugging
    if (i < 3) {
      console.log(`  #${i+1} status=${result.status} x-cache=${result.xCache || 'N/A'} dur=${result.time.toFixed(1)}ms`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 5));
    
    if ((i + 1) % 20 === 0) {
      process.stdout.write(`\r  ${i + 1}/${warmRequests} completed`);
    }
  }
  console.log('');

  // Calculate statistics
  const coldResults = results.slice(0, coldRequests);
  const warmResults = results.slice(coldRequests);
  
  const calculateStats = (data: Array<{ status: number; time: number }>): BenchmarkResult => {
    const times = data.map(r => r.time).sort((a, b) => a - b);
    const successCount = data.filter(r => r.status === 200).length;
    const errorCount = data.filter(r => r.status >= 500).length;
    const notModifiedCount = data.filter(r => r.status === 304).length;
    
    return {
      count: data.length,
      min: times[0] || 0,
      p50: times[Math.floor(times.length * 0.5)] || 0,
      p95: times[Math.floor(times.length * 0.95)] || 0,
      max: times[times.length - 1] || 0,
      successCount,
      errorCount,
      notModifiedCount,
      totalTime: times.reduce((sum, time) => sum + time, 0)
    };
  };

  const coldStats = calculateStats(coldResults);
  const warmStats = calculateStats(warmResults);
  const overallStats = calculateStats(results);

  // Display results
  console.log('\n📈 Benchmark Results:');
  console.log('='.repeat(50));
  
  console.log('\n❄️  Cold Requests (first 50):');
  console.log(`  Count: ${coldStats.count}`);
  console.log(`  Min: ${coldStats.min.toFixed(2)}ms`);
  console.log(`  P50: ${coldStats.p50.toFixed(2)}ms`);
  console.log(`  P95: ${coldStats.p95.toFixed(2)}ms`);
  console.log(`  Max: ${coldStats.max.toFixed(2)}ms`);
  console.log(`  Success: ${coldStats.successCount} (${((coldStats.successCount / coldStats.count) * 100).toFixed(1)}%)`);
  console.log(`  Errors: ${coldStats.errorCount} (${((coldStats.errorCount / coldStats.count) * 100).toFixed(1)}%)`);
  console.log(`  Not Modified: ${coldStats.notModifiedCount} (${((coldStats.notModifiedCount / coldStats.count) * 100).toFixed(1)}%)`);

  console.log('\n🔥 Warm Requests (last 200):');
  console.log(`  Count: ${warmStats.count}`);
  console.log(`  Min: ${warmStats.min.toFixed(2)}ms`);
  console.log(`  P50: ${warmStats.p50.toFixed(2)}ms`);
  console.log(`  P95: ${warmStats.p95.toFixed(2)}ms`);
  console.log(`  Max: ${warmStats.max.toFixed(2)}ms`);
  console.log(`  Success: ${warmStats.successCount} (${((warmStats.successCount / warmStats.count) * 100).toFixed(1)}%)`);
  console.log(`  Errors: ${warmStats.errorCount} (${((warmStats.errorCount / warmStats.count) * 100).toFixed(1)}%)`);
  console.log(`  Not Modified: ${warmStats.notModifiedCount} (${((warmStats.notModifiedCount / warmStats.count) * 100).toFixed(1)}%)`);

  console.log('\n📊 Overall Results:');
  console.log(`  Count: ${overallStats.count}`);
  console.log(`  Min: ${overallStats.min.toFixed(2)}ms`);
  console.log(`  P50: ${overallStats.p50.toFixed(2)}ms`);
  console.log(`  P95: ${overallStats.p95.toFixed(2)}ms`);
  console.log(`  Max: ${overallStats.max.toFixed(2)}ms`);
  console.log(`  Success: ${overallStats.successCount} (${((overallStats.successCount / overallStats.count) * 100).toFixed(1)}%)`);
  console.log(`  Errors: ${overallStats.errorCount} (${((overallStats.errorCount / overallStats.count) * 100).toFixed(1)}%)`);
  console.log(`  Not Modified: ${overallStats.notModifiedCount} (${((overallStats.notModifiedCount / overallStats.count) * 100).toFixed(1)}%)`);

  // SLA checks
  console.log('\n🎯 SLA Checks:');
  const p95Pass = overallStats.p95 < 200;
  const errorRatePass = (overallStats.errorCount / overallStats.count) < 0.005; // 0.5%
  const etagRatePass = (overallStats.notModifiedCount / overallStats.count) > 0.6; // 60%
  
  console.log(`  P95 < 200ms: ${p95Pass ? '✅' : '❌'} (${overallStats.p95.toFixed(2)}ms)`);
  console.log(`  5xx < 0.5%: ${errorRatePass ? '✅' : '❌'} (${((overallStats.errorCount / overallStats.count) * 100).toFixed(2)}%)`);
  console.log(`  ETag 304 > 60%: ${etagRatePass ? '✅' : '❌'} (${((overallStats.notModifiedCount / overallStats.count) * 100).toFixed(2)}%)`);

  // Warm round specific checks
  const warmP95Pass = warmStats.p95 < 20; // Much faster for warm requests
  const warmEtagRatePass = (warmStats.notModifiedCount / warmStats.count) > 0.8; // 80% for warm
  
  // Calculate 304-specific stats for warm requests
  const warm304Results = warmResults.filter(r => r.status === 304);
  const warm304Stats = warm304Results.length > 0 ? {
    count: warm304Results.length,
    times: warm304Results.map(r => r.time).sort((a, b) => a - b),
    p95: warm304Results.length > 0 ? warm304Results[Math.floor(warm304Results.length * 0.95)].time : 0
  } : { count: 0, times: [], p95: 0 };
  
  console.log('\n🔥 Warm Round Specific:');
  console.log(`  P95 < 20ms: ${warmP95Pass ? '✅' : '❌'} (${warmStats.p95.toFixed(2)}ms)`);
  console.log(`  ETag 304 > 80%: ${warmEtagRatePass ? '✅' : '❌'} (${((warmStats.notModifiedCount / warmStats.count) * 100).toFixed(2)}%)`);
  
  if (warm304Stats.count > 0) {
    console.log(`  Warm 304 P95: ${warm304Stats.p95.toFixed(2)}ms (${warm304Stats.count} requests)`);
  }

  // Overall result
  const allPass = p95Pass && errorRatePass && etagRatePass && warmP95Pass && warmEtagRatePass;
  console.log(`\n${allPass ? '✅' : '❌'} Overall: ${allPass ? 'PASS' : 'FAIL'}`);

  if (!allPass) {
    console.log('\n❌ Benchmark failed SLA requirements');
    process.exit(1);
  } else {
    console.log('\n✅ Benchmark passed all SLA requirements');
  }
}

// Run benchmark
runBenchmark().catch(error => {
  console.error('❌ Benchmark failed:', error);
  process.exit(1);
});
