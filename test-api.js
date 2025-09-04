// Simple Node.js test for the /api/bets endpoint
// Run with: node test-api.js (make sure server is running on port 3000)

const http = require('http');

function makeRequest(path, expectedStatus, testName) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`\n${testName}:`);
        console.log(`Status: ${res.statusCode} (expected: ${expectedStatus})`);
        console.log(`Response: ${data}`);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (e) => {
      console.log(`\n${testName}:`);
      console.log(`Error: ${e.message}`);
      resolve({ error: e.message });
    });

    req.end();
  });
}

async function testRateLimit() {
  console.log('\n=== Rate Limiting Test ===');
  // Use a valid signature format that doesn't exist 
  const testSig = '5uH7Nme4dXrJcKqX9vGTJ8ZWKjFhGqL2pQ1N6bR7sV9M3fA4CgT2kD8HxE1yP7LwU6vR9jN3bF5qG8tK4eL2mS';
  
  console.log('Making 6 rapid requests with same signature...');
  console.log(`Signature: ${testSig}`);
  
  for (let i = 1; i <= 6; i++) {
    const result = await makeRequest(`/api/bets?sig=${testSig}`, i < 6 ? 422 : 429, `Rate limit test ${i}/6`);
    
    if (i < 6) {
      // Expect 422 VERIFY_FAIL for first 5 calls
      if (result.status !== 422) {
        console.log(`⚠️  Expected 422 but got ${result.status} on request ${i}`);
      }
    } else {
      // Expect 429 RATE_LIMITED on 6th call
      if (result.status === 429) {
        console.log(`✅ Rate limiting triggered correctly on request ${i}`);
      } else {
        console.log(`⚠️  Expected 429 but got ${result.status} on request ${i}`);
      }
    }
    
    // Small delay but stay within 10 second window
    if (i < 6) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

async function runTests() {
  console.log('Testing /api/bets endpoint...');
  
  // Test 1: Missing sig parameter (400)
  await makeRequest('/api/bets', 400, 'Test 1: Missing sig parameter');
  
  // Test 2: Invalid signature (422)
  await makeRequest('/api/bets?sig=invalid', 422, 'Test 2: Invalid signature');
  
  // Test 3: Non-existent transaction (422)
  await makeRequest('/api/bets?sig=5VfYmTaNjtVL7t6VVWJFrMCU4qZsZ3mJUdBQJJ8KuZXEeE2XjZKJKjKjKjKjKjKjKjKj', 422, 'Test 3: Non-existent transaction');
  
  // Test 4: Rate limiting
  await testRateLimit();
  
  console.log('\n=== Tests completed ===');
  console.log('Expected behavior:');
  console.log('- 400 for missing sig parameter');
  console.log('- 422 for invalid or non-existent signatures');
  console.log('- 429 on 6th call within 10 seconds for same IP+signature');
}

runTests().catch(console.error);
