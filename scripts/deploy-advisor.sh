#!/bin/bash

# Predikt Advisor v0.1 Deployment Script
echo "🚀 Deploying Predikt Advisor v0.1..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found, creating from .env.example"
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        echo "❌ Error: .env.example not found"
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma generate
npx prisma migrate deploy

# Build the application
echo "🔨 Building application..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm run test

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Set up cron job for alerts (if not already set up)
echo "⏰ Setting up cron job for alerts..."
CRON_JOB="*/5 * * * * cd $(pwd) && npm run advisor:tick"
if ! crontab -l | grep -q "advisor:tick"; then
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron job added"
else
    echo "ℹ️  Cron job already exists"
fi

# Start the application
echo "🎉 Starting Predikt Advisor v0.1..."
echo "📊 Advisor Dashboard: http://localhost:3000/advisor"
echo "🔔 Alerts Management: http://localhost:3000/advisor/alerts"
echo "🎯 Strategy Studio: http://localhost:3000/advisor/strategies"
echo ""
echo "Press Ctrl+C to stop the server"

npm start
