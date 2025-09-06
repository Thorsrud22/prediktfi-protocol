# 🔮 PrediktFi Protocol

> Decentralized prediction markets on Solana with transparent, blockchain-verified outcomes.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solana](https://img.shields.io/badge/Solana-Network-purple)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-Framework-blue)](https://anchor-lang.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://typescriptlang.org)

## 🌟 Overview

PrediktFi Protocol is a next-generation prediction market platform built on Solana that enables users to:

- **Create prediction markets** on any future event
- **Place bets** with transparent on-chain verification  
- **Earn rewards** for accurate predictions
- **Build reputation** through consistent performance
- **Share predictions** with social proof receipts

### Key Features

- ✅ **Solana-native**: Fast, low-cost transactions
- ✅ **Transparent**: All predictions and outcomes on-chain
- ✅ **Fair payouts**: Proportional winnings distribution
- ✅ **Secure**: Comprehensive error handling and validation
- ✅ **User-friendly**: Intuitive web interface with wallet integration
- ✅ **Extensible**: Modular architecture for future enhancements

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rust (latest stable)
- Solana CLI v1.16.0+
- Anchor Framework v0.30.1+

### Installation

```bash
# Clone the repository
git clone https://github.com/Thorsrud22/prediktfi-protocol.git
cd prediktfi-protocol

# Install dependencies
npm install

# Start local Solana validator
solana-test-validator --reset

# Deploy smart contract
anchor build
anchor deploy

# Start frontend
npm run dev
```

Visit `http://localhost:3000` to start using the prediction markets!

## 📋 Project Status

### ✅ Phase 1: MVP - Complete

**Smart Contract Features:**
- [x] Protocol initialization and management
- [x] Market creation with customizable parameters
- [x] Binary prediction betting (YES/NO)
- [x] Automatic payout calculation and distribution
- [x] Comprehensive error handling
- [x] Event logging for indexing

**Frontend Features:**
- [x] Wallet integration (Phantom, Solflare)
- [x] Market creation interface
- [x] Real-time market display with odds
- [x] Betting interface with validation
- [x] Winnings claim functionality
- [x] Market resolution (for market creators)

**Development Infrastructure:**
- [x] Comprehensive test suite (Unit + Integration)
- [x] CI/CD pipeline with GitHub Actions
- [x] TypeScript type safety
- [x] ESLint and Prettier configuration
- [x] Automated deployment to devnet

### 🚧 Phase 2: Scaling & Enhancements (Planned)

- [ ] Multi-outcome markets (beyond YES/NO)
- [ ] Oracle integration for automated resolution
- [ ] Token-based betting (SPL tokens)
- [ ] Market categories and advanced filtering
- [ ] User reputation and leaderboards
- [ ] Social features and prediction sharing
- [ ] Mobile app development
- [ ] Mainnet deployment

## 🏗️ Architecture

### Smart Contract Structure

```
PrediktFi Protocol
├── Protocol State (Global settings)
├── Prediction Markets (Individual markets)
├── User Predictions (Individual bets)
└── Events (Comprehensive logging)
```

### Key Components

- **Protocol State**: Manages global settings and market count
- **Prediction Markets**: Contains market metadata, betting pools, and resolution status
- **User Predictions**: Tracks individual user bets and claim status
- **Payout System**: Proportional distribution of winnings to correct predictors

### Technology Stack

**Smart Contracts:**
- Rust + Anchor Framework
- Solana Program Library (SPL)
- Comprehensive error handling

**Frontend:**
- Next.js 15 + React 19
- TypeScript for type safety
- Tailwind CSS for styling
- Solana Wallet Adapter

**Development Tools:**
- Anchor for smart contract development
- Jest for unit testing
- Playwright for E2E testing
- GitHub Actions for CI/CD

## 📖 Documentation

- [Architecture Guide](./ARCHITECTURE.md) - Detailed technical architecture
- [Deployment Guide](./DEPLOYMENT.md) - Step-by-step deployment instructions
- [Testing Guide](./tests/README.md) - Testing strategies and examples
- [API Reference](./ARCHITECTURE.md#api-reference) - Smart contract API documentation

## 🧪 Testing

The project includes comprehensive testing at multiple levels:

```bash
# Run unit tests
npm run test:unit

# Run smart contract tests
npm run test:anchor

# Run E2E tests
npm run test:e2e:mock

# Run all tests
npm run test:all

# Check test coverage
npm run test:coverage
```

### Test Coverage

- **Smart Contracts**: 95%+ coverage including edge cases
- **Frontend**: Unit tests for critical components
- **Integration**: End-to-end user workflows
- **Security**: Comprehensive error condition testing

## 🔧 Development

### Local Development Setup

1. **Start Solana Test Validator**
   ```bash
   solana-test-validator --reset
   ```

2. **Configure Solana CLI**
   ```bash
   solana config set --url localhost
   solana-keygen new --outfile ~/.config/solana/id.json
   ```

3. **Deploy Smart Contract**
   ```bash
   anchor build
   anchor deploy
   ```

4. **Start Frontend**
   ```bash
   npm run dev
   ```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test:all     # Run all tests
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run typecheck    # TypeScript type checking
```

## 🌐 Deployment

### Devnet Deployment

```bash
# Configure for devnet
solana config set --url devnet

# Deploy smart contract
anchor deploy --provider.cluster devnet

# Deploy frontend to Vercel
vercel --prod
```

### Mainnet Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed mainnet deployment instructions.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards

- TypeScript for type safety
- ESLint + Prettier for code formatting
- Comprehensive test coverage
- Clear commit messages
- Documentation for new features

## 📊 Usage Examples

### Creating a Prediction Market

```typescript
await program.methods
  .createPredictionMarket(
    "btc-100k-2024",
    "Will Bitcoin reach $100,000 by end of 2024?",
    new BN(Math.floor(new Date('2024-12-31').getTime() / 1000)),
    new BN(0.1 * LAMPORTS_PER_SOL) // 0.1 SOL minimum bet
  )
  .accounts({
    market: marketPda,
    protocolState: protocolStatePda,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Placing a Prediction

```typescript
await program.methods
  .placePrediction(
    new BN(0.5 * LAMPORTS_PER_SOL), // 0.5 SOL bet
    true // YES prediction
  )
  .accounts({
    market: marketPda,
    userPrediction: userPredictionPda,
    user: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Claiming Winnings

```typescript
await program.methods
  .claimWinnings()
  .accounts({
    market: marketPda,
    userPrediction: userPredictionPda,
    user: wallet.publicKey,
  })
  .rpc();
```

## 🔒 Security

### Security Features

- **Input Validation**: All parameters validated on-chain
- **Access Control**: Market resolution restricted to creators
- **Safe Math**: Overflow protection in all calculations
- **State Management**: Immutable outcomes once resolved
- **Error Handling**: Comprehensive error codes and messages

### Audit Status

- [ ] Internal security review completed
- [ ] External security audit (planned for mainnet)
- [ ] Bug bounty program (planned)

## 📈 Roadmap

### Q1 2024
- [x] MVP smart contract development
- [x] Basic frontend interface
- [x] Devnet deployment
- [x] Comprehensive testing suite

### Q2 2024
- [ ] Multi-outcome markets
- [ ] Oracle integration
- [ ] Mobile responsive design
- [ ] User reputation system

### Q3 2024
- [ ] Token-based betting
- [ ] Advanced market features
- [ ] Social prediction sharing
- [ ] Security audit

### Q4 2024
- [ ] Mainnet deployment
- [ ] Mobile app
- [ ] Partnership integrations
- [ ] Advanced analytics

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Solana Foundation](https://solana.org) for the high-performance blockchain
- [Anchor](https://anchor-lang.com) for the excellent smart contract framework
- [Vercel](https://vercel.com) for frontend hosting
- The Solana developer community for tools and resources

## 📞 Support

- **Documentation**: Check our comprehensive docs
- **GitHub Issues**: Report bugs or request features
- **Discord**: Join our community (link coming soon)
- **Email**: contact@prediktfi.com

---

**Built with ❤️ on Solana**
