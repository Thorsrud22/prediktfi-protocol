#!/bin/bash

echo "Setting up PrediktFi Protocol development environment..."

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.18/install)"
export PATH="/home/vscode/.local/share/solana/install/active_release/bin:$PATH"
echo 'export PATH="/home/vscode/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc

# Configure Solana to use devnet
solana config set --url devnet

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest || echo "AVM install failed, will use manual setup"
avm use latest || echo "AVM use failed, will use manual setup"

# Install Node dependencies
npm install

echo "Setup complete! You can now:"
echo "1. Run 'anchor build' to build the program"
echo "2. Run 'anchor test' to run tests"
echo "3. Run 'solana-test-validator' to start a local validator"
echo "4. Check the README.md for more information about migrating from nextjs-boilerplate"