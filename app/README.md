# Frontend Directory

This directory is where you should place your NextJS frontend code.

## If you're migrating from nextjs-boilerplate:

1. Copy your files from the nextjs-boilerplate repository to this directory
2. Update any references to smart contract addresses/program IDs
3. Install dependencies with `npm install` from this directory

## If you're starting fresh:

```bash
cd app
npx create-next-app@latest . --typescript --tailwind --eslint --app
```

Then install Solana/Web3 dependencies:
```bash
npm install @solana/web3.js @coral-xyz/anchor
```

## Connecting to Smart Contract

Use the program ID from your deployed smart contract:
```typescript
const programId = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
```

See the parent README.md for more details.