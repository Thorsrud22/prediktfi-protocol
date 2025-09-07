# Predikt Alerts System

## Overview

The Predikt Alerts system provides intelligent portfolio monitoring with real-time notifications via multiple channels. It's designed to help users stay informed about important portfolio changes without requiring constant manual monitoring.

## Architecture

### Core Components

#### AlertsEngine
- **Location**: `app/lib/advisor/alerts-engine.ts`
- **Purpose**: Core logic for evaluating alert rules and firing notifications
- **Responsibilities**:
  - Fetch portfolio snapshots
  - Evaluate rule conditions
  - Fire alerts when conditions are met
  - Track delivery status

#### Notification Channels
- **InApp**: `app/lib/advisor/channels/inapp.ts`
- **Email**: `app/lib/advisor/channels/email.ts`
- **Webhook**: `app/lib/advisor/channels/webhook.ts`

#### Cron Job
- **Location**: `scripts/cron-advisor-tick.ts`
- **Purpose**: Periodic evaluation of all active alert rules
- **Frequency**: Every 5 minutes (configurable)

## Alert Types

### Price Monitoring

#### Portfolio Drop Alert
```json
{
  "type": "price_drop",
  "threshold": 10,
  "timeWindow": "24h",
  "asset": "portfolio"
}
```
- **Trigger**: Portfolio value drops by threshold percentage
- **Use Case**: Risk management, stop-loss monitoring
- **Example**: Alert when portfolio drops 15% in 24 hours

#### Portfolio Rise Alert
```json
{
  "type": "price_rise",
  "threshold": 20,
  "timeWindow": "7d",
  "asset": "portfolio"
}
```
- **Trigger**: Portfolio value rises by threshold percentage
- **Use Case**: Profit-taking opportunities
- **Example**: Alert when portfolio gains 25% in 7 days

#### Asset-Specific Alert
```json
{
  "type": "price_drop",
  "threshold": 5,
  "timeWindow": "1h",
  "asset": "SOL"
}
```
- **Trigger**: Specific asset drops by threshold percentage
- **Use Case**: Individual asset monitoring
- **Example**: Alert when SOL drops 8% in 1 hour

### Risk Monitoring

#### Concentration Alert
```json
{
  "type": "concentration",
  "threshold": 30,
  "asset": "portfolio"
}
```
- **Trigger**: Top position exceeds threshold percentage
- **Use Case**: Diversification monitoring
- **Example**: Alert when largest holding exceeds 40% of portfolio

#### Volatility Alert
```json
{
  "type": "volatility",
  "threshold": "high",
  "asset": "portfolio"
}
```
- **Trigger**: Portfolio volatility exceeds normal levels
- **Use Case**: Risk management
- **Example**: Alert when portfolio becomes highly volatile

#### Drawdown Alert
```json
{
  "type": "drawdown",
  "threshold": 20,
  "asset": "portfolio"
}
```
- **Trigger**: Portfolio drawdown exceeds threshold percentage
- **Use Case**: Risk management
- **Example**: Alert when portfolio drops 25% from peak

### Market Events

#### Stablecoin Depeg Alert
```json
{
  "type": "stablecoin_depeg",
  "threshold": 0.5,
  "asset": "USDC"
}
```
- **Trigger**: Stablecoin price deviates from $1.00
- **Use Case**: Market stability monitoring
- **Example**: Alert when USDC drops below $0.995

#### Volume Spike Alert
```json
{
  "type": "volume_spike",
  "threshold": 3,
  "timeWindow": "24h",
  "asset": "SOL"
}
```
- **Trigger**: Trading volume exceeds normal levels
- **Use Case**: Market activity monitoring
- **Example**: Alert when SOL volume is 5x normal

## Notification Channels

### In-App Notifications

#### Features
- Real-time notifications in Predikt interface
- Persistent storage in database
- Mark as read functionality
- Notification history

#### Implementation
```typescript
const inAppChannel = new InAppChannel();
await inAppChannel.send({
  target: userId,
  payload: alertData,
  ruleName: 'Portfolio Drop Alert'
});
```

#### UI Integration
- Notification bell icon in navbar
- Dropdown with recent notifications
- Mark all as read functionality
- Link to alert management

### Email Notifications

#### Features
- HTML-formatted emails
- Portfolio details included
- Unsubscribe functionality
- Bounce handling

#### Email Template
```html
<!DOCTYPE html>
<html>
<head>
  <title>🚨 Predikt Alert: Portfolio Drop</title>
  <style>
    .alert-box { background: #fef3c7; border: 1px solid #f59e0b; }
    .button { background: #1e40af; color: white; padding: 10px 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Predikt Alert</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <h2>Portfolio Drop Alert</h2>
        <p><strong>Threshold:</strong> 15%</p>
        <p><strong>Current Value:</strong> -18.5%</p>
        <p><strong>Wallet:</strong> So1111...1112</p>
      </div>
      <a href="https://predikt.fi/advisor" class="button">View Portfolio</a>
    </div>
  </div>
</body>
</html>
```

#### Configuration
```typescript
const emailChannel = new EmailChannel();
await emailChannel.send({
  target: 'user@example.com',
  payload: alertData,
  ruleName: 'Portfolio Drop Alert'
});
```

### Webhook Notifications

#### Features
- JSON payload to user-provided URL
- HTTPS-only for security
- Delivery confirmation
- Retry logic

#### Webhook Payload
```json
{
  "event": "alert_fired",
  "rule_name": "Portfolio Drop Alert",
  "rule_type": "price_drop",
  "threshold": 15,
  "current_value": "-18.5%",
  "wallet_address": "So11111111111111111111111111111111111111112",
  "timestamp": "2024-01-15T10:30:00Z",
  "alert_id": "alert_1705312200000"
}
```

#### Security
- HTTPS-only URLs
- No localhost or private IPs
- Rate limiting
- User-Agent identification

#### Testing
```bash
curl -X GET "http://localhost:3000/api/webhooks/notify?url=https://hooks.slack.com/..."
```

## Rule Evaluation

### Evaluation Process

1. **Fetch Portfolio Data**
   - Get current portfolio snapshot
   - Retrieve previous snapshot for comparison
   - Calculate risk metrics

2. **Evaluate Rules**
   - Check each active rule against current data
   - Compare with historical data when needed
   - Determine if conditions are met

3. **Fire Alerts**
   - Create alert event in database
   - Send notification via configured channel
   - Update delivery status

4. **Save Snapshot**
   - Store current snapshot for future comparisons
   - Clean up old snapshots (retention policy)

### Rule Conditions

#### Price Change Calculation
```typescript
const priceChange = (currentValue - previousValue) / previousValue * 100;
const shouldFire = priceChange <= -threshold; // For drop alerts
```

#### Concentration Calculation
```typescript
const concentration = (assetValue / totalValue) * 100;
const shouldFire = concentration > threshold;
```

#### Volatility Assessment
```typescript
const volatility = calculateVolatility(historicalPrices);
const shouldFire = volatility > threshold;
```

## API Endpoints

### Alert Rules Management

#### List Rules
```http
GET /api/advisor/alerts/rules?walletId=wallet123
```

#### Create Rule
```http
POST /api/advisor/alerts/rules
Content-Type: application/json

{
  "walletId": "wallet123",
  "name": "Portfolio Drop Alert",
  "ruleJson": {
    "type": "price_drop",
    "threshold": 15,
    "timeWindow": "24h"
  },
  "channel": "email",
  "target": "user@example.com"
}
```

#### Update Rule
```http
PUT /api/advisor/alerts/rules
Content-Type: application/json

{
  "id": "rule123",
  "enabled": false
}
```

#### Delete Rule
```http
DELETE /api/advisor/alerts/rules?id=rule123
```

### Alert Events

#### List Events
```http
GET /api/advisor/alerts/events?walletId=wallet123&limit=50&offset=0
```

#### Test Rule
```http
POST /api/advisor/alerts/test
Content-Type: application/json

{
  "ruleId": "rule123",
  "days": 7
}
```

### Webhook Management

#### Send Webhook
```http
POST /api/webhooks/notify
Content-Type: application/json

{
  "webhookUrl": "https://hooks.slack.com/...",
  "payload": { ... },
  "ruleName": "Test Alert"
}
```

#### Test Webhook
```http
GET /api/webhooks/notify?url=https://hooks.slack.com/...
```

## Monitoring & Observability

### Metrics

#### Performance Metrics
- **Rule evaluation time**: P95 < 100ms per rule
- **Alert delivery time**: P95 < 2s end-to-end
- **Portfolio snapshot time**: P95 < 400ms

#### Business Metrics
- **Alert delivery rate**: > 95% successful delivery
- **User engagement**: Alert click-through rate > 20%
- **Rule effectiveness**: Users acting on alerts > 30%

#### Error Metrics
- **Rule evaluation errors**: < 1% failure rate
- **Channel delivery errors**: < 5% failure rate
- **Webhook timeouts**: < 2% timeout rate

### Logging

#### Structured Logging
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "service": "alerts-engine",
  "event": "rule_evaluated",
  "ruleId": "rule123",
  "walletId": "wallet456",
  "fired": true,
  "evaluationTime": 45,
  "channel": "email",
  "deliveryStatus": "success"
}
```

#### Error Logging
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "error",
  "service": "alerts-engine",
  "event": "rule_evaluation_failed",
  "ruleId": "rule123",
  "error": "Portfolio snapshot failed",
  "stackTrace": "..."
}
```

### Health Checks

#### Endpoint Health
```http
GET /api/health/alerts
```

Response:
```json
{
  "status": "healthy",
  "checks": {
    "database": "healthy",
    "email_service": "healthy",
    "webhook_service": "healthy"
  },
  "metrics": {
    "active_rules": 1250,
    "pending_alerts": 3,
    "last_evaluation": "2024-01-15T10:25:00Z"
  }
}
```

## Troubleshooting

### Common Issues

#### Rule Not Firing
1. **Check rule configuration**
   - Verify threshold values
   - Confirm time window settings
   - Check asset selection

2. **Check portfolio data**
   - Ensure wallet is connected
   - Verify snapshot data is current
   - Check for data quality issues

3. **Check rule status**
   - Confirm rule is enabled
   - Check for evaluation errors
   - Verify wallet association

#### Delivery Failures
1. **Email Delivery**
   - Check email address validity
   - Verify SMTP configuration
   - Check spam folder

2. **Webhook Delivery**
   - Test webhook URL
   - Check HTTPS requirement
   - Verify endpoint response

3. **In-App Delivery**
   - Check user session
   - Verify notification permissions
   - Check browser compatibility

### Debug Mode

#### Enable Debug Logging
```bash
DEBUG=alerts:* npm run advisor:tick
```

#### Test Individual Rules
```bash
npm run advisor:test
```

#### Manual Rule Evaluation
```typescript
const engine = new AlertsEngine();
await engine.evaluateAllRules();
```

## Best Practices

### Rule Design
- **Start simple**: Begin with basic price alerts
- **Set reasonable thresholds**: Avoid too sensitive or too broad
- **Use appropriate time windows**: Balance responsiveness vs noise
- **Test thoroughly**: Use test mode before going live

### Channel Selection
- **In-app**: For frequent, low-urgency alerts
- **Email**: For important, actionable alerts
- **Webhook**: For integration with external systems

### Performance
- **Limit active rules**: Keep under 50 rules per wallet
- **Use efficient thresholds**: Avoid overly complex conditions
- **Monitor evaluation times**: Keep under 100ms per rule

### Security
- **Validate webhook URLs**: HTTPS-only, no private IPs
- **Rate limit alerts**: Prevent spam
- **Audit all actions**: Log rule changes and alerts

## Future Enhancements

### Advanced Features
- **Conditional alerts**: Multi-condition rules
- **Alert chains**: Sequential alert workflows
- **Machine learning**: Adaptive threshold adjustment
- **Social alerts**: Share alerts with community

### Integration
- **Trading platforms**: Direct integration with exchanges
- **Portfolio managers**: Connect with existing tools
- **Social media**: Share alerts on Twitter/Discord
- **Mobile apps**: Push notifications

### Analytics
- **Alert effectiveness**: Track user response rates
- **Market correlation**: Analyze alert patterns
- **Performance optimization**: Improve evaluation speed
- **User insights**: Understand alert preferences
