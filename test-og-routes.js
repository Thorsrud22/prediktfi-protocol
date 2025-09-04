#!/usr/bin/env node

// Quick test script for OG image routes
// Run with: node test-og-routes.js

const http = require('http');

async function testRoute(path, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'HEAD'
    };

    console.log(`Testing ${description}: ${path}`);
    
    const req = http.request(options, (res) => {
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Content-Type: ${res.headers['content-type']}`);
      console.log(`  Cache-Control: ${res.headers['cache-control']}`);
      console.log('');
      resolve(res.statusCode);
    });

    req.on('error', (err) => {
      console.log(`  Error: ${err.message}`);
      console.log('');
      resolve(null);
    });

    req.end();
  });
}

async function runTests() {
  console.log('🔮 Testing OG Image Routes\n');
  
  // Test existing route
  await testRoute('/api/og/insight?sig=test-signature', 'Original OG route (query param)');
  
  // Test new dynamic route
  await testRoute('/api/og/insight/test-signature', 'New dynamic OG route (path param)');
  
  console.log('✅ Tests completed');
}

runTests().catch(console.error);
