#!/bin/bash

# Test script for ETag verification on history/insights endpoints
# Usage: ./scripts/test-etag.sh [base_url] [creator_handle]

BASE_URL=${1:-"http://localhost:3000"}
CREATOR_HANDLE=${2:-"bob_analyst"}

echo "🧪 Testing ETag verification for creator endpoints"
echo "Base URL: $BASE_URL"
echo "Creator Handle: $CREATOR_HANDLE"
echo ""

# Test history endpoint
echo "📊 Testing /api/public/creators/$CREATOR_HANDLE/history"
echo "----------------------------------------"

# First request - get ETag
echo "1. First request (should return 200 with ETag):"
RESPONSE1=$(curl -s -I "$BASE_URL/api/public/creators/$CREATOR_HANDLE/history")
echo "$RESPONSE1"
echo ""

# Extract ETag
ETAG=$(echo "$RESPONSE1" | grep -i "etag:" | cut -d' ' -f2 | tr -d '\r\n')
if [ -z "$ETAG" ]; then
    echo "❌ No ETag found in first response"
    exit 1
fi

echo "ETag extracted: $ETAG"
echo ""

# Second request with If-None-Match
echo "2. Second request with If-None-Match (should return 304):"
RESPONSE2=$(curl -s -I -H "If-None-Match: $ETAG" "$BASE_URL/api/public/creators/$CREATOR_HANDLE/history")
echo "$RESPONSE2"
echo ""

# Check if 304 Not Modified
if echo "$RESPONSE2" | grep -q "304 Not Modified"; then
    echo "✅ ETag verification successful - returned 304 Not Modified"
else
    echo "❌ ETag verification failed - did not return 304 Not Modified"
    echo "Expected: 304 Not Modified"
    echo "Actual: $(echo "$RESPONSE2" | head -n1)"
fi

echo ""

# Test insights endpoint
echo "📝 Testing /api/public/creators/$CREATOR_HANDLE/insights"
echo "----------------------------------------"

# First request - get ETag
echo "1. First request (should return 200 with ETag):"
RESPONSE3=$(curl -s -I "$BASE_URL/api/public/creators/$CREATOR_HANDLE/insights")
echo "$RESPONSE3"
echo ""

# Extract ETag
ETAG2=$(echo "$RESPONSE3" | grep -i "etag:" | cut -d' ' -f2 | tr -d '\r\n')
if [ -z "$ETAG2" ]; then
    echo "❌ No ETag found in insights response"
    exit 1
fi

echo "ETag extracted: $ETAG2"
echo ""

# Second request with If-None-Match
echo "2. Second request with If-None-Match (should return 304):"
RESPONSE4=$(curl -s -I -H "If-None-Match: $ETAG2" "$BASE_URL/api/public/creators/$CREATOR_HANDLE/insights")
echo "$RESPONSE4"
echo ""

# Check if 304 Not Modified
if echo "$RESPONSE4" | grep -q "304 Not Modified"; then
    echo "✅ ETag verification successful - returned 304 Not Modified"
else
    echo "❌ ETag verification failed - did not return 304 Not Modified"
    echo "Expected: 304 Not Modified"
    echo "Actual: $(echo "$RESPONSE4" | head -n1)"
fi

echo ""

# Test Cache-Control headers
echo "🔍 Testing Cache-Control headers"
echo "----------------------------------------"

echo "History endpoint Cache-Control:"
echo "$RESPONSE1" | grep -i "cache-control" || echo "No Cache-Control header found"
echo ""

echo "Insights endpoint Cache-Control:"
echo "$RESPONSE3" | grep -i "cache-control" || echo "No Cache-Control header found"
echo ""

echo "🎉 ETag verification test completed!"
