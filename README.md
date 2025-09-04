# PrediktFi Protocol

An AI-first prediction studio with freemium quotas and shareable insights, built on Solana.

## 🎯 Current Status: E8 AI Prediction Studio

PrediktFi is now a comprehensive AI prediction analysis platform featuring:
- **AI Analysis Engine**: Technical indicators, sentiment analysis, and probability modeling
- **Freemium Quotas**: Free tier with upgrade options
- **Shareable Insights**: Export and share analysis results
- **Studio Interface**: Interactive prediction workspace
- **API Endpoints**: RESTful analysis APIs

## 🏗️ Project Structure

```
prediktfi-protocol/
├── app/                       # Next.js frontend application
│   ├── api/                   # API routes
│   │   ├── analysis/          # AI analysis endpoints
│   │   └── status/            # Health check endpoint
│   ├── studio/                # Main prediction studio UI
│   ├── components/            # React components
│   └── lib/                   # Utilities and helpers
├── src/                       # Analysis engine modules
│   ├── lib/
│   │   ├── analysis/          # Core analysis engine
│   │   ├── indicators/        # Technical indicators (RSI, SMA, EMA, ATR)
│   │   ├── data/             # Data sources and adapters
│   │   └── sentiment/        # Sentiment analysis
├── programs/                  # Solana/Anchor smart contracts
│   └── prediktfi-protocol/    # Core prediction protocol
├── tests/                     # Test suite
├── docs/                      # Documentation
│   └── prod_verification.md   # Production deployment guide
└── smoke-e8.sh               # E8 deployment verification
```

## 🚀 Quick Start

### Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Run tests:**
   ```bash
   # Unit tests
   npm run test
   
   # E8 smoke test
   npm run smoke:e8
   
   # Full QA suite
   npm run qa:all
   ```

### Smart Contract Development

1. **Build Anchor program:**
   ```bash
   anchor build
   ```

2. **Run smart contract tests:**
   ```bash
   anchor test
   ```

3. **Deploy to devnet:**
   ```bash
   anchor deploy --provider.cluster devnet
   ```

## 📊 Key Features

### AI Analysis Engine
- **Technical Indicators**: RSI, SMA, EMA, ATR, Support/Resistance, MA Cross
- **Sentiment Integration**: Fear & Greed Index
- **Probability Modeling**: Confidence intervals and scenario analysis
- **Performance Optimized**: Linear time O(n) algorithms

### Studio Interface
- Interactive analysis workspace at `/studio`
- Real-time probability calculations
- Exportable insight reports
- Progress tracking and results visualization

### API Endpoints
- `GET /api/status` - System health and build info
- `POST /api/analysis` - AI prediction analysis
- Comprehensive error handling and validation

## 🔧 Development Scripts

```bash
# Development
npm run dev          # Start Next.js dev server
npm run dev:safe     # Start without Turbo mode

# Testing
npm run test         # Unit tests with Vitest
npm run smoke:e8     # E8 deployment verification
npm run qa:all       # Full test suite

# Building
npm run build        # Build for production
npm run validate:build # Pre-build validation

# Linting & Formatting
npm run lint         # ESLint check
npm run typecheck    # TypeScript validation
```

## 📡 API Reference

### Health Check
```bash
GET /api/status
```
Returns system status, environment, and build information.

### Analysis Engine
```bash
POST /api/analysis
{
  "assetId": "bitcoin",
  "vsCurrency": "usd", 
  "horizon": "7d"
}
```
*Note: Currently returns 501 - Analysis engine in development*

### Studio Interface
Visit `/studio` for the interactive prediction workspace.

## 🚀 Production Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Set production branch to `main` or `release_e8`
3. Configure environment variables:
   ```
   NEXT_PUBLIC_APP_ENV=production
   NEXT_PUBLIC_COINBASE_API_KEY=your_key
   NEXT_PUBLIC_ANTHROPIC_API_KEY=your_key
   ```

### Deployment Verification
```bash
# Run smoke test against production
./smoke-e8.sh https://your-domain.com

# Check status endpoint
curl https://your-domain.com/api/status
```

### Emergency Rollback
```bash
# Deploy from stable tag
git checkout e8_stable
git push origin release_e8 --force

# Or promote previous deployment in Vercel dashboard
```

## 🛡️ Security & Compliance

- **Geofencing**: Norway blocked on mainnet routes
- **Rate Limiting**: API endpoints protected
- **Environment Isolation**: Dev/staging/production separation
- **Content Security Policy**: XSS protection enabled

## 📚 Documentation

- [`docs/prod_verification.md`](docs/prod_verification.md) - Production deployment checklist
- [`MIGRATION.md`](MIGRATION.md) - Legacy migration guide
- `smoke-e8.sh` - Automated deployment verification

## 🏷️ Stable Tags

- `e8_stable` - Latest verified E8 implementation
- `production_stable` - Last known good production deploy

## 🧪 Testing Strategy

**Unit Tests**: Core logic and utilities  
**Integration Tests**: API endpoints and database  
**E2E Tests**: Full user workflows  
**Smoke Tests**: Production deployment verification
   cp -r nextjs-boilerplate/* prediktfi-protocol/app/

## 🔧 Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) (for Solana development)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor Framework](https://book.anchor-lang.com/getting_started/installation.html)

## ⚙️ Configuration

### Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Required for production:
```env
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_COINBASE_API_KEY=your_coinbase_key
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_key
```

### Solana Configuration
Update `Anchor.toml` for different networks:
```toml
[provider]
cluster = "devnet"  # or "mainnet-beta"
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feat/your-feature`
3. Run tests: `npm run qa:all`
4. Commit changes: `git commit -m "feat: your feature"`
5. Push to branch: `git push origin feat/your-feature`
6. Submit pull request

### Code Quality
- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Comprehensive test coverage required
- Smoke tests must pass before deployment

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check `docs/` directory
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions

---

## 🗂️ Legacy Information

*The following sections contain information about older versions and migration paths.*
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
### Legacy Migration Information

For historical context, this repository previously supported a simpler prediction market system. Key migration information:

**Old System (V1)**:
- Simple betting with SOL transfers
- Basic market creation
- Minimal UI

**Current System (E8)**:
- AI-powered analysis engine
- Comprehensive studio interface
- Freemium quota system
- RESTful APIs

**Migration Path**:
If upgrading from V1, see [`MIGRATION.md`](MIGRATION.md) for detailed migration steps.

**Deprecated Environment Variables**:
```bash
# No longer needed in E8
NEXT_PUBLIC_PROTOCOL_TREASURY=<deprecated>
NEXT_PUBLIC_FEE_BPS=<deprecated>
NEXT_PUBLIC_MOCK_TX=<deprecated>
```

---

**🚀 Ready to build the future of AI-powered predictions!**

- Home → Select Wallet → connect your player wallet (ensure Devnet). If balance < 0.6 SOL, use Phantom Developer → Airdrop 1 SOL (or https://faucet.solana.com/).
- Go to Active Markets → open the first market (/market/1).
- Pick side YES → enter 0.5 SOL.
- Expect CTA text: "Place 0.5 SOL Bet • Fee 0.01 • Net 0.49".
- Click CTA → Sign in Phantom → Toast shows "Sending transaction…" then "Bet placed" + "View on Explorer".
- Explorer link should include ?cluster=devnet and show a System Program: Transfer to your configured treasury, amount ≈ 0.5 SOL, with SPL Memo JSON documenting the bet.
