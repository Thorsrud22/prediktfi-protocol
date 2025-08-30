# Development Guide

## Getting Started in 3 Steps

### Option 1: Quick Start (Recommended)
```bash
./start.sh
```

### Option 2: Manual Setup
```bash
# 1. Install dependencies
yarn install

# 2. Build the project
yarn build

# 3. Start development
yarn start
```

### Option 3: Step by Step
```bash
# Install dependencies
yarn install

# Build the Anchor program
anchor build

# Start local Solana validator
yarn localnet

# In another terminal - deploy the program
yarn deploy

# Run tests to verify everything works
yarn test
```

## Development Commands

| Command | What it does |
|---------|--------------|
| `./start.sh` | Complete setup and configuration |
| `yarn start` | Start Anchor localnet |
| `yarn dev` | Development mode with tests |
| `yarn build` | Compile the Solana program |
| `yarn test` | Run all tests |
| `yarn deploy` | Deploy to current network |
| `yarn clean` | Clean build artifacts |

## Troubleshooting

### Common Issues

**"anchor: command not found"**
```bash
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

**"solana: command not found"**
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.18.26/install)"
```

**Build fails**
```bash
yarn clean
yarn build
```

**Tests fail**
```bash
# Make sure localnet is running
yarn localnet

# In another terminal
yarn deploy
yarn test
```

## Network Configuration

Edit `Anchor.toml` to change networks:

- `localnet` - Local development
- `devnet` - Testing
- `mainnet` - Production

## Project Structure

```
programs/prediktfi-protocol/src/
├── lib.rs              # Main program logic
└── ...                 # Additional modules

tests/
├── prediktfi-protocol.js  # TypeScript/JavaScript tests
└── ...

migrations/
└── deploy.js           # Deployment scripts
```