#!/bin/bash

# Predikt Advisor v0.1 - Quick Start Script
echo "🚀 Starting Predikt Advisor v0.1..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Set environment variables
export FEATURE_ADVISOR=true
export FEATURE_ALERTS=true

# Check if .env exists, if not create it
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database
DATABASE_URL="file:./dev.db"

# Feature Flags
FEATURE_ADVISOR=true
FEATURE_ALERTS=true

# Next.js
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
EOF
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name advisor_v0_1 --skip-generate

# Start the development server
echo "🎉 Starting Predikt Advisor v0.1..."
echo ""
echo "📊 Advisor Dashboard: http://localhost:3000/advisor"
echo "🔔 Alerts Management: http://localhost:3000/advisor/alerts"
echo "🎯 Strategy Studio: http://localhost:3000/advisor/strategies"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm run dev
