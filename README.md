# prediktfi-protocol
Solana/Anchor program for PrediktFi (devnet)

## Development

This project is configured to work with GitHub Codespaces. The development environment includes:
- Solana CLI (v1.18.17)
- Anchor CLI
- Node.js and yarn
- Rust development tools

### Getting Started

#### Using GitHub Codespaces
1. Click the "Code" button and select "Open with Codespaces"
2. Create a new codespace or use an existing one
3. The environment will be automatically set up with all necessary tools

#### Local Development
1. Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
2. Install Solana CLI: `curl -sSfL https://release.solana.com/v1.18.17/install | sh`
3. Install Anchor: `npm install -g @coral-xyz/anchor-cli`
4. Install dependencies: `yarn install`

### Building and Testing
```bash
# Build the program
anchor build

# Run tests
anchor test
```

### Configuration
- Network: Devnet
- Program ID: `11111111111111111111111111111112` (placeholder)

Make sure to update the program ID in `Anchor.toml` and `lib.rs` before deploying.
