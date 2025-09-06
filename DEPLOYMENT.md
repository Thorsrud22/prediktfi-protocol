# PrediktFi Protocol - Deployment Guide

## Prerequisites

Before deploying the PrediktFi Protocol, ensure you have the following installed:

### Required Tools
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Rust** (latest stable)
- **Solana CLI** (v1.16.0 or higher)
- **Anchor Framework** (v0.30.1 or higher)

### Installation Commands

```bash
# Install Node.js (if not already installed)
# Visit https://nodejs.org/ or use a package manager

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"
export PATH="/home/$(whoami)/.local/share/solana/install/active_release/bin:$PATH"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

## Environment Setup

### 1. Clone and Setup Repository

```bash
git clone https://github.com/Thorsrud22/prediktfi-protocol.git
cd prediktfi-protocol
npm install
```

### 2. Environment Configuration

Create environment files for different deployment targets:

#### `.env.local` (for local development)
```bash
# Solana Configuration
SOLANA_CLUSTER=localnet
SOLANA_RPC_URL=http://127.0.0.1:8899
ANCHOR_PROVIDER_URL=http://127.0.0.1:8899
ANCHOR_WALLET=~/.config/solana/id.json

# Program ID (will be generated after first build)
NEXT_PUBLIC_PROGRAM_ID=

# Feature Flags
NEXT_PUBLIC_AI_NORMALIZATION=true
NEXT_PUBLIC_SOCIAL_SHARING=true
NEXT_PUBLIC_COMMIT_ENABLED=true

# Development Settings
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

#### `.env.devnet` (for devnet deployment)
```bash
# Solana Configuration
SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
ANCHOR_WALLET=~/.config/solana/devnet.json

# Program ID (update after devnet deployment)
NEXT_PUBLIC_PROGRAM_ID=

# Feature Flags
NEXT_PUBLIC_AI_NORMALIZATION=true
NEXT_PUBLIC_SOCIAL_SHARING=true
NEXT_PUBLIC_COMMIT_ENABLED=true

# Production Settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

#### `.env.mainnet` (for mainnet deployment)
```bash
# Solana Configuration
SOLANA_CLUSTER=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
ANCHOR_PROVIDER_URL=https://api.mainnet-beta.solana.com
ANCHOR_WALLET=~/.config/solana/mainnet.json

# Program ID (update after mainnet deployment)
NEXT_PUBLIC_PROGRAM_ID=

# Feature Flags (be conservative on mainnet)
NEXT_PUBLIC_AI_NORMALIZATION=true
NEXT_PUBLIC_SOCIAL_SHARING=true
NEXT_PUBLIC_COMMIT_ENABLED=true

# Production Settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## Local Development Deployment

### 1. Start Local Validator

```bash
# Start Solana test validator
solana-test-validator --reset
```

### 2. Configure Solana CLI

```bash
# Set to localhost
solana config set --url localhost

# Generate or set keypair
solana-keygen new --outfile ~/.config/solana/id.json
solana config set --keypair ~/.config/solana/id.json

# Check configuration
solana config get
```

### 3. Build and Deploy Program

```bash
# Build the Anchor program
anchor build

# Get the program ID
solana address -k target/deploy/prediktfi_protocol-keypair.json

# Update Anchor.toml with the program ID
# Update lib.rs declare_id! with the program ID

# Deploy to local validator
anchor deploy

# Verify deployment
solana program show <PROGRAM_ID>
```

### 4. Run Frontend

```bash
# Start Next.js development server
npm run dev

# The app will be available at http://localhost:3000
```

### 5. Initialize Protocol

Once the frontend is running:
1. Connect your wallet (use a local wallet with some SOL)
2. Click "Initialize Protocol" button
3. Confirm the transaction

## Devnet Deployment

### 1. Setup Devnet Wallet

```bash
# Create devnet keypair
solana-keygen new --outfile ~/.config/solana/devnet.json

# Set devnet configuration
solana config set --url devnet
solana config set --keypair ~/.config/solana/devnet.json

# Airdrop SOL for deployment costs
solana airdrop 5
```

### 2. Deploy to Devnet

```bash
# Build program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Verify deployment
solana program show <PROGRAM_ID> --url devnet
```

### 3. Update Configuration

Update the program ID in:
- `Anchor.toml`
- `lib.rs` (declare_id!)
- `.env.devnet` (NEXT_PUBLIC_PROGRAM_ID)
- Frontend components

### 4. Test on Devnet

```bash
# Run tests against devnet
anchor test --provider.cluster devnet

# Start frontend with devnet config
cp .env.devnet .env.local
npm run dev
```

## Mainnet Deployment

### ⚠️ Pre-Deployment Checklist

Before deploying to mainnet, ensure:

- [ ] All tests pass on devnet
- [ ] Security audit completed
- [ ] Code review completed
- [ ] Emergency procedures documented
- [ ] Monitoring and alerting configured
- [ ] Budget allocation for deployment costs (~0.5-1 SOL)

### 1. Setup Mainnet Wallet

```bash
# Create mainnet keypair (SECURE THIS!)
solana-keygen new --outfile ~/.config/solana/mainnet.json

# Set mainnet configuration
solana config set --url mainnet-beta
solana config set --keypair ~/.config/solana/mainnet.json

# Fund the wallet with SOL for deployment
# Transfer SOL from exchange or other wallet
```

### 2. Final Security Check

```bash
# Run all tests
npm run test:all

# Security audit
npm audit --audit-level=high
cargo audit

# Build verification
anchor build --verifiable
```

### 3. Deploy to Mainnet

```bash
# Deploy to mainnet
anchor deploy --provider.cluster mainnet-beta

# Verify deployment
solana program show <PROGRAM_ID> --url mainnet-beta
```

### 4. Post-Deployment

1. **Update all configurations** with mainnet program ID
2. **Test basic functionality** with small amounts
3. **Monitor for any issues**
4. **Announce to community**

## Frontend Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository to Vercel**
   - Import project from GitHub
   - Configure build settings

2. **Environment Variables**
   ```bash
   NEXT_PUBLIC_PROGRAM_ID=<YOUR_PROGRAM_ID>
   NEXT_PUBLIC_SOLANA_CLUSTER=devnet # or mainnet-beta
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1
   ```

3. **Build Settings**
   ```bash
   # Build Command
   npm run build

   # Output Directory
   .next

   # Install Command
   npm ci
   ```

### Alternative Deployment Options

#### Netlify
```bash
# Build settings
npm run build && npm run export

# Publish directory
out/
```

#### Docker Deployment
```dockerfile
# Use the official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

## Monitoring and Maintenance

### 1. Program Monitoring

```bash
# Monitor program logs
solana logs <PROGRAM_ID>

# Check program account
solana program show <PROGRAM_ID>

# Monitor account balances
solana balance <WALLET_ADDRESS>
```

### 2. Frontend Monitoring

- **Error Tracking**: Use Sentry or similar
- **Analytics**: Use Google Analytics or similar
- **Performance**: Use Vercel Analytics or similar
- **Uptime**: Use Pingdom or similar

### 3. Regular Maintenance

- **Dependencies**: Update regularly
- **Security**: Monitor for vulnerabilities
- **Performance**: Optimize based on usage
- **Backups**: Backup critical data and keys

## Troubleshooting

### Common Issues

#### Program Deployment Fails
```bash
# Check balance
solana balance

# Check program size
ls -la target/deploy/

# Increase compute units if needed
anchor deploy --program-id <PROGRAM_ID>
```

#### Frontend Build Fails
```bash
# Clear cache
rm -rf .next node_modules
npm install

# Check environment variables
echo $NEXT_PUBLIC_PROGRAM_ID

# Build with verbose output
npm run build --verbose
```

#### Wallet Connection Issues
- Ensure wallet is on correct network
- Check browser extensions
- Clear browser cache
- Try different wallet

### Support

For deployment issues:
1. Check GitHub Issues
2. Join Discord community
3. Review documentation
4. Contact development team

## Security Best Practices

### Key Management
- **Never commit private keys** to version control
- **Use hardware wallets** for mainnet deployments
- **Backup keys securely** with multiple copies
- **Use different keys** for different environments

### Access Control
- **Limit program authority** to trusted addresses
- **Implement multi-sig** for critical operations
- **Regular key rotation** for long-term security
- **Monitor for unauthorized access**

### Deployment Security
- **Deploy from secure environment**
- **Verify all dependencies**
- **Test on devnet first**
- **Have rollback plan ready**

## Cost Estimation

### Deployment Costs (Solana)
- **Program Deployment**: ~0.1-0.5 SOL
- **Account Creation**: ~0.001 SOL per account
- **Transaction Fees**: ~0.000005 SOL per transaction

### Operational Costs
- **RPC Calls**: ~$0.01-0.10 per 1000 calls
- **Frontend Hosting**: $0-20/month (depending on provider)
- **Domain and SSL**: $10-50/year

### Scaling Considerations
As usage grows, consider:
- Dedicated RPC providers
- CDN for global performance
- Database for complex queries
- Caching layers for efficiency
