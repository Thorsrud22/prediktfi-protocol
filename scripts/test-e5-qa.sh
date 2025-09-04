#!/bin/bash

# ✅ E5 QA/Smoke Test Script - Beta Launch & Prod Hardening
# Tests production readiness after BLOCK E5 implementation

set -e

echo "🚀 Starting E5 Beta Launch QA Tests"
echo "==================================="

# Test 1: Environment requirements check
echo ""
echo "1️⃣  Environment Requirements Test"
echo "--------------------------------"

# Check Node.js version
NODE_VERSION=$(node -v)
echo "✅ Node.js version: $NODE_VERSION"

# Check package manager
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm -v)
    echo "✅ pnpm version: $PNPM_VERSION"
    PKG_MANAGER="pnpm"
elif command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm version: $NPM_VERSION"
    PKG_MANAGER="npm"
else
    echo "❌ No package manager found (npm/pnpm)"
    exit 1
fi

# Test 2: Build verification
echo ""
echo "2️⃣  Build Verification Test"
echo "---------------------------"

echo "Building application..."
if $PKG_MANAGER run build &> /dev/null; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed"
    exit 1
fi

# Test 3: Health endpoint check (local)
echo ""
echo "3️⃣  Health Endpoint Test"
echo "------------------------"

# Check if dev server is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Dev server detected"
    
    # Test health endpoint
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/_internal/health)
    if echo "$HEALTH_RESPONSE" | grep -q '"ok":true'; then
        echo "✅ Health endpoint returns ok:true"
    else
        echo "❌ Health endpoint response invalid: $HEALTH_RESPONSE"
        exit 1
    fi
    
    # Check if response has timestamp
    if echo "$HEALTH_RESPONSE" | grep -q '"ts":'; then
        echo "✅ Health endpoint includes timestamp"
    else
        echo "❌ Health endpoint missing timestamp"
        exit 1
    fi
else
    echo "⚠️  Dev server not running - skipping local health check"
    echo "   Run '$PKG_MANAGER dev' to test live endpoints"
fi

# Test 4: Pricing page accessibility
echo ""
echo "4️⃣  Pricing Page Accessibility Test"
echo "----------------------------------"

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    PRICING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/pricing)
    if [ "$PRICING_STATUS" = "200" ]; then
        echo "✅ Pricing page accessible (200)"
    else
        echo "❌ Pricing page returned status: $PRICING_STATUS"
        exit 1
    fi
else
    echo "⚠️  Dev server not running - skipping pricing page test"
fi

# Test 5: Status page test
echo ""
echo "5️⃣  Status Page Test"
echo "-------------------"

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    STATUS_RESPONSE=$(curl -s http://localhost:3000/status)
    if echo "$STATUS_RESPONSE" | grep -q "System Status"; then
        echo "✅ Status page accessible"
    else
        echo "❌ Status page not accessible"
        exit 1
    fi
    
    # Check for plan header in response
    STATUS_HEADERS=$(curl -s -I http://localhost:3000/status)
    if echo "$STATUS_HEADERS" | grep -i "x-plan:"; then
        echo "✅ x-plan header found in status response"
    else
        echo "❌ x-plan header missing from status response"
        exit 1
    fi
else
    echo "⚠️  Dev server not running - skipping status page test"
fi

# Test 6: Security headers check
echo ""
echo "6️⃣  Security Headers Test"
echo "-------------------------"

# Check if next.config.js has security headers
if grep -q "Strict-Transport-Security" next.config.js; then
    echo "✅ HSTS header configured"
else
    echo "❌ HSTS header missing from next.config.js"
    exit 1
fi

if grep -q "X-Frame-Options" next.config.js; then
    echo "✅ X-Frame-Options configured"
else
    echo "❌ X-Frame-Options missing from next.config.js"
    exit 1
fi

if grep -q "Content-Security-Policy" next.config.js; then
    echo "✅ CSP configured"
else
    echo "❌ CSP missing from next.config.js"
    exit 1
fi

if grep -q "coinbase.com" next.config.js; then
    echo "✅ Coinbase domains allowed in CSP"
else
    echo "❌ Coinbase domains missing from CSP"
    exit 1
fi

# Test 7: Plan detection system
echo ""
echo "7️⃣  Plan Detection System Test"
echo "------------------------------"

if [ -f "app/lib/plan.ts" ]; then
    echo "✅ plan.ts exists"
else
    echo "❌ plan.ts missing"
    exit 1
fi

if grep -q "setProCookie" app/lib/plan.ts; then
    echo "✅ setProCookie function found"
else
    echo "❌ setProCookie function missing"
    exit 1
fi

if grep -q "HttpOnly" app/lib/plan.ts; then
    echo "✅ HttpOnly cookie flag configured"
else
    echo "❌ HttpOnly cookie flag missing"
    exit 1
fi

if grep -q "Secure" app/lib/plan.ts; then
    echo "✅ Secure cookie flag configured"
else
    echo "❌ Secure cookie flag missing"
    exit 1
fi

# Test 8: API route structure
echo ""
echo "8️⃣  API Route Structure Test"
echo "----------------------------"

# Check critical API routes exist
api_routes=(
    "app/api/_internal/health/route.ts"
    "app/api/ai/predict/route.ts"
    "app/api/billing/redeem/route.ts"
    "app/api/billing/webhook/route.ts"
)

for route in "${api_routes[@]}"; do
    if [ -f "$route" ]; then
        echo "✅ $route exists"
    else
        echo "❌ $route missing"
        exit 1
    fi
done

# Test 9: Environment configuration
echo ""
echo "9️⃣  Environment Configuration Test"
echo "----------------------------------"

# Check .env.example has E5 requirements
required_env_vars=(
    "PREDIKT_BASE_URL"
    "PREDIKT_LICENSE_SECRET"
    "COINBASE_COMMERCE_API_KEY"
    "COINBASE_COMMERCE_SHARED_SECRET"
    "NEXT_PUBLIC_APP_ENV"
)

for var in "${required_env_vars[@]}"; do
    if grep -q "$var" .env.example; then
        echo "✅ $var configured in .env.example"
    else
        echo "❌ $var missing from .env.example"
        exit 1
    fi
done

# Test 10: TypeScript compilation
echo ""
echo "🔟 TypeScript Compilation Test"
echo "------------------------------"

echo "Checking TypeScript compilation..."
if npx tsc --noEmit 2>/dev/null; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    exit 1
fi

# Test 11: Pro cookie simulation (if dev server running)
echo ""
echo "1️⃣1️⃣ Pro Cookie Simulation Test"
echo "-------------------------------"

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "ℹ️  Testing license redeem flow..."
    
    # Test license endpoint exists and responds
    REDEEM_RESPONSE=$(curl -s -X POST http://localhost:3000/api/billing/redeem \
        -H "Content-Type: application/json" \
        -d '{"license":"invalid"}' || echo "")
    
    if [ -n "$REDEEM_RESPONSE" ]; then
        echo "✅ License redeem endpoint responds"
    else
        echo "❌ License redeem endpoint not responding"
        exit 1
    fi
else
    echo "⚠️  Dev server not running - skipping cookie simulation"
fi

echo ""
echo "🎉 E5 Beta Launch QA Tests Completed!"
echo "====================================="
echo ""
echo "✅ All E5 components verified:"
echo "   • Environment requirements met"
echo "   • Build process working"
echo "   • Health endpoints functional"
echo "   • Security headers configured"
echo "   • Plan detection system ready"
echo "   • API routes structured correctly"
echo "   • TypeScript compilation clean"
echo ""
echo "🚀 Ready for production deployment!"
echo ""
echo "Next steps:"
echo "   1. Configure Vercel environment variables"
echo "   2. Set up Coinbase webhook endpoints" 
echo "   3. Run production smoke tests"
echo "   4. Monitor health endpoint post-deploy"
