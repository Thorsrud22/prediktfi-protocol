#!/bin/bash

# Test script for /api/bets GET endpoint
# Start the server first: npm run dev

BASE_URL="http://localhost:3000"
API_ENDPOINT="$BASE_URL/api/bets"

echo "=== Testing /api/bets GET endpoint ==="
echo

# Test 1: Missing sig parameter (should return 400)
echo "Test 1: Missing sig parameter (400 BAD_REQUEST)"
curl -s -w "\nHTTP Status: %{http_code}\n" "$API_ENDPOINT"
echo

# Test 2: Invalid signature format (should return 422)  
echo "Test 2: Invalid signature (422 VERIFY_FAIL)"
curl -s -w "\nHTTP Status: %{http_code}\n" "$API_ENDPOINT?sig=invalid"
echo

# Test 3: Valid signature format but non-existent transaction (should return 422)
echo "Test 3: Non-existent transaction (422 VERIFY_FAIL)"
curl -s -w "\nHTTP Status: %{http_code}\n" "$API_ENDPOINT?sig=3z9vL1zjN4N4bKqJ1aXrJQVSaKF3X8Z2qBgQwFQFfQfH4N5t2G1QAB6KjQvK9wK7qX8vL1zL3X4X5Z6Y7A8B9C"
echo

# Test 4: Rate limiting (call same signature 6 times in 10 seconds to trigger 429)
echo "Test 4: Rate limiting with valid-format signature (429 RATE_LIMITED on 6th call)"
# Use a realistic devnet signature format that won't exist but will pass validation
TEST_SIG="5uH7Nme4dXrJcKqX9vGTJ8ZWKjFhGqL2pQ1N6bR7sV9M3fA4CgT2kD8HxE1yP7LwU6vR9jN3bF5qG8tK4eL2mS"
echo "Using signature: $TEST_SIG"
echo "Expected: First 5 calls return 422 VERIFY_FAIL, 6th call returns 429 RATE_LIMITED"
echo

for i in {1..6}; do
  echo "Request $i:"
  RESPONSE=$(curl -s "$API_ENDPOINT?sig=$TEST_SIG")
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_ENDPOINT?sig=$TEST_SIG")
  echo "Response: $RESPONSE"
  echo "HTTP Status: $STATUS"
  echo
  
  # Small delay to stay within 10 second window
  if [ $i -lt 6 ]; then
    sleep 1
  fi
done

echo "=== Test completed ==="
echo "Expected results:"
echo "- Test 1: 400 BAD_REQUEST (missing sig)"  
echo "- Test 2: 422 VERIFY_FAIL (invalid format)"
echo "- Test 3: 422 VERIFY_FAIL (valid format, non-existent tx)"
echo "- Test 4: First 5 requests: 422 VERIFY_FAIL, 6th request: 429 RATE_LIMITED"
echo
echo "Note: For testing with a recent valid signature, replace TEST_SIG with"
echo "a confirmed transaction signature from Solana Explorer."
