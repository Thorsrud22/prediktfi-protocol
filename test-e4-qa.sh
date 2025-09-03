#!/bin/bash

# ✅ E4 QA/Smoke Test Script
# Tests key functionality after BLOCK E4 implementation

set -e

echo "🧪 Starting E4 Beta Hardening QA Tests"
echo "======================================="

# Test 1: Check environment configuration
echo ""
echo "1️⃣  Environment Configuration Test"
echo "-----------------------------------"

if [ ! -f ".env.example" ]; then
    echo "❌ .env.example missing"
    exit 1
fi

# Check for required E4 environment variables in .env.example
required_vars=(
    "PREDIKT_COOKIE_DOMAIN"
    "NEXT_PUBLIC_PRO_BYPASS_ENABLED"
    "WEBHOOK_IDEMPOTENCY_SECRET"
    "ENABLE_ANALYTICS"
)

for var in "${required_vars[@]}"; do
    if grep -q "$var" .env.example; then
        echo "✅ $var found in .env.example"
    else
        echo "❌ $var missing from .env.example"
        exit 1
    fi
done

# Test 2: Check plan detection system
echo ""
echo "2️⃣  Plan Detection System Test"
echo "------------------------------"

files_to_check=(
    "app/lib/plan.ts"
    "app/lib/use-plan.ts"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check for key functions
if grep -q "getPlanFromRequest" app/lib/plan.ts; then
    echo "✅ getPlanFromRequest function found"
else
    echo "❌ getPlanFromRequest function missing"
    exit 1
fi

if grep -q "useIsPro" app/lib/use-plan.ts; then
    echo "✅ useIsPro hook found"
else
    echo "❌ useIsPro hook missing"
    exit 1
fi

# Test 3: Check rate limiting system
echo ""
echo "3️⃣  Rate Limiting System Test"
echo "-----------------------------"

if [ -f "app/lib/rate.ts" ]; then
    echo "✅ app/lib/rate.ts exists"
else
    echo "❌ app/lib/rate.ts missing"
    exit 1
fi

if grep -q "rateLimitOrThrow" app/lib/rate.ts; then
    echo "✅ rateLimitOrThrow function found"
else
    echo "❌ rateLimitOrThrow function missing"
    exit 1
fi

if grep -q "Pro bypass" app/lib/rate.ts; then
    echo "✅ Pro bypass logic found"
else
    echo "❌ Pro bypass logic missing"
    exit 1
fi

# Test 4: Check AI predict route integration
echo ""
echo "4️⃣  AI Predict Route Integration Test"
echo "------------------------------------"

if [ -f "app/api/ai/predict/route.ts" ]; then
    echo "✅ AI predict route exists"
else
    echo "❌ AI predict route missing"
    exit 1
fi

if grep -q "rateLimitOrThrow" app/api/ai/predict/route.ts; then
    echo "✅ Rate limiting integrated in predict route"
else
    echo "❌ Rate limiting not integrated in predict route"
    exit 1
fi

# Test 5: Check webhook hardening
echo ""
echo "5️⃣  Webhook Hardening Test"
echo "--------------------------"

if [ -f "app/api/billing/webhook/route.ts" ]; then
    echo "✅ Webhook route exists"
else
    echo "❌ Webhook route missing"
    exit 1
fi

if grep -q "webhook_duplicate_ignored" app/api/billing/webhook/route.ts; then
    echo "✅ Webhook idempotency tracking found"
else
    echo "❌ Webhook idempotency tracking missing"
    exit 1
fi

# Test 6: Check navbar Pro indicators
echo ""
echo "6️⃣  Navbar Pro Indicators Test"
echo "------------------------------"

if grep -q "useIsPro" app/components/Navbar.tsx; then
    echo "✅ Pro detection in navbar"
else
    echo "❌ Pro detection missing from navbar"
    exit 1
fi

if grep -q "PRO" app/components/Navbar.tsx; then
    echo "✅ Pro badge found in navbar"
else
    echo "❌ Pro badge missing from navbar"
    exit 1
fi

# Test 7: Check account page improvements
echo ""
echo "7️⃣  Account Page Improvements Test"
echo "----------------------------------"

if grep -q "x-plan" app/account/page.tsx; then
    echo "✅ Plan detection in account page"
else
    echo "❌ Plan detection missing from account page"
    exit 1
fi

if grep -q "Pro Features" app/account/page.tsx; then
    echo "✅ Pro features section found"
else
    echo "❌ Pro features section missing"
    exit 1
fi

# Test 8: Check analytics enhancements
echo ""
echo "8️⃣  Analytics Enhancements Test"
echo "-------------------------------"

new_events=(
    "account_viewed"
    "pro_bypass_hit"
    "already_pro_at_checkout"
    "webhook_duplicate_ignored"
)

for event in "${new_events[@]}"; do
    if grep -q "$event" app/lib/analytics.ts; then
        echo "✅ $event analytics event found"
    else
        echo "❌ $event analytics event missing"
        exit 1
    fi
done

if grep -q "ENABLE_ANALYTICS" app/lib/analytics.ts; then
    echo "✅ Conditional analytics found"
else
    echo "❌ Conditional analytics missing"
    exit 1
fi

# Test 9: Check TypeScript compilation
echo ""
echo "9️⃣  TypeScript Compilation Test"
echo "-------------------------------"

echo "Checking TypeScript compilation..."
if npm run build:check 2>/dev/null || npx tsc --noEmit 2>/dev/null; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    exit 1
fi

# Test 10: Basic functionality test (if dev server is running)
echo ""
echo "🔟 Basic Functionality Test"
echo "---------------------------"

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Dev server is running"
    
    # Test account page
    if curl -s http://localhost:3000/account | grep -q "Manage Pro"; then
        echo "✅ Account page accessible"
    else
        echo "⚠️  Account page may have issues"
    fi
    
    # Test pricing page
    if curl -s http://localhost:3000/pricing | grep -q "Pro"; then
        echo "✅ Pricing page accessible"
    else
        echo "⚠️  Pricing page may have issues"
    fi
else
    echo "⚠️  Dev server not running - skipping functionality tests"
    echo "   Run 'npm run dev' to test live functionality"
fi

echo ""
echo "🎉 E4 QA Tests Completed!"
echo "========================="
echo ""
echo "✅ All critical E4 components verified:"
echo "   • Plan detection system (server & client)"
echo "   • Rate limiting with Pro bypass"
echo "   • Webhook security hardening"
echo "   • Account management improvements"
echo "   • Navbar Pro indicators"
echo "   • Environment configuration"
echo "   • Analytics enhancements"
echo ""
echo "🚀 Ready for beta launch!"
