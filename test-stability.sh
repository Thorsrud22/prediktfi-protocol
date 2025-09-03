#!/bin/bash

echo "🚀 Testing dev server stability..."

# Kill any existing processes
pkill -f "next dev" 2>/dev/null || true

# Clear cache
rm -rf .next

# Start server in background and capture output
echo "📦 Starting dev server..."
npm run dev > /tmp/dev-test.log 2>&1 &
DEV_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 10

# Check if process is still running
if ! kill -0 $DEV_PID 2>/dev/null; then
    echo "❌ Server crashed during startup!"
    echo "Last 20 lines of log:"
    tail -20 /tmp/dev-test.log
    exit 1
fi

echo "✅ Server started, testing HTTP requests..."

# Test some requests
STATUS_HOME=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || echo "FAIL")
STATUS_STUDIO=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/studio || echo "FAIL") 
STATUS_API=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/test-geofence || echo "FAIL")

# Check if server is still alive after requests
sleep 2
if ! kill -0 $DEV_PID 2>/dev/null; then
    echo "💥 Server crashed after HTTP requests!"
    echo "Last 20 lines of log:"
    tail -20 /tmp/dev-test.log
    exit 1
fi

echo "🧪 Test Results:"
echo "  / → $STATUS_HOME"
echo "  /studio → $STATUS_STUDIO"  
echo "  /api/test-geofence → $STATUS_API"

# Clean up
kill $DEV_PID 2>/dev/null || true
wait $DEV_PID 2>/dev/null || true

if [[ "$STATUS_HOME" =~ ^[2-3][0-9][0-9]$ ]] && [[ "$STATUS_STUDIO" =~ ^[2-3][0-9][0-9]$ ]]; then
    echo "🎉 SUCCESS: Server appears stable!"
    echo "📄 Full log available at /tmp/dev-test.log"
    exit 0
else
    echo "⚠️  PARTIAL SUCCESS: Server didn't crash but some routes failed"
    echo "📄 Check /tmp/dev-test.log for details"
    exit 1
fi
