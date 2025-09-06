# PrediktFi Protocol - Architecture Documentation

## Overview

PrediktFi Protocol is a decentralized prediction market platform built on Solana that allows users to create, participate in, and resolve prediction markets with transparent, blockchain-verified outcomes.

## Architecture Components

### 1. Smart Contract Layer (Anchor/Rust)
- **Protocol State**: Manages global protocol settings and statistics
- **Prediction Markets**: Individual markets with betting pools and resolution logic
- **User Predictions**: Individual user bets with claim tracking
- **Events**: Comprehensive event logging for indexing and monitoring

### 2. Frontend Layer (Next.js/React)
- **Wallet Integration**: Solana wallet adapter for user authentication
- **Market Interface**: Create, view, and interact with prediction markets
- **Real-time Updates**: Live market data and user interactions
- **Responsive Design**: Mobile-first, accessible interface

### 3. Infrastructure Layer
- **CI/CD Pipeline**: Automated testing, building, and deployment
- **Development Tools**: Linting, formatting, type checking
- **Testing Suite**: Unit tests, integration tests, and E2E tests

## Smart Contract Architecture

### Program Structure

```rust
// Core program with 5 main instructions:
pub mod prediktfi_protocol {
    // Protocol management
    pub fn initialize()                    // Initialize protocol state
    
    // Market operations
    pub fn create_prediction_market()      // Create new prediction market
    pub fn place_prediction()             // Place bet on market outcome
    pub fn resolve_market()               // Resolve market with outcome
    pub fn claim_winnings()               // Claim winnings for winning predictions
}
```

### Account Structure

#### Protocol State
```rust
pub struct ProtocolState {
    pub authority: Pubkey,        // Protocol admin
    pub total_markets: u64,       // Total markets created
    pub is_paused: bool,          // Emergency pause mechanism
}
```

#### Prediction Market
```rust
pub struct PredictionMarket {
    pub id: String,               // Unique market identifier
    pub description: String,      // Market description
    pub end_timestamp: i64,       // Market expiration time
    pub created_timestamp: i64,   // Creation time
    pub resolved_timestamp: Option<i64>, // Resolution time
    pub min_bet_amount: u64,      // Minimum bet amount in lamports
    pub is_resolved: bool,        // Resolution status
    pub outcome: Option<bool>,    // Market outcome (true=YES, false=NO)
    pub total_yes_amount: u64,    // Total bets on YES
    pub total_no_amount: u64,     // Total bets on NO
    pub total_participants: u64,  // Number of participants
    pub authority: Pubkey,        // Market creator/resolver
}
```

#### User Prediction
```rust
pub struct UserPrediction {
    pub market: Pubkey,           // Market this prediction belongs to
    pub user: Pubkey,             // User who made the prediction
    pub amount: u64,              // Bet amount in lamports
    pub prediction: bool,         // User's prediction (true=YES, false=NO)
    pub timestamp: i64,           // When prediction was made
    pub claimed: bool,            // Whether winnings have been claimed
    pub winnings: u64,            // Calculated winnings amount
}
```

### Program Derived Addresses (PDAs)

The protocol uses PDAs for deterministic account addressing:

```rust
// Protocol state PDA
seeds = [b"protocol"]

// Market PDA
seeds = [b"market", market_id.as_bytes()]

// User prediction PDA
seeds = [b"prediction", market.key().as_ref(), user.key().as_ref()]
```

## Event System

The protocol emits events for all major operations to enable indexing and monitoring:

- `ProtocolInitialized`: When protocol is first initialized
- `MarketCreated`: When a new market is created
- `PredictionPlaced`: When a user places a bet
- `MarketResolved`: When a market outcome is determined
- `WinningsClaimed`: When a user claims their winnings

## Error Handling

Comprehensive error handling with custom error codes:

```rust
#[error_code]
pub enum ErrorCode {
    MarketAlreadyResolved,     // 6000
    MarketExpired,             // 6001
    MarketNotExpired,          // 6002
    MarketNotResolved,         // 6003
    ProtocolPaused,            // 6004
    MarketIdTooLong,           // 6005
    DescriptionTooLong,        // 6006
    InvalidMinBetAmount,       // 6007
    InvalidEndTime,            // 6008
    BetAmountTooLow,           // 6009
    UserAlreadyPredicted,      // 6010
    AlreadyClaimed,            // 6011
    UserLost,                  // 6012
    MathOverflow,              // 6013
}
```

## Security Features

### 1. Access Control
- Market resolution restricted to market authority
- Protocol initialization restricted to program admin
- User predictions tied to wallet signatures

### 2. Validation
- Input validation on all parameters
- Timestamp validation for market operations
- Amount validation for bets and payouts

### 3. Safe Math
- Overflow protection in calculations
- Precise winnings calculation using checked math
- Protection against division by zero

### 4. State Management
- Immutable market outcomes once resolved
- Single prediction per user per market
- Claim protection against double spending

## Economic Model

### Betting Mechanism
1. Users bet SOL on YES/NO outcomes
2. All bets go into a shared pool
3. Winners split the entire pool proportionally
4. Losers forfeit their bets

### Payout Calculation
```
user_winnings = (user_bet_amount * total_pool) / winning_pool_total
```

### Example:
- Market: "Will BTC reach $100k by 2024?"
- Total YES bets: 10 SOL (from 5 users)
- Total NO bets: 5 SOL (from 3 users)
- Total pool: 15 SOL
- Outcome: YES
- Each YES bettor gets: (their_bet * 15) / 10 SOL

## Development Workflow

### Local Development
1. Start Solana test validator
2. Deploy program to local cluster
3. Run frontend with Next.js dev server
4. Connect wallet to localhost cluster

### Testing Strategy
1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test complete workflows
3. **E2E Tests**: Test full user journeys
4. **Property Tests**: Test invariants and edge cases

### Deployment Pipeline
1. **Devnet**: For development and testing
2. **Testnet**: For staging and user acceptance testing
3. **Mainnet**: For production deployment

## API Reference

### RPC Methods

#### initialize()
Initializes the protocol state. Must be called once before any other operations.

**Accounts:**
- `protocol_state` (mut, signer): Protocol state PDA
- `authority` (mut, signer): Protocol admin
- `system_program`: System program

#### create_prediction_market(market_id, description, end_timestamp, min_bet_amount)
Creates a new prediction market.

**Parameters:**
- `market_id`: Unique string identifier (max 50 chars)
- `description`: Market description (max 500 chars)
- `end_timestamp`: Unix timestamp when market closes
- `min_bet_amount`: Minimum bet in lamports

**Accounts:**
- `market` (mut): Market PDA
- `protocol_state` (mut): Protocol state PDA
- `authority` (mut, signer): Market creator
- `system_program`: System program

#### place_prediction(amount, prediction)
Places a bet on a market outcome.

**Parameters:**
- `amount`: Bet amount in lamports
- `prediction`: true for YES, false for NO

**Accounts:**
- `market` (mut): Market account
- `user_prediction` (mut): User prediction PDA
- `user` (mut, signer): User making the bet
- `system_program`: System program

#### resolve_market(outcome)
Resolves a market with the final outcome.

**Parameters:**
- `outcome`: true if YES outcome, false if NO outcome

**Accounts:**
- `market` (mut): Market account
- `authority` (signer): Market authority

#### claim_winnings()
Claims winnings for a resolved market.

**Accounts:**
- `market`: Market account
- `user_prediction` (mut): User prediction account
- `user` (mut, signer): User claiming winnings

## Future Enhancements

### Phase 2 Features
- Multi-outcome markets (beyond YES/NO)
- Token-based betting (SPL tokens)
- Automated market resolution via oracles
- Market categories and filtering
- Reputation system for predictors
- Liquidity provider rewards

### Scalability Improvements
- State compression for lower costs
- Batch operations for efficiency
- Layer 2 integration for micro-bets
- Cross-chain market creation

### Advanced Features
- Market templates and automation
- Prediction tournaments
- Social features and following
- AI-powered market suggestions
- Advanced analytics and reporting

## Deployment Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Testing Guide

See [TESTING.md](./TESTING.md) for comprehensive testing documentation.
