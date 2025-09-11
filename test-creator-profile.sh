#!/bin/bash

# Creator Profile API Test Script
# Tests the creator profile endpoints for basic functionality

echo "🧪 Testing Creator Profile API Endpoints"
echo "========================================"

# Base URL
BASE_URL="http://localhost:3000"

# Test creator ID (you'll need to replace this with an actual creator ID from your database)
CREATOR_ID="test-creator-123"

echo ""
echo "1. Testing Creator Score Endpoint"
echo "--------------------------------"
echo "GET $BASE_URL/api/public/creators/$CREATOR_ID/score"

SCORE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}" "$BASE_URL/api/public/creators/$CREATOR_ID/score")
SCORE_HTTP_STATUS=$(echo "$SCORE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
SCORE_TIME=$(echo "$SCORE_RESPONSE" | grep "TIME:" | cut -d: -f2)

if [ "$SCORE_HTTP_STATUS" = "200" ]; then
    echo "✅ Score endpoint: SUCCESS (${SCORE_TIME}s)"
    echo "$SCORE_RESPONSE" | head -n -2 | jq '.' 2>/dev/null || echo "$SCORE_RESPONSE" | head -n -2
elif [ "$SCORE_HTTP_STATUS" = "404" ]; then
    echo "⚠️  Score endpoint: Creator not found (expected in test environment)"
else
    echo "❌ Score endpoint: FAILED (HTTP $SCORE_HTTP_STATUS)"
fi

echo ""
echo "2. Testing Creator History Endpoint"
echo "----------------------------------"
echo "GET $BASE_URL/api/public/creators/$CREATOR_ID/history?period=90d"

HISTORY_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}" "$BASE_URL/api/public/creators/$CREATOR_ID/history?period=90d")
HISTORY_HTTP_STATUS=$(echo "$HISTORY_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
HISTORY_TIME=$(echo "$HISTORY_RESPONSE" | grep "TIME:" | cut -d: -f2)

if [ "$HISTORY_HTTP_STATUS" = "200" ]; then
    echo "✅ History endpoint: SUCCESS (${HISTORY_TIME}s)"
    echo "$HISTORY_RESPONSE" | head -n -2 | jq '.' 2>/dev/null || echo "$HISTORY_RESPONSE" | head -n -2
elif [ "$HISTORY_HTTP_STATUS" = "404" ]; then
    echo "⚠️  History endpoint: Creator not found (expected in test environment)"
else
    echo "❌ History endpoint: FAILED (HTTP $HISTORY_HTTP_STATUS)"
fi

echo ""
echo "3. Testing ETag Caching"
echo "----------------------"

# First request to get ETag
FIRST_RESPONSE=$(curl -s -I "$BASE_URL/api/public/creators/$CREATOR_ID/history?period=90d")
ETAG=$(echo "$FIRST_RESPONSE" | grep -i "etag:" | cut -d: -f2 | tr -d ' \r\n')

if [ -n "$ETAG" ]; then
    echo "ETag received: $ETAG"
    
    # Second request with If-None-Match
    CACHE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -H "If-None-Match: $ETAG" "$BASE_URL/api/public/creators/$CREATOR_ID/history?period=90d")
    CACHE_HTTP_STATUS=$(echo "$CACHE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    
    if [ "$CACHE_HTTP_STATUS" = "304" ]; then
        echo "✅ ETag caching: SUCCESS (304 Not Modified)"
    else
        echo "⚠️  ETag caching: Not working (HTTP $CACHE_HTTP_STATUS)"
    fi
else
    echo "⚠️  ETag caching: No ETag received"
fi

echo ""
echo "4. Testing Creator Profile Page"
echo "------------------------------"
echo "GET $BASE_URL/creator/$CREATOR_ID"

PAGE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}" "$BASE_URL/creator/$CREATOR_ID")
PAGE_HTTP_STATUS=$(echo "$PAGE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
PAGE_TIME=$(echo "$PAGE_RESPONSE" | grep "TIME:" | cut -d: -f2)

if [ "$PAGE_HTTP_STATUS" = "200" ]; then
    echo "✅ Creator profile page: SUCCESS (${PAGE_TIME}s)"
    # Check if page contains expected elements
    if echo "$PAGE_RESPONSE" | grep -q "Creator Profile"; then
        echo "✅ Page contains expected content"
    else
        echo "⚠️  Page content may be incomplete"
    fi
elif [ "$PAGE_HTTP_STATUS" = "404" ]; then
    echo "⚠️  Creator profile page: Creator not found (expected in test environment)"
else
    echo "❌ Creator profile page: FAILED (HTTP $PAGE_HTTP_STATUS)"
fi

echo ""
echo "5. Performance Summary"
echo "--------------------"
echo "Score endpoint: ${SCORE_TIME}s"
echo "History endpoint: ${HISTORY_TIME}s"
echo "Profile page: ${PAGE_TIME}s"

# Check if performance meets requirements
SCORE_TIME_MS=$(echo "$SCORE_TIME * 1000" | bc 2>/dev/null || echo "0")
HISTORY_TIME_MS=$(echo "$HISTORY_TIME * 1000" | bc 2>/dev/null || echo "0")

if [ "$HISTORY_TIME_MS" -lt 300 ] 2>/dev/null; then
    echo "✅ History endpoint meets P95 < 300ms requirement"
else
    echo "⚠️  History endpoint may not meet P95 < 300ms requirement"
fi

echo ""
echo "🎉 Creator Profile API testing complete!"
echo ""
echo "To test with real data:"
echo "1. Start your development server: npm run dev"
echo "2. Replace CREATOR_ID in this script with an actual creator ID from your database"
echo "3. Run this script again"
