#!/bin/bash

echo "🚀 Performance Testing Report - After Optimizations"
echo "=================================================="
echo ""

# Wait for server to be fully ready
sleep 3

# Function to test page performance
test_page() {
    local page=$1
    local url="http://localhost:3000$page"
    
    echo "Testing: $page"
    echo "URL: $url"
    
    # Test response time with curl
    local time_result=$(curl -w "@- response time: %{time_total}s\n" -s -o /dev/null "$url" 2>/dev/null)
    echo "$time_result"
    
    # Test if page loads successfully
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    echo "Status: $status_code"
    echo "---"
}

echo "1. Homepage Performance:"
test_page "/"
echo ""

echo "2. Studio Page Performance:"
test_page "/studio"
echo ""

echo "3. Advisor Page Performance:"
test_page "/advisor"
echo ""

echo "4. Actions Page Performance:"
test_page "/actions"
echo ""

echo "5. Pricing Page Performance:"
test_page "/pricing"
echo ""

echo "6. Feed Page Performance:"
test_page "/feed"
echo ""

echo "🎯 API Endpoint Testing:"
echo "========================"

echo "7. Studio Templates API:"
test_page "/api/studio/templates"
echo ""

echo "8. Feed API:"
test_page "/api/feed?limit=5"
echo ""

echo "✅ Performance testing complete!"
echo ""
echo "Note: Times under 1 second indicate successful optimizations!"
echo "Previous Studio page load time was 4908ms - we should see significant improvement."