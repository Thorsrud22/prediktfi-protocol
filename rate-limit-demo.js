// Quick demonstration of the rate limiting behavior
// This shows how the rate limiting logic works without needing a server

// Simulate the rate limiting logic from the API
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 10 * 1000; // 10 seconds
const RATE_LIMIT_MAX = 5; // 5 calls per window

function getRateLimitKey(ip, signature) {
  return `${ip}:${signature}`;
}

function isRateLimited(key) {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  record.count++;
  return false;
}

// Test simulation
console.log("Rate Limiting Simulation");
console.log("========================");

const testIP = "127.0.0.1";
const testSig = "5uH7Nme4dXrJcKqX9vGTJ8ZWKjFhGqL2pQ1N6bR7sV9M3fA4CgT2kD8HxE1yP7LwU6vR9jN3bF5qG8tK4eL2mS";
const rateLimitKey = getRateLimitKey(testIP, testSig);

console.log(`Testing with IP: ${testIP}`);
console.log(`Testing with signature: ${testSig}`);
console.log(`Rate limit key: ${rateLimitKey}`);
console.log();

for (let i = 1; i <= 6; i++) {
  const isLimited = isRateLimited(rateLimitKey);
  
  if (isLimited) {
    console.log(`Call ${i}: 🛑 RATE LIMITED (429) - Hit limit at call ${i}`);
  } else {
    console.log(`Call ${i}: ✅ ALLOWED - Would return 422 VERIFY_FAIL (tx not found)`);
  }
  
  // Show current state
  const record = rateLimitStore.get(rateLimitKey);
  console.log(`  State: count=${record.count}, resetTime in ${Math.round((record.resetTime - Date.now())/1000)}s`);
  console.log();
}

console.log("Expected behavior:");
console.log("- Calls 1-5: Allowed (would get 422 for non-existent signature)");
console.log("- Call 6: Rate limited (429 RATE_LIMITED)");
console.log();
console.log("✅ MEMO_PROGRAM_ID verification:");
const { MEMO_PROGRAM_ID } = require('@solana/spl-memo');
console.log(`Package value: ${MEMO_PROGRAM_ID.toString()}`);
console.log(`Expected: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`);
console.log(`Match: ${MEMO_PROGRAM_ID.toString() === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr' ? '✅' : '❌'}`);
