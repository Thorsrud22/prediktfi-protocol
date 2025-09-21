# 🔮 PrediktFi Protocol

**AI-Powered Prediction Markets on Solana Blockchain**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-Web3.js-purple)](https://solana.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-cyan)](https://tailwindcss.com/)
[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-green)](https://predikt.fi)

> Transform insights into immutable blockchain predictions with AI-powered analysis and comprehensive creator scoring systems.

---

## 🎯 **What is PrediktFi?**

PrediktFi is a next-generation prediction platform that combines artificial intelligence with blockchain technology to create transparent, tamper-proof forecasting markets. Users can generate AI-powered insights, log predictions on-chain, and build verifiable track records through our comprehensive scoring system.

### 🚀 **Key Features**

- **🤖 AI Studio**: Generate predictions using advanced AI models
- **⛓️ Blockchain Proof**: Immutable on-chain commitment with Solana
- **📊 Creator Scoring**: Comprehensive Brier score-based ranking system
- **🎯 Resolution Engine**: Automated outcome verification with multiple resolvers
- **👑 Pro Features**: Enhanced quotas and premium functionality
- **� Analytics**: Deep insights into prediction performance and trends
- **�️ Anti-Gaming**: Advanced measures to ensure fair competition

---

## 🏗️ **Architecture Overview**

```
PrediktFi Protocol
├── Frontend (Next.js 15.5.2 + App Router)
│   ├── AI Studio (/studio)           # Prediction generation interface
│   ├── Feed (/feed)                  # Community predictions
│   ├── Leaderboard (/leaderboard)    # Creator rankings
│   ├── Creator Profiles (/creator/[id]) # Performance analytics
│   └── Admin Dashboard (/admin)      # System management
│
├── API Layer (REST + Server Actions)
│   ├── /api/ai/predict              # AI prediction generation
│   ├── /api/insight                 # CRUD operations
│   ├── /api/insight/commit          # Blockchain commitment
│   ├── /api/leaderboard             # Rankings with caching
│   ├── /api/creator/[id]            # Creator analytics
│   └── /api/admin/*                 # Administrative endpoints
│
├── Database (Prisma + SQLite/PostgreSQL)
│   ├── Insights & Predictions
│   ├── Creator Profiles & Scoring
│   ├── Events & Analytics
│   └── Anti-Gaming & Rate Limiting
│
├── Blockchain Integration (Solana)
│   ├── On-chain Commitment
│   ├── SPL Memo Proofs
│   └── Transaction Verification
│
└── Background Services
    ├── Scoring Engine (Brier calculation)
    ├── Resolution System (Price/URL/Text)
    ├── Creator Analytics Rollup
    └── Anti-Gaming Detection
```

---

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/Thorsrud22/prediktfi-protocol.git
cd prediktfi-protocol

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Initialize database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

### First Steps

1. **Visit Studio**: http://localhost:3000/studio
2. **Generate Prediction**: Ask AI about any topic
3. **View Feed**: Browse community predictions at /feed
4. **Check Leaderboard**: See top creators at /leaderboard

---

## 📊 **Feature Completion Status**

| Feature Block | Status | Description |
|---------------|--------|-------------|
| **E1** - Page Structure | ✅ Complete | Foundation pages, navigation, theming |
| **E2** - Payment Flow | ✅ Complete | Coinbase Commerce, Pro licensing |
| **E3** - Account System | ✅ Complete | User management, legal pages |
| **E4** - Beta Hardening | ✅ Complete | Security, Pro bypass, production prep |
| **E5** - Production Launch | ✅ Complete | Health checks, deployment infrastructure |
| **Block 3** - Proof Agent | ✅ Complete | Blockchain commitment, verification |
| **Block 4** - UI Updates | ✅ Complete | Enhanced UX, responsive design |
| **Block 5** - Resolution | ✅ Complete | Automated outcome verification |
| **Block 6** - Resolvers | ✅ Complete | Price, URL, text resolution systems |
| **Block 7** - Scoring | ✅ Complete | Brier scores, calibration, leaderboards |
| **Block 8** - Admin Dashboard | ✅ Complete | Metrics, monitoring, management |
| **Block 9** - Production SLOs | ✅ Complete | Performance targets, reliability |

### 🎉 **Recent Major Implementations**

#### **Creator Economy System** (September 2025)
- **Comprehensive Scoring**: Brier score-based creator rankings
- **Performance Analytics**: 90-day trending with calibration metrics
- **Anti-Gaming Measures**: Advanced detection and prevention
- **Admin Dashboard**: Real-time metrics and violation monitoring

#### **Production Infrastructure** 
- **Security Hardening**: Rate limiting, CORS, security headers
- **Performance Optimization**: Sub-300ms API responses, ETag caching
- **Health Monitoring**: Comprehensive status endpoints
- **Deployment Ready**: Vercel configuration, environment management

---

## 🔧 **Development Commands**

```bash
# Development
npm run dev              # Start development server
npm run dev:turbo        # Use Turbopack for faster builds
npm run dev -- --port 3001  # Custom port

# Building
npm run build            # Production build
npm run start            # Start production server

# Database
npx prisma studio        # Database browser
npx prisma generate      # Regenerate client
npx prisma db push       # Push schema changes
npx prisma migrate dev   # Create new migration

# Testing
npm run test             # Unit tests (Vitest)
npm run test:e2e         # End-to-end tests (Playwright)
npm run typecheck        # TypeScript validation
npm run qa:all           # Complete quality assurance

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix issues
npm run format           # Prettier formatting

# Scripts
npm run recompute-scores # Recalculate creator scores
npm run demo-scoring     # Generate demo data
npm run test-advisor     # Advisor system validation
```

---

## 🌐 **API Reference**

### Core Endpoints

#### **Predictions**
```bash
# Create prediction
POST /api/insight
Content-Type: application/json
{
  "rawText": "Will Bitcoin reach $100k by end of 2024?",
  "p": 0.75,
  "deadline": "2024-12-31T23:59:59Z",
  "resolverKind": "price",
  "resolverRef": "BTC-USD"
}

# Commit to blockchain
POST /api/insight/commit
{
  "id": "insight_id",
  "signature": "solana_tx_signature"
}

# Get insight
GET /api/insight?id=insight_id
```

#### **Analytics & Leaderboards**
```bash
# Get leaderboard
GET /api/leaderboard?period=90d&limit=50

# Creator profile
GET /api/creator/[creatorId]

# Admin metrics
GET /api/admin/metrics?period=30d&resolver=price
```

#### **AI Integration**
```bash
# Generate AI prediction
POST /api/ai/predict
{
  "topic": "Technology", 
  "question": "Will AI achieve AGI by 2030?",
  "horizon": "6 years"
}
```

### Health & Status
```bash
# System health
GET /api/_internal/health

# Detailed status
GET /status

# API performance
HEAD /api/leaderboard  # Fast health check
```

---

## 📊 **Database Schema**

### Core Tables

```prisma
model Insight {
  id            String   @id @default(cuid())
  question      String
  canonical     String?  // Normalized text
  p             Float?   // Probability (0-1)
  deadline      DateTime?
  resolverKind  String?  // 'price' | 'url' | 'text'
  resolverRef   String?  // Reference for resolution
  status        String   @default("OPEN") // OPEN|COMMITTED|RESOLVED
  outcome       String?  // YES|NO|INVALID
  
  // Blockchain proof
  memoSig       String?  // Solana transaction signature
  slot          BigInt?  // Blockchain slot number
  
  // Relations
  creator       Creator  @relation(fields: [creatorId], references: [id])
  creatorId     String
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Creator {
  id              String    @id @default(cuid())
  handle          String    @unique
  
  // Scoring metrics
  brierMean       Float?    // Average Brier score
  accuracy        Float?    // Percentage correct
  calibration     String?   // JSON calibration data
  volume30d       Float?    // 30-day prediction volume
  lastScoreUpdate DateTime?
  
  insights        Insight[]
  createdAt       DateTime  @default(now())
  
  @@index([lastScoreUpdate])
}

model CreatorDaily {
  id                String   @id @default(cuid())
  creatorId         String
  date              DateTime @db.Date
  
  // Daily metrics
  predictionsCount  Int      @default(0)
  notionalVolume    Float    @default(0)
  averageBrier      Float?
  correctPredictions Int     @default(0)
  
  creator           Creator  @relation(fields: [creatorId], references: [id])
  
  @@unique([creatorId, date])
  @@index([date])
}
```

---

## 🛡️ **Security & Performance**

### Security Features
- **Rate Limiting**: 50 requests/hour for free users, bypass for Pro
- **Input Validation**: Zod schemas on all API endpoints  
- **Anti-Gaming**: Advanced spam detection and violation tracking
- **CORS Protection**: Domain-specific headers and restrictions
- **Content Security Policy**: XSS protection and secure resource loading
- **Idempotency**: Duplicate request prevention with 24h TTL

### Performance Targets (SLOs)
- **API Response Time**: P95 < 300ms ✅
- **Page Load Time**: LCP < 1.5s ✅  
- **Database Queries**: < 100ms average ✅
- **Uptime**: 99.9% availability target ✅
- **Cache Hit Rate**: > 80% for frequently accessed data ✅

### Monitoring & Health
```bash
# Health endpoints
curl https://predikt.fi/api/_internal/health  # JSON health status
curl https://predikt.fi/status               # Human-readable status

# Performance monitoring
curl -I https://predikt.fi/api/leaderboard   # Check ETag caching
```

---

## 🎯 **Creator Scoring System**

### Brier Score Calculation
The platform uses the **Brier Score** for objective performance measurement:

```
Brier Score = (p - outcome)²
Creator Score = 1 - Average Brier Score

Where:
- p = predicted probability (0-1)
- outcome = actual result (0 or 1)
- Lower Brier scores = better performance
```

### Scoring Components
1. **Accuracy (45% weight)**: `1 - Brier_Mean`
2. **Consistency (25% weight)**: `1 / (1 + Return_Std_30d)`  
3. **Volume (20% weight)**: `log(1 + Notional_30d) / log(1 + VOL_NORM)`
4. **Recency (10% weight)**: `Σ(Weight_i × Accuracy_i)` with exponential decay

### Score Interpretation
- **🏆 Excellent (0.8-1.0)**: Top-tier prediction accuracy
- **🥈 Good (0.6-0.8)**: Above-average performance  
- **🥉 Fair (0.4-0.6)**: Developing predictor
- **📈 Needs Improvement (<0.4)**: Room for growth

---

## � **Pro Features**

### Freemium Model
- **Free Tier**: 10 AI predictions per day
- **Pro Tier**: 100 predictions per day + priority support
- **Rate Limit Bypass**: Pro users skip API throttling

### Pro Activation
```bash
# Redeem license code
POST /api/billing/redeem
{
  "licenseCode": "PREDIKT-PRO-XXXXX"
}

# Check Pro status
GET /api/account
```

### Payment Integration
- **Coinbase Commerce**: Secure cryptocurrency payments
- **License System**: Cryptographically signed activation codes
- **Auto-Renewal**: Subscription management (coming soon)

---

## 🔄 **Resolution System**

### Resolver Types

#### **Price Resolver**
```json
{
  "resolverKind": "price",
  "resolverRef": "BTC-USD",
  "question": "Will Bitcoin be above $50,000 on Dec 31?"
}
```

#### **URL Resolver** 
```json
{
  "resolverKind": "url",
  "resolverRef": "https://example.com/api/status",
  "question": "Will the API return success status?"
}
```

#### **Text Resolver**
```json
{
  "resolverKind": "text", 
  "resolverRef": "manual",
  "question": "Will the election results be announced?"
}
```

### Resolution Process
1. **Deadline Reached**: System identifies expired predictions
2. **Data Retrieval**: Fetches outcome from specified resolver
3. **Outcome Determination**: YES/NO/INVALID based on criteria
4. **Score Update**: Recalculates creator metrics
5. **Event Logging**: Records resolution for audit trail

---

## 🧪 **Testing Strategy**

### Test Categories

```bash
# Unit Tests (Vitest)
tests/unit/
├── score.test.ts              # Scoring algorithm tests
├── anti-gaming.test.ts        # Gaming detection tests
├── metrics-aggregations.test.ts # Analytics tests
└── resolution.test.ts         # Resolution logic tests

# Integration Tests
tests/integration/
├── api-workflow.test.ts       # End-to-end API flows
├── blockchain-commit.test.ts  # Solana integration tests
└── payment-flow.test.ts       # Billing system tests

# E2E Tests (Playwright)
tests-e2e/
├── studio-workflow.spec.ts    # AI Studio user journey
├── leaderboard.spec.ts        # Ranking system tests
└── mobile-responsive.spec.ts  # Mobile experience tests
```

### Quality Gates
- **Unit Test Coverage**: >90% required
- **Integration Tests**: Critical paths covered
- **E2E Tests**: User workflows validated
- **TypeScript**: Strict mode, zero errors
- **Lighthouse Score**: 90+ for performance

---

## 🚀 **Deployment**

### Environment Variables

```bash
# Core Configuration
NEXT_PUBLIC_SITE_URL=https://predikt.fi
NEXT_PUBLIC_APP_ENV=production
DATABASE_URL=postgresql://...

# Pro Features
PREDIKT_LICENSE_SECRET=your_32_char_secret
NEXT_PUBLIC_PRO_BYPASS_ENABLED=true

# Payment Integration  
COINBASE_COMMERCE_API_KEY=prod_api_key
COINBASE_COMMERCE_SHARED_SECRET=webhook_secret

# Security
PREDIKT_COOKIE_DOMAIN=predikt.fi
WEBHOOK_IDEMPOTENCY_SECRET=webhook_secret_32_chars
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Optional
ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ADMIN=true
ADMIN_USER=admin
ADMIN_PASS=secure_password
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to staging
vercel --target staging

# Deploy to production
vercel --prod

# Set environment variables
vercel env add PREDIKT_LICENSE_SECRET production
```

### Database Migration

```bash
# Production deployment
npx prisma migrate deploy    # Apply migrations
npx prisma generate         # Generate client

# Health check after deployment
curl https://predikt.fi/api/_internal/health
```

---

## 📈 **Analytics & Monitoring**

### Built-in Analytics
- **User Behavior**: Prediction patterns, accuracy trends
- **System Performance**: API response times, error rates
- **Creator Metrics**: Scoring evolution, calibration analysis
- **Anti-Gaming**: Violation detection, pattern analysis

### Admin Dashboard
Access comprehensive metrics at `/admin-dashboard/metrics`:

- **Volume Charts**: Daily prediction volume with trends
- **Resolution Analytics**: Outcome distribution by resolver type  
- **Top Creators**: Leaderboard with performance metrics
- **System Health**: API performance and error monitoring

### Event Tracking
```typescript
// Custom analytics events
createEvent(EVENT_TYPES.INSIGHT_CREATED, {
  creatorId: creator.id,
  resolverKind: 'price',
  timeToCommit: commitTime - createTime
});

createEvent(EVENT_TYPES.SYSTEM_WARNING, {
  type: 'high_api_latency',
  responseTime: 450,
  endpoint: '/api/leaderboard'
});
```

---

## 🔧 **Advanced Configuration**

### Performance Tuning

```javascript
// next.config.js performance optimizations
module.exports = {
  webpack: (config) => ({
    ...config,
    optimization: {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          }
        }
      }
    }
  }),
  
  // Security headers
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
      ]
    }
  ]
};
```

### Custom Scoring Weights

```typescript
// lib/score.ts - Adjust scoring algorithm
const SCORE_WEIGHTS = {
  accuracy: 0.45,    // Brier score performance
  consistency: 0.25, // Prediction consistency
  volume: 0.20,      // Activity level
  recency: 0.10      // Recent performance bias
};

const VOL_NORM = process.env.CREATOR_VOL_NORM || 50000;
```

---

## 🤝 **Contributing**

### Development Workflow

1. **Fork & Clone**
   ```bash
   git clone https://github.com/yourusername/prediktfi-protocol.git
   cd prediktfi-protocol
   ```

2. **Setup Development**
   ```bash
   npm install
   cp .env.example .env.local
   npx prisma db push
   npm run dev
   ```

3. **Create Feature Branch**
   ```bash
   git checkout -b feat/amazing-feature
   ```

4. **Make Changes & Test**
   ```bash
   npm run test           # Unit tests
   npm run typecheck      # TypeScript validation  
   npm run lint           # Code quality
   npm run qa:all         # Full quality check
   ```

5. **Commit & Push**
   ```bash
   git commit -m "feat: add amazing feature"
   git push origin feat/amazing-feature
   ```

6. **Create Pull Request**

### Code Standards
- **TypeScript**: Strict mode, comprehensive type coverage
- **Testing**: Unit tests for business logic, E2E for user flows
- **Documentation**: JSDoc comments for public APIs
- **Conventional Commits**: Semantic commit messages
- **Performance**: Lighthouse score >90, API <300ms P95

### Project Structure
```
prediktfi-protocol/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── lib/               # Utility libraries
│   └── styles/            # Global styles
├── tests/                 # Test suites
├── docs/                  # Documentation
├── scripts/               # Automation scripts
├── prisma/                # Database schema
└── public/                # Static assets
```

---

## 📋 **Troubleshooting**

### Common Issues

#### **Database Connection Errors**
```bash
# Reset database
npx prisma db push --force-reset
npx prisma generate

# Check connection
npx prisma studio
```

#### **Build Errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check TypeScript
npm run typecheck
```

#### **Performance Issues**
```bash
# Profile development build
npm run dev:profile

# Analyze bundle size
npm run analyze

# Check health endpoints
curl http://localhost:3000/api/_internal/health
```

#### **API Rate Limiting**
```bash
# Check rate limit status
curl -I http://localhost:3000/api/insight

# Pro user bypass (in .env.local)
NEXT_PUBLIC_PRO_BYPASS_ENABLED=true
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=predikt:* npm run dev

# Database query logging
DATABASE_LOGGING=true npm run dev

# Verbose error messages
NODE_ENV=development npm run dev
```

---

## 📚 **Documentation**

### Available Guides
- **[API Documentation](docs/API.md)** - Complete API reference
- **[Database Schema](docs/db.md)** - Data model and migrations
- **[Deployment Guide](docs/LAUNCH_CHECKLIST.md)** - Production deployment
- **[Admin Guide](docs/ADVISOR.md)** - Administrative features
- **[Analytics Setup](docs/OPS_WEEKLY_DIGEST.md)** - Monitoring configuration

### Architecture Documents
- **[Project Summary](PROJECT_SUMMARY.md)** - Comprehensive overview
- **[Performance Optimization](PERFORMANCE_OPTIMIZATION.md)** - Speed improvements
- **[Security Architecture](PRODUCTION_INFRASTRUCTURE.md)** - Security measures
- **[Scoring System](BLOKK_7_SCORING_SYSTEM.md)** - Creator ranking algorithm

---

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

**Built with ❤️ by the PrediktFi team**

---

## 🌟 **What's Next?**

### Immediate Roadmap
- **🎯 Mainnet Launch**: Production deployment on Solana mainnet
- **📱 Mobile App**: Native iOS/Android applications
- **🤖 Advanced AI**: GPT-4 integration with domain-specific models
- **🏆 Tournaments**: Competitive prediction leagues
- **💰 Token Economy**: Native token for staking and rewards

### Long-term Vision
- **🌐 Multi-Chain**: Ethereum, Polygon, Arbitrum support
- **🔮 Oracle Integration**: Chainlink, Band Protocol data feeds
- **📊 Institutional**: API for institutional prediction markets
- **🎓 Education**: Academic research partnerships
- **🌍 Global**: Multi-language, regional market support

---

**🚀 Ready to shape the future of predictions?**

Visit [https://predikt.fi](https://predikt.fi) and start building your track record today!

**Questions?** Open an issue or join our [Discord community](https://discord.gg/prediktfi).

````

## 📚 Documentation

- **API Docs**: See API Reference section above
- **Component Docs**: Inline JSDoc comments in components
- **Architecture**: See Project Architecture section
- **Deployment**: See Deployment section for production setup

## � License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support & Community

- **Issues**: [GitHub Issues](https://github.com/Thorsrud22/prediktfi-protocol/issues) for bug reports
- **Discussions**: [GitHub Discussions](https://github.com/Thorsrud22/prediktfi-protocol/discussions) for questions
- **Documentation**: Check the `docs/` directory for additional guides

---

**🎯 Ready to explore the future of AI-powered predictions?**

Visit `/studio` and start generating insights on any topic that interests you!

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
