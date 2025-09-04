# PrediktFi Protocol

🎯 **AI-Powered Prediction Studio** - Generate insights on any topic using advanced AI analysis with built-in rate limiting and freemium quotas.

## ✨ What is PrediktFi?

PrediktFi is an intelligent prediction platform that helps you analyze and forecast outcomes across various topics. Whether you're looking at political events, market trends, or social phenomena, our AI Studio provides data-driven probability assessments with clear reasoning.

### Key Features
- **🤖 AI Studio**: Interactive workspace for generating predictions on any topic
- **📊 Smart Analysis**: Advanced probability modeling with confidence intervals  
- **⚡ Real-time Results**: Instant predictions with detailed explanations
- **🎁 Freemium Model**: Free tier with daily quotas, Pro plans for unlimited access
- **🔒 Rate Limited**: Intelligent throttling to ensure fair usage
- **📱 Modern UI**: Clean, responsive interface built with Next.js and Tailwind

## 🏗️ Project Architecture

```
prediktfi-protocol/
├── app/                       # Next.js 15.5.2 Application
│   ├── studio/               # 🎯 Main AI Studio Interface
│   │   └── page.tsx          # Interactive prediction workspace
│   ├── api/                  # RESTful API Endpoints
│   │   ├── ai/predict/       # Core prediction engine
│   │   ├── analytics/        # Usage tracking
│   │   └── status/           # Health monitoring
│   ├── components/           # React UI Components
│   │   ├── Navbar.tsx        # Navigation with brand theming
│   │   ├── Hero.tsx          # Landing page hero
│   │   └── ui/               # Reusable UI elements
│   ├── lib/                  # Core Libraries
│   │   ├── ai/               # AI prediction kernel
│   │   │   ├── kernel.ts     # Main prediction logic
│   │   │   └── adapters/     # Mock & baseline adapters
│   │   ├── rate.ts           # Rate limiting system
│   │   ├── plan.ts           # Freemium plan management
│   │   └── analytics.ts      # Usage analytics
│   └── globals.css           # Global styles + wallet extension fixes
├── tests/                    # Comprehensive Test Suite
│   ├── *.test.ts            # Unit tests for all components
│   └── tests-e2e/           # End-to-end testing
├── docs/                     # Documentation
└── scripts/                  # Deployment & verification scripts
```

## 🚀 Quick Start

### 1. Development Setup

```bash
# Clone and setup
git clone https://github.com/Thorsrud22/prediktfi-protocol.git
cd prediktfi-protocol
npm install

# Start development server
npm run dev

# Visit AI Studio
open http://localhost:3000/studio
```

### 2. Using AI Studio

1. **Navigate to Studio**: Visit `/studio` to access the prediction workspace
2. **Enter Your Question**: Describe what you want to predict (e.g., "Will FRP win the election?")
3. **Select Category**: Choose from Politics, Technology, Finance, Sports, etc.
4. **Set Time Horizon**: Pick timeframe (24 hours, 1 week, 1 month, etc.)
5. **Get AI Analysis**: Receive probability assessment with detailed reasoning
6. **Share Results**: Export insights for further discussion or analysis

### 3. API Usage

```bash
# Generate a prediction
curl -X POST http://localhost:3000/api/ai/predict \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Politics",
    "question": "Will renewable energy adoption increase this year?",
    "horizon": "12 months"
  }'

# Check system status
curl http://localhost:3000/api/status
```

## 🧠 AI Prediction Engine

### How It Works

1. **Input Processing**: Analyzes your question and context
2. **Probability Modeling**: Uses sophisticated algorithms to assess likelihood
3. **Reasoning Generation**: Provides clear explanations for predictions  
4. **Confidence Scoring**: Indicates reliability of the prediction
5. **Scenario Mapping**: Considers multiple potential outcomes

### Supported Topics
- **Politics**: Elections, policy changes, political events
- **Technology**: Product launches, adoption rates, market trends
- **Finance**: Market movements, economic indicators
- **Sports**: Game outcomes, season predictions
- **Society**: Social trends, demographic shifts
- **Environment**: Climate events, policy impacts

### Rate Limiting & Plans

**Free Tier**:
- ✅ 50 predictions per day
- ✅ Basic AI analysis
- ✅ All prediction categories
- ⏱️ 6-second rate limiting

**Pro Plan** (Coming Soon):
- ✅ Unlimited predictions
- ✅ Advanced AI models
- ✅ Priority processing
- ✅ Export capabilities
- ✅ API access

## 🔧 Development & Testing

```bash
# Development
npm run dev              # Start Next.js development server  
npm run dev -- --port 3002  # Start on custom port

# Testing
npm run test             # Unit tests with Vitest
npm run test:e2e:mock    # End-to-end tests with Playwright
npm run typecheck        # TypeScript validation

# Building
npm run build            # Production build
npm run start            # Start production server

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix linting issues
```

### Environment Variables

Create `.env.local` for development:

```bash
# Optional: Override default settings
NEXT_PUBLIC_APP_ENV=development
ENABLE_ANALYTICS=true

# Production only
NEXT_PUBLIC_ENABLE_ADMIN=1
ADMIN_USER=your_admin_username
ADMIN_PASS=your_admin_password
```

## 📡 API Reference

### Core Endpoints

#### Prediction Generation
```http
POST /api/ai/predict
Content-Type: application/json

{
  "topic": "Politics",
  "question": "Will the new climate policy pass?", 
  "horizon": "3 months",
  "context": "Optional additional context"
}
```

**Response:**
```json
{
  "prob": 0.72,
  "drivers": ["Public support", "Political climate", "Economic factors"],
  "rationale": "Analysis suggests high likelihood based on current trends.",
  "model": "mock-v0",
  "scenarioId": "climate-policy-pass-3-months", 
  "ts": "2025-09-04T19:23:45.123Z"
}
```

#### System Status
```http
GET /api/status
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-09-04T19:23:45.123Z",
  "environment": "development",
  "features": ["ai_studio", "rate_limiting", "analytics"]
}
```

#### Analytics (Internal)
```http  
POST /api/analytics
```

Used internally for tracking usage patterns and system performance.

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**:
   - Import your GitHub repository to Vercel
   - Select `main` branch for production
   - Vercel auto-detects Next.js configuration

2. **Environment Variables**:
   ```bash
   NEXT_PUBLIC_APP_ENV=production
   ENABLE_ANALYTICS=true
   ```

3. **Custom Domain** (Optional):
   - Add your domain in Vercel dashboard
   - Configure DNS settings
   - SSL certificates are handled automatically

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm run start

# Deploy to your hosting provider
# (Copy .next folder and package.json)
```

### Health Monitoring

```bash
# Verify deployment
curl https://your-domain.com/api/status

# Test AI prediction endpoint
curl -X POST https://your-domain.com/api/ai/predict \
  -H "Content-Type: application/json" \
  -d '{"topic": "Technology", "question": "Test question", "horizon": "1 week"}'
```

## 🛡️ Security & Performance

### Security Features
- **Rate Limiting**: Intelligent throttling prevents abuse
- **Input Validation**: All API inputs are sanitized and validated
- **Error Handling**: Graceful error responses without information leakage
- **Content Security**: XSS protection and secure headers
- **Environment Isolation**: Separate configs for dev/staging/production

### Performance Optimizations
- **Turbopack**: Fast development builds with Next.js 15.5.2
- **Efficient Caching**: Smart caching strategies for predictions
- **Memory Management**: Optimized Node.js memory allocation (8GB limit)
- **Code Splitting**: Automatic bundle optimization
- **Image Optimization**: Next.js built-in image handling

## 🤝 Contributing

### Getting Started
1. Fork the repository on GitHub
2. Clone your fork: `git clone https://github.com/yourusername/prediktfi-protocol.git`
3. Create a feature branch: `git checkout -b feat/amazing-feature`
4. Make your changes and add tests
5. Run the test suite: `npm run test`
6. Commit with clear messages: `git commit -m "feat: add amazing feature"`
7. Push to your branch: `git push origin feat/amazing-feature`
8. Open a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled, full type coverage required
- **Testing**: Unit tests for new features, maintain >80% coverage  
- **Linting**: ESLint + Prettier for consistent formatting
- **Documentation**: Update README and inline docs for new features

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
