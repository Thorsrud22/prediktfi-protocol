#!/bin/bash

# Stable development server with crash recovery
# This script monitors the dev server and restarts it if it crashes

echo "🚀 Starting stable development server with Node.js $(node --version)"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down development server..."
    kill $DEV_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Initialize restart counter
RESTART_COUNT=0
MAX_RESTARTS=5

while [ $RESTART_COUNT -lt $MAX_RESTARTS ]; do
    echo "📡 Starting development server (attempt $((RESTART_COUNT + 1))/$MAX_RESTARTS)..."
    
    # Start the dev server in background
    npm run dev &
    DEV_PID=$!
    
    # Wait for the process to finish or crash
    wait $DEV_PID
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo "✅ Development server exited cleanly"
        break
    else
        echo "💥 Development server crashed with exit code $EXIT_CODE"
        RESTART_COUNT=$((RESTART_COUNT + 1))
        
        if [ $RESTART_COUNT -lt $MAX_RESTARTS ]; then
            echo "🔄 Restarting in 3 seconds..."
            sleep 3
        else
            echo "❌ Maximum restart attempts reached. Please check for issues."
            exit 1
        fi
    fi
done
