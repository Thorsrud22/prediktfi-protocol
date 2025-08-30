#!/bin/bash

# Setup script for Solana/Anchor development environment

echo "Setting up Solana/Anchor development environment..."

# Install Solana CLI
curl -sSfL https://release.solana.com/v1.18.17/install | sh
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc

# Install Anchor
npm install -g @coral-xyz/anchor-cli

# Install yarn (often used with Anchor projects)
npm install -g yarn

# Set Solana config to devnet (as mentioned in README)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana config set --url devnet

echo "Setup complete! You can now use Solana and Anchor commands."
echo "Run 'anchor init' to initialize a new Anchor project."