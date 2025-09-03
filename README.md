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
   # Run unit tests
   npm run test
   
   # Run end-to-end tests (mock)
   npm run test:e2e:mock
   
   # Run end-to-end tests with real wallet (requires manual interaction)
   npm run test:e2e:real
   ```
   
4. **Development:**

   ```bash
   # Start Next.js development server
   npm run dev
   ```

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

### Environment variables (frontend)

Copy `.env.example` to `.env.local` and adjust values:

```bash
cp .env.example .env.local
```

Required keys:

- `SOLANA_CLUSTER` — devnet | mainnet-beta (default: devnet)
- `SOLANA_RPC_URL` — RPC endpoint URL (server-side only)
- `SOLANA_TREASURY` — treasury account public key (Base58, server-side only)
- `NEXT_PUBLIC_MOCK_TX` — set `0` for real devnet transactions, `1` for quick rollback to mock mode (default: 0)
- `NEXT_PUBLIC_SITE_URL` — site URL for Next.js (default: http://localhost:3000)
- `NEXT_PUBLIC_ENABLE_ADMIN` — enable admin panel (optional, default: false)
- `ADMIN_USER` — admin username (server-side only, optional)
- `ADMIN_PASS` — admin password (server-side only, optional)

Note: `.env.local` is ignored by git. Do not commit secrets.

### Real SOL (MOCK_TX=0)

To use real transfers from the connected wallet to the protocol treasury with an SPL Memo, configure `.env.local` like:

```bash
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_PROTOCOL_TREASURY=<your_devnet_treasury_pubkey>
NEXT_PUBLIC_FEE_BPS=200
NEXT_PUBLIC_MOCK_TX=0
```

Behavior:

- The full bet amount (SOL) is sent to `NEXT_PUBLIC_PROTOCOL_TREASURY` using `SystemProgram.transfer`.
- An SPL Memo is attached describing the bet (JSON):
  `{ "t": "bet", "v": 1, "m": <marketId>, "s": <side>, "feeBps": <bps> }`.
- The UI shows a toast with a "View on Explorer" link (`?cluster=devnet` or `?cluster=mainnet-beta`).

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

## How to run V1 (devnet)

1. Environment (.env.local)

```bash
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_PROTOCOL_TREASURY=<your_devnet_treasury_pubkey>
NEXT_PUBLIC_FEE_BPS=200
NEXT_PUBLIC_MOCK_TX=0
```

2. Start app

```bash
npm install
npm run dev
```

3. Manual flow in browser

- Home → Select Wallet → connect your player wallet (ensure Devnet). If balance < 0.6 SOL, use Phantom Developer → Airdrop 1 SOL (or https://faucet.solana.com/).
- Go to Active Markets → open the first market (/market/1).
- Pick side YES → enter 0.5 SOL.
- Expect CTA text: "Place 0.5 SOL Bet • Fee 0.01 • Net 0.49".
- Click CTA → Sign in Phantom → Toast shows "Sending transaction…" then "Bet placed" + "View on Explorer".
- Explorer link should include ?cluster=devnet and show a System Program: Transfer to your configured treasury, amount ≈ 0.5 SOL, with SPL Memo JSON documenting the bet.
