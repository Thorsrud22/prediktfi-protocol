#!/bin/bash

# E8 Smoke Test - Verify E8 stable deployment
# Tests redirects and core E8 functionality

set -e

echo "🧪 E8 Smoke Test - Verifying stable deployment"
echo "============================================="

# Base URL (use localhost for dev, production URL for prod)
BASE_URL=${1:-"http://localhost:3000"}
echo "Testing against: $BASE_URL"

# Test 1: Status endpoint returns correct data
echo
echo "1️⃣ Testing status endpoint..."
STATUS_RESPONSE=$(curl -s "$BASE_URL/api/status" || echo "FAILED")
if echo "$STATUS_RESPONSE" | grep -q '"status":"healthy"'; then
  echo "✅ Status endpoint healthy"
  if echo "$STATUS_RESPONSE" | grep -q '"environment"'; then
    ENVIRONMENT=$(echo "$STATUS_RESPONSE" | grep -o '"environment":"[^"]*"' | cut -d'"' -f4)
    echo "📍 Environment: $ENVIRONMENT"
  fi
  if echo "$STATUS_RESPONSE" | grep -q '"commitSha"'; then
    COMMIT_SHA=$(echo "$STATUS_RESPONSE" | grep -o '"commitSha":"[^"]*"' | cut -d'"' -f4)
    echo "📍 Commit SHA: $COMMIT_SHA"
  fi
else
  echo "❌ Status endpoint failed"
  echo "Response: $STATUS_RESPONSE"
  exit 1
fi

# Test 2: Analysis endpoint returns 501 (not implemented yet)
echo
echo "2️⃣ Testing analysis endpoint..."
ANALYSIS_RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/api/analysis" -o /dev/null || echo "FAILED")
if [ "$ANALYSIS_RESPONSE" = "501" ]; then
  echo "✅ Analysis endpoint returns 501 (expected for E8 stub)"
else
  echo "❌ Analysis endpoint returned: $ANALYSIS_RESPONSE (expected 501)"
  exit 1
fi

# Test 3: Studio page loads
echo
echo "3️⃣ Testing studio page..."
STUDIO_RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/studio" -o /dev/null || echo "FAILED")
if [ "$STUDIO_RESPONSE" = "200" ]; then
  echo "✅ Studio page loads successfully"
else
  echo "❌ Studio page failed: $STUDIO_RESPONSE"
  exit 1
fi

# Test 4: Redirect from old paths to studio
echo
echo "4️⃣ Testing redirects from old paths..."
OLD_PATHS=("/trade" "/paper" "/markets" "/betting" "/predict")

for path in "${OLD_PATHS[@]}"; do
  REDIRECT_RESPONSE=$(curl -s -w "%{http_code}:%{redirect_url}" "$BASE_URL$path" -o /dev/null || echo "FAILED")
  HTTP_CODE=$(echo "$REDIRECT_RESPONSE" | cut -d':' -f1)
  REDIRECT_URL=$(echo "$REDIRECT_RESPONSE" | cut -d':' -f2-)
  
  if [[ "$HTTP_CODE" =~ ^30[1-8]$ ]] && echo "$REDIRECT_URL" | grep -q "/studio"; then
    echo "✅ $path redirects to studio"
  else
    echo "❌ $path redirect failed - Code: $HTTP_CODE, URL: $REDIRECT_URL"
    exit 1
  fi
done

# Test 5: Home page loads and mentions studio
echo
echo "5️⃣ Testing home page content..."
HOME_CONTENT=$(curl -s "$BASE_URL/" || echo "FAILED")
if echo "$HOME_CONTENT" | grep -qi "studio\|freemium\|prediction"; then
  echo "✅ Home page contains E8 studio content"
else
  echo "❌ Home page missing E8 content"
  exit 1
fi

echo
echo "🎉 All E8 smoke tests passed!"
echo "✅ Status endpoint working"
echo "✅ Analysis endpoint returns expected 501"  
echo "✅ Studio page loads"
echo "✅ Old paths redirect to studio"
echo "✅ Home page has E8 content"
echo
echo "Deployment verified as E8 stable! 🚀"
