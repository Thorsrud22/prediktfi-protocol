# PrediktFi Protocol

A Solana/Anchor program for PrediktFi - a decentralized prediction market platform on Solana (Devnet).

## Overview

PrediktFi Protocol allows users to create and participate in prediction markets on various topics. Users can place predictions on outcomes and earn rewards based on correct predictions.

## Project Structure

```
prediktfi-protocol/
├── programs/
│   └── prediktfi-protocol/
│       ├── src/
│       │   └── lib.rs          # Main program logic
│       └── Cargo.toml          # Program dependencies
├── tests/
│   └── prediktfi-protocol.ts   # Test files
├── migrations/
│   └── deploy.js              # Deployment script
├── app/                       # Frontend application (if needed)
├── Anchor.toml                # Anchor configuration
├── Cargo.toml                 # Workspace configuration
└── package.json               # Node.js dependencies
```

## Prerequisites

- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor Framework](https://book.anchor-lang.com/getting_started/installation.html)
- [Node.js](https://nodejs.org/)

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the program:**
   ```bash
   anchor build
   ```

3. **Run tests:**
   ```bash
   anchor test
   ```

4. **Deploy to devnet:**
   ```bash
   anchor deploy --provider.cluster devnet
   ```

## Program Features

- **Create Prediction Markets**: Authorities can create new prediction markets with descriptions and end timestamps
- **Place Predictions**: Users can place YES/NO predictions with specified amounts
- **Resolve Markets**: Authorities can resolve markets with final outcomes
- **Error Handling**: Comprehensive error handling for expired markets and resolved markets

## Moving from NextJS Boilerplate Repository

If your files are currently in a `nextjs-boilerplate` repository and you want to migrate to this `prediktfi-protocol` repository:

### Option 1: Move Frontend Files to `app/` Directory

1. **Clone your nextjs-boilerplate repository locally:**
   ```bash
   git clone https://github.com/your-username/nextjs-boilerplate.git
   ```

2. **Copy relevant files to this repository:**
   ```bash
   # Copy NextJS frontend to app directory
   cp -r nextjs-boilerplate/* prediktfi-protocol/app/
   
   # Or copy specific directories you need
   cp -r nextjs-boilerplate/src prediktfi-protocol/app/
   cp -r nextjs-boilerplate/pages prediktfi-protocol/app/
   cp -r nextjs-boilerplate/components prediktfi-protocol/app/
   ```

3. **Update package.json** to include frontend build scripts:
   ```json
   {
     "scripts": {
       "dev": "cd app && npm run dev",
       "build:frontend": "cd app && npm run build",
       "build:all": "anchor build && npm run build:frontend"
     }
   }
   ```

### Option 2: Use This Repository as Your Main Workspace

1. **Set your Codespaces to point to this repository:**
   - Go to GitHub Codespaces settings
   - Ensure you're opening Codespaces from `Thorsrud22/prediktfi-protocol`
   - Delete any existing Codespaces from the nextjs-boilerplate repository

2. **Move your NextJS code here and maintain both frontend and smart contract in one repo**

### Option 3: Keep Separate Repositories

If you prefer to keep frontend and smart contract separate:
- Use this repository for Solana/Anchor smart contract development
- Keep your NextJS frontend in the nextjs-boilerplate repository
- Use the smart contract's deployed program ID in your frontend

## Configuration

### Anchor.toml
The main configuration file for Anchor. Update the program ID and cluster settings as needed.

### Devnet Configuration
The project is configured for Solana Devnet by default. To switch networks, update the `cluster` setting in `Anchor.toml`.

## Testing

Run the test suite:
```bash
anchor test
```

Tests are located in the `tests/` directory and written in TypeScript.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
