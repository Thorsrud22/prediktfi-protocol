# Predikt Prediction-to-Action v1 - Quick Start Guide

## Overview

Predikt Prediction-to-Action v1 enables users to convert AI predictions into executable trading intents on Solana via Jupiter aggregator. This is a **monitor-only** system with no automatic trading.

## Features

- **Intent Creation**: Convert AI predictions to trading intents
- **Simulation**: Preview trade outcomes before execution
- **Execution**: Execute trades via Jupiter (requires wallet connection)
- **Embed**: Share trading results via embed widgets
- **Safety**: Comprehensive risk guards and validation

## Supported Assets

**v1 supports:**
- Base: SOL, ETH, BTC
- Quote: USDC
- Chain: Solana only

## Quick Start

### 1. Enable Features

Set environment variables:
```bash
FEATURE_ACTIONS=true
FEATURE_EMBED_INTENT=true
```

### 2. Access Actions

Navigate to `/advisor/actions` or click "Actions" in the navbar.

### 3. Create Intent

1. Select a wallet
2. Click "Create Intent"
3. Configure trade parameters:
   - Base/Quote pair
   - Side (BUY/SELL)
   - Position size (% or fixed amount)
   - Risk guards
   - Expiry time

### 4. Simulate Trade

1. Click "Simulate" on any intent
2. Review expected outcomes:
   - Expected vs worst-case price
   - Fees and slippage
   - Portfolio impact
   - Historical accuracy

### 5. Execute Trade

1. Click "Execute" (requires wallet connection)
2. Sign transaction in wallet
3. Monitor execution status

## Studio Integration

### Trade This Prediction

In AI Studio, after generating a prediction:

1. Click "🚀 Trade This Prediction"
2. Automatically redirected to Actions with pre-filled template
3. Review and adjust parameters
4. Create intent

## API Endpoints

### Create Intent
```bash
POST /api/intents/create
{
  "intent": {
    "walletId": "wallet_id",
    "base": "SOL",
    "quote": "USDC", 
    "side": "BUY",
    "sizeJson": {"type": "pct", "value": 5},
    "guardsJson": {...}
  },
  "idempotencyKey": "unique_key"
}
```

### Simulate Intent
```bash
POST /api/intents/simulate
{
  "intentId": "intent_id"
}
```

### Execute Intent
```bash
POST /api/intents/execute
{
  "intentId": "intent_id",
  "idempotencyKey": "unique_key"
}
```

### Public Status
```bash
GET /api/public/intents/{id}
```

## Embed Integration

### JavaScript Embed
```html
<script src="https://predikt.fi/embed/intent.js"></script>
<div data-predikt-intent="intent_id" data-base-url="https://predikt.fi"></div>
```

### Iframe Embed
```html
<iframe src="https://predikt.fi/embed/intent/intent_id" width="320" height="200"></iframe>
```

## Risk Management

### Guards
- **Position Limit**: Max % of portfolio per trade
- **Daily Loss Cap**: Max daily loss percentage
- **Liquidity Check**: Minimum market liquidity
- **Slippage Cap**: Maximum acceptable slippage
- **Expiry**: Intent expiration time

### Safety Features
- No automatic approvals
- Wallet signature required for execution
- Comprehensive validation
- Idempotency protection
- Rate limiting

## Testing

Run the test script:
```bash
./scripts/test-p2a.sh
```

## Production Setup

### Environment Variables
```bash
# Feature flags
FEATURE_ACTIONS=true
FEATURE_EMBED_INTENT=true

# Jupiter API
JUPITER_BASE_URL=https://quote-api.jup.ag
JUPITER_API_KEY=your_api_key

# Security
WEBHOOK_HMAC_SECRET=random_secret
PREDIKT_BASE_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://...
```

### Database Migration
```bash
npx prisma migrate deploy
```

### Redis Setup (for idempotency)
```bash
REDIS_URL=redis://...
```

## Monitoring

### Health Checks
- `/api/health/alerts` - Alerts system health
- `/api/public/intents/{id}` - Intent status

### Metrics
- Intent creation rate
- Simulation accuracy
- Execution success rate
- Guard violation rate

## Troubleshooting

### Common Issues

**Intent creation fails**
- Check feature flags are enabled
- Verify wallet exists
- Check guard validation

**Simulation fails**
- Jupiter API may be down
- Insufficient market data
- Check network connectivity

**Execution fails**
- Wallet not connected
- Insufficient balance
- Guard violations
- Expired intent

### Debug Mode
Set `NODE_ENV=development` for detailed error messages.

## Security Notes

- All trades require explicit user approval
- No private key access
- Read-only wallet connection
- Comprehensive audit logging
- Rate limiting on all endpoints

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check server logs
4. Contact support team
