#!/bin/bash

# Predikt Advisor v0.1 Test Script
echo "🧪 Testing Predikt Advisor v0.1..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local command="$2"
    
    echo -n "Testing $test_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}"
        ((TESTS_FAILED++))
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in project root directory${NC}"
    exit 1
fi

echo "🔍 Running comprehensive tests..."

# 1. Check if required files exist
echo ""
echo "📁 Checking file structure..."
run_test "Prisma schema exists" "[ -f 'prisma/schema.prisma' ]"
run_test "Advisor pages exist" "[ -f 'app/advisor/page.tsx' ]"
run_test "Alerts pages exist" "[ -f 'app/advisor/alerts/page.tsx' ]"
run_test "Strategies pages exist" "[ -f 'app/advisor/strategies/page.tsx' ]"
run_test "Alerts engine exists" "[ -f 'app/lib/advisor/alerts-engine.ts' ]"
run_test "Notification channels exist" "[ -f 'app/lib/advisor/channels/inapp.ts' ]"
run_test "API endpoints exist" "[ -f 'app/api/advisor/portfolio/snapshot/route.ts' ]"
run_test "E2E tests exist" "[ -f 'tests-e2e/advisor.spec.ts' ]"

# 2. Check TypeScript compilation
echo ""
echo "🔧 Checking TypeScript compilation..."
run_test "TypeScript compilation" "npm run typecheck"

# 3. Check if dependencies are installed
echo ""
echo "📦 Checking dependencies..."
run_test "Node modules exist" "[ -d 'node_modules' ]"
run_test "Prisma client generated" "[ -f 'node_modules/.prisma/client/index.js' ]"

# 4. Check environment variables
echo ""
echo "🌍 Checking environment..."
if [ -f ".env" ]; then
    run_test "Environment file exists" "true"
    
    # Check if feature flags are set
    if grep -q "FEATURE_ADVISOR=true" .env; then
        echo -e "  ${GREEN}✅ FEATURE_ADVISOR enabled${NC}"
    else
        echo -e "  ${YELLOW}⚠️  FEATURE_ADVISOR not set${NC}"
    fi
    
    if grep -q "FEATURE_ALERTS=true" .env; then
        echo -e "  ${GREEN}✅ FEATURE_ALERTS enabled${NC}"
    else
        echo -e "  ${YELLOW}⚠️  FEATURE_ALERTS not set${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠️  .env file not found${NC}"
fi

# 5. Run unit tests
echo ""
echo "🧪 Running unit tests..."
run_test "Unit tests pass" "npm run test"

# 6. Check if server can start (quick check)
echo ""
echo "🚀 Checking server startup..."
timeout 10s npm run dev > /dev/null 2>&1 &
SERVER_PID=$!
sleep 5

if kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "  ${GREEN}✅ Server started successfully${NC}"
    kill $SERVER_PID 2>/dev/null
    ((TESTS_PASSED++))
else
    echo -e "  ${RED}❌ Server failed to start${NC}"
    ((TESTS_FAILED++))
fi

# 7. Check API endpoints (if server is running)
echo ""
echo "🔌 Checking API endpoints..."
# Start server in background
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!
sleep 10

# Test health endpoint
run_test "Health endpoint responds" "curl -s http://localhost:3000/api/health/alerts | grep -q 'healthy'"

# Test advisor endpoints
run_test "Advisor page loads" "curl -s http://localhost:3000/advisor | grep -q 'Predikt Advisor'"
run_test "Alerts page loads" "curl -s http://localhost:3000/advisor/alerts | grep -q 'Alert Management'"
run_test "Strategies page loads" "curl -s http://localhost:3000/advisor/strategies | grep -q 'Strategy Studio'"

# Clean up
kill $SERVER_PID 2>/dev/null

# 8. Check cron job setup
echo ""
echo "⏰ Checking cron job setup..."
if crontab -l 2>/dev/null | grep -q "advisor:tick"; then
    echo -e "  ${GREEN}✅ Cron job is set up${NC}"
    ((TESTS_PASSED++))
else
    echo -e "  ${YELLOW}⚠️  Cron job not set up${NC}"
    ((TESTS_FAILED++))
fi

# 9. Check documentation
echo ""
echo "📚 Checking documentation..."
run_test "Advisor docs exist" "[ -f 'docs/ADVISOR.md' ]"
run_test "Alerts docs exist" "[ -f 'docs/ALERTS.md' ]"

# Summary
echo ""
echo "📊 Test Summary:"
echo "================"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Predikt Advisor v0.1 is ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please fix the issues before deploying.${NC}"
    exit 1
fi
