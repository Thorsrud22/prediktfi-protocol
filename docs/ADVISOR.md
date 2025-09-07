# Predikt Advisor v0.1 - Monitor-only

## Overview

Predikt Advisor is a personal AI-financial agent for crypto that provides read-only wallet monitoring, portfolio analysis, risk assessment, and smart alerts. This is a monitor-only system with no automatic trading or custody.

## Features

### Core Functionality
- **Read-only wallet connection** (Solana first)
- **Portfolio snapshots** with allocation, concentration, and risk metrics
- **Risk analysis** with HHI, drawdown, volatility, and diversification scores
- **Smart alerts** via in-app, email, or webhook notifications
- **Strategy Studio** for generating custom monitoring rules from natural language

### Security & Trust
- **Read-only access** - never requests private keys
- **No automatic trading** - only recommendations and alerts
- **Feature-flagged rollout** - controlled deployment with easy rollback
- **Audit logging** - all alerts and recommendations are logged

## Architecture

### Database Models
```prisma
model Wallet {
  id           String   @id @default(cuid())
  address      String   @unique
  chain        String   @default("solana")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  strategies   Strategy[]
  alerts       AlertRule[]
  snapshots    HoldingSnapshot[]
}

model Strategy {
  id           String   @id @default(cuid())
  walletId     String
  name         String
  kind         String   // "risk", "rebalance", "momentum"
  configJson   String   // JSON string
  enabled      Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  wallet       Wallet   @relation(fields: [walletId], references: [id], onDelete: Cascade)
}

model AlertRule {
  id           String   @id @default(cuid())
  walletId     String
  name         String
  ruleJson     String   // JSON string
  channel      String   // "inapp", "email", "webhook"
  target       String?  // email or webhook URL
  enabled      Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  wallet       Wallet   @relation(fields: [walletId], references: [id], onDelete: Cascade)
  events       AlertEvent[]
}

model AlertEvent {
  id           String   @id @default(cuid())
  ruleId       String
  firedAt      DateTime @default(now())
  payloadJson  String   // JSON string
  delivered    Boolean  @default(false)
  deliveredAt  DateTime?
  rule         AlertRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)
}

model HoldingSnapshot {
  id           String   @id @default(cuid())
  walletId     String
  ts           DateTime @default(now())
  asset        String   // mint or symbol
  amount       String   // Decimal as string
  valueUsd     String   // Decimal as string
  wallet       Wallet   @relation(fields: [walletId], references: [id], onDelete: Cascade)
}
```

### API Endpoints

#### Portfolio
- `POST /api/advisor/portfolio/snapshot` - Get portfolio snapshot and risk analysis
- `GET /api/advisor/portfolio/snapshot?walletId=...` - Get cached snapshot

#### Alerts
- `GET /api/advisor/alerts/rules?walletId=...` - List alert rules
- `POST /api/advisor/alerts/rules` - Create alert rule
- `PUT /api/advisor/alerts/rules` - Update alert rule
- `DELETE /api/advisor/alerts/rules?id=...` - Delete alert rule
- `POST /api/advisor/alerts/test` - Test alert rule against historical data
- `GET /api/advisor/alerts/events?walletId=...` - List alert events

#### Webhooks
- `POST /api/webhooks/notify` - Send webhook notification
- `GET /api/webhooks/notify?url=...` - Test webhook connectivity

### Alert Types

#### Price Monitoring
- **Portfolio Drop**: Alert when portfolio value drops by X%
- **Portfolio Rise**: Alert when portfolio value rises by X%
- **Asset Drop**: Alert when specific asset drops by X%

#### Risk Monitoring
- **Concentration**: Alert when top position exceeds X% of portfolio
- **Volatility**: Alert when portfolio volatility is high
- **Drawdown**: Alert when portfolio drawdown exceeds X%

#### Market Events
- **Stablecoin Depeg**: Alert when stablecoins deviate from $1.00
- **Volume Spike**: Alert when trading volume spikes

### Notification Channels

#### In-App Notifications
- Real-time notifications in the Predikt interface
- Stored in database for persistence
- Mark as read functionality

#### Email Notifications
- HTML-formatted emails with portfolio details
- Bounce handling and delivery tracking
- Unsubscribe functionality

#### Webhook Notifications
- JSON payload sent to user-provided URL
- HTTPS-only for security
- Delivery confirmation and retry logic

## Deployment

### Environment Variables
```bash
# Feature flags
FEATURE_ADVISOR=true
FEATURE_ALERTS=true

# Database
DATABASE_URL="postgresql://..."

# Email service (optional)
EMAIL_SERVICE_API_KEY="..."
EMAIL_FROM_ADDRESS="alerts@predikt.fi"
```

### Cron Job Setup
```bash
# Run advisor tick every 5 minutes
*/5 * * * * cd /path/to/prediktfi-protocol && npm run advisor:tick
```

### Monitoring
- **SLO**: P95 < 400ms for portfolio snapshots
- **SLO**: P95 < 2s for alert pipeline
- **Metrics**: Alert delivery rates, rule evaluation times, error rates

## Usage

### Connecting a Wallet
1. Navigate to `/advisor`
2. Enter Solana wallet address
3. Click "Connect Wallet"
4. View portfolio snapshot and risk analysis

### Creating Alerts
1. Navigate to `/advisor/alerts`
2. Select connected wallet
3. Click "New Alert"
4. Configure rule parameters
5. Choose notification channel
6. Save and enable rule

### Generating Strategies
1. Navigate to `/advisor/strategies`
2. Select connected wallet
3. Click "New Strategy"
4. Enter natural language prompt
5. Review generated strategy
6. Save and enable strategy

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e:mock
```

### Manual Testing
```bash
# Test advisor tick
npm run advisor:test

# Test webhook
curl -X GET "http://localhost:3000/api/webhooks/notify?url=https://hooks.slack.com/..."
```

## Rollback

### Disable Features
```bash
# Set environment variables
FEATURE_ADVISOR=false
FEATURE_ALERTS=false

# Redeploy
npm run deploy
```

### Database Rollback
```bash
# Remove advisor tables (if needed)
npx prisma migrate reset
```

## Security Considerations

### Wallet Security
- **Read-only access only** - never requests private keys
- **No custody** - users maintain full control of assets
- **Clear UI messaging** - explicit "no trades executed" warnings

### Data Security
- **HTTPS only** for webhook URLs
- **Rate limiting** on all endpoints
- **Input validation** on all user inputs
- **Audit logging** for all actions

### Privacy
- **Minimal data collection** - only wallet address and holdings
- **Data retention policies** - automatic cleanup of old snapshots
- **User control** - easy deletion of all data

## Future Enhancements

### Phase 2 (v0.2)
- **Multi-chain support** (Ethereum, Polygon)
- **Advanced risk models** (VaR, stress testing)
- **Portfolio optimization** recommendations
- **Social features** (share strategies, follow experts)

### Phase 3 (v0.3)
- **AI-powered insights** (market sentiment, news analysis)
- **Automated rebalancing** (with user approval)
- **Integration with DeFi protocols**
- **Mobile app** with push notifications

## Support

### Documentation
- [API Reference](./API.md)
- [Alert Types](./ALERT_TYPES.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

### Contact
- **Email**: support@predikt.fi
- **Discord**: [Predikt Community](https://discord.gg/predikt)
- **GitHub**: [Issues](https://github.com/prediktfi/protocol/issues)
