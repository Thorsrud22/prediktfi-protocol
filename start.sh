#!/bin/bash

# PrediktFi Protocol Development Startup Script
# This script helps you get started with development quickly

set -e

echo "🚀 PrediktFi Protocol - Development Setup"
echo "========================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js
if command_exists node; then
    echo "✅ Node.js $(node --version) is installed"
else
    echo "❌ Node.js is required. Install from: https://nodejs.org/"
    exit 1
fi

# Check Rust/Cargo
if command_exists cargo; then
    echo "✅ Rust/Cargo is installed"
else
    echo "❌ Rust is required. Install from: https://rustup.rs/"
    exit 1
fi

# Check Solana CLI
if command_exists solana; then
    echo "✅ Solana CLI is installed"
else
    echo "⚠️  Solana CLI not found. Please install it:"
    echo "   sh -c \"\$(curl -sSfL https://release.solana.com/v1.18.26/install)\""
    echo "   Then add ~/.local/share/solana/install/active_release/bin to PATH"
fi

# Check Anchor CLI
if command_exists anchor; then
    echo "✅ Anchor CLI is installed"
else
    echo "⚠️  Anchor CLI not found. Please install it:"
    echo "   cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked"
fi

echo ""

# Install Node.js dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    if command_exists yarn; then
        yarn install
    else
        npm install
    fi
else
    echo "✅ Node.js dependencies already installed"
fi

echo ""
echo "🎯 Next Steps:"
echo ""

if command_exists anchor && command_exists solana; then
    echo "1. Build the project:          anchor build"
    echo "2. Start local validator:      solana-test-validator"
    echo "3. Deploy program:             anchor deploy"
    echo "4. Run tests:                  anchor test"
    echo ""
    echo "Or use the convenient scripts:"
    echo "- yarn build                   # Build the program"
    echo "- yarn start                   # Start Anchor localnet"
    echo "- yarn test                    # Run tests"
    echo "- yarn deploy                  # Deploy to network"
else
    echo "1. Install missing dependencies (see warnings above)"
    echo "2. Run this script again: ./start.sh"
    echo "3. Then build with: anchor build"
fi

echo ""
echo "📚 See README.md and DEVELOPMENT.md for detailed instructions"
echo ""
echo "Happy coding! 🎯"