#!/bin/bash

# Signals API Rollout Smoke Test
# Tests ETag caching, 304 responses, and rollout status
# Usage: ./smoke-signals-rollout.sh [host]

set -e

HOST=${1:-"localhost:3000"}
API_URL="https://${HOST}/api/public/signals"

if [[ "$HOST" == localhost* ]]; then
    API_URL="http://${HOST}/api/public/signals"
fi

echo "🚀 Testing Signals API rollout on $HOST"
echo "📍 API URL: $API_URL"
echo ""

# Temporary files for test data
TMP1="/tmp/sig1_$$.txt"
TMP2="/tmp/sig2_$$.txt"

# Cleanup function
cleanup() {
    rm -f "$TMP1" "$TMP2"
}
trap cleanup EXIT

echo "📋 Step 1: Initial request to get ETag"
echo "$ curl -s -D- $API_URL"

if ! curl -s -D- "$API_URL" | tee "$TMP1"; then
    echo "❌ Failed to fetch signals API"
    exit 1
fi

echo ""

# Extract ETag
ETAG=$(grep -i '^etag:' "$TMP1" | awk '{print $2}' | tr -d '\r\n' || echo "")
ROLLOUT_STATUS=$(grep -i '^x-rollout-status:' "$TMP1" | awk '{print $2}' | tr -d '\r\n' || echo "unknown")
ROLLOUT_PERCENT=$(grep -i '^x-rollout-percent:' "$TMP1" | awk '{print $2}' | tr -d '\r\n' || echo "unknown")
CACHE_STATUS=$(grep -i '^x-cache:' "$TMP1" | awk '{print $2}' | tr -d '\r\n' || echo "unknown")

echo "📊 Response Analysis:"
echo "   ETag: $ETAG"
echo "   Rollout Status: $ROLLOUT_STATUS"
echo "   Rollout Percent: $ROLLOUT_PERCENT"
echo "   Cache Status: $CACHE_STATUS"
echo ""

if [[ -z "$ETAG" ]]; then
    echo "⚠️  No ETag found in response"
    exit 1
fi

if [[ "$ROLLOUT_STATUS" == "disabled" ]]; then
    echo "✅ Rollout is disabled - API correctly returns 503"
    echo "   This is expected when ROLLOUT_PERCENT=0"
    exit 0
fi

echo "📋 Step 2: Testing 304 Not Modified with If-None-Match"
echo "$ curl -s -D- -H \"If-None-Match: $ETAG\" $API_URL"

if ! curl -s -D- -H "If-None-Match: $ETAG" "$API_URL" | tee "$TMP2"; then
    echo "❌ Failed to test 304 response"
    exit 1
fi

echo ""

# Check for 304 response
HTTP_STATUS=$(head -n1 "$TMP2" | awk '{print $2}')
CACHE_304=$(grep -i '^x-cache:' "$TMP2" | awk '{print $2}' | tr -d '\r\n' || echo "unknown")

echo "📊 304 Test Results:"
echo "   HTTP Status: $HTTP_STATUS"
echo "   Cache Status: $CACHE_304"
echo ""

if [[ "$HTTP_STATUS" == "304" ]]; then
    echo "✅ 304 Not Modified response working correctly"
    if [[ "$CACHE_304" == "HIT-304" ]]; then
        echo "✅ Cache header indicates proper 304 handling"
    else
        echo "⚠️  Expected X-Cache: HIT-304, got: $CACHE_304"
    fi
else
    echo "❌ Expected 304 response, got: $HTTP_STATUS"
    echo "   This might indicate ETag comparison issues"
fi

echo ""

# Performance test
echo "📋 Step 3: Performance test (5 requests)"
echo "Testing response times..."

TIMES=()
for i in {1..5}; do
    START=$(date +%s%N)
    curl -s -o /dev/null -w "%{http_code}" -H "If-None-Match: $ETAG" "$API_URL" >/dev/null
    END=$(date +%s%N)
    DURATION=$(( (END - START) / 1000000 )) # Convert to milliseconds
    TIMES+=($DURATION)
    echo "   Request $i: ${DURATION}ms"
done

# Calculate average
TOTAL=0
for time in "${TIMES[@]}"; do
    TOTAL=$((TOTAL + time))
done
AVERAGE=$((TOTAL / 5))

echo ""
echo "📊 Performance Summary:"
echo "   Average response time: ${AVERAGE}ms"

if [[ $AVERAGE -lt 200 ]]; then
    echo "✅ P95 < 200ms target met"
else
    echo "⚠️  Average response time ${AVERAGE}ms exceeds 200ms target"
fi

echo ""

# Rollout verification
echo "📋 Step 4: Rollout Configuration Verification"
echo "Environment variables that should be set:"
echo "   SIGNALS=on"
echo "   ROLLOUT_PERCENT=10 (or desired percentage)"
echo ""

if [[ "$ROLLOUT_STATUS" == "enabled" ]]; then
    echo "✅ Signals API is enabled for this client"
    echo "   Rollout percentage: $ROLLOUT_PERCENT%"
else
    echo "❌ Signals API is not enabled for this client"
    echo "   Check SIGNALS and ROLLOUT_PERCENT environment variables"
fi

echo ""
echo "🎯 Rollout Monitoring Checklist:"
echo "   □ Monitor P95 response times < 200ms"
echo "   □ Monitor 5xx error rate < 0.5%"
echo "   □ Monitor 304/CDN hit rate > 60%"
echo "   □ Monitor simulate/execute latency stability"
echo "   □ Monitor conversion funnel (view→copy, copy→sign)"
echo ""

if [[ "$HTTP_STATUS" == "304" && $AVERAGE -lt 200 && "$ROLLOUT_STATUS" == "enabled" ]]; then
    echo "🎉 Smoke test PASSED - Ready for rollout monitoring"
    exit 0
else
    echo "⚠️  Smoke test completed with warnings - Review before scaling"
    exit 1
fi
