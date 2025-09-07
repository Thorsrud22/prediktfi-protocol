# PMF Analytics System

## Overview

The Product-Market Fit (PMF) Analytics system tracks critical metrics to measure the success of the Prediktfi protocol. It monitors user behavior, conversion rates, retention, and social engagement to provide actionable insights.

## Key Metrics

### 1. Click→Sim Rate (Target: ≥50%)
- **Definition**: Percentage of users who click "Trade this" and then simulate an intent
- **Tracking**: `click_trade_button` → `simulate_intent` events
- **Target**: 50% or higher
- **Status**: Pass/Warning/Fail

### 2. Sim→Sign Rate (Target: ≥25%)
- **Definition**: Percentage of users who simulate and then sign/execute an intent
- **Tracking**: `simulate_intent` → `sign_intent` events
- **Target**: 25% or higher
- **Status**: Pass/Warning/Fail

### 3. D7 Retention (Target: ≥35%)
- **Definition**: Percentage of users still active after 7 days
- **Tracking**: User retention data with daily activity flags
- **Target**: 35% or higher
- **Status**: Pass/Warning/Fail

### 4. Social Sharing (Target: ≥20/week)
- **Definition**: Number of shared receipts per week
- **Tracking**: `share_receipt` events and social shares
- **Target**: 20 shares per week
- **Status**: Pass/Warning/Fail

### 5. Signal Following (Target: ≥50%)
- **Definition**: 30-day positive performance rate for users following all signals
- **Tracking**: Long-term user performance analysis
- **Target**: 50% or higher
- **Status**: Pass/Warning/Fail

## Database Schema

### PMFMetric
```sql
model PMFMetric {
  id          String   @id @default(cuid())
  metricType  String   // "click_sim_rate", "sim_sign_rate", "d7_retention", "social_sharing", "signal_following"
  value       Float    // The actual metric value
  target      Float    // Target value for this metric
  period      String   // "daily", "weekly", "monthly"
  date        DateTime @default(now())
  metadata    String?  // JSON with additional context
  createdAt   DateTime @default(now())
}
```

### UserEvent
```sql
model UserEvent {
  id          String   @id @default(cuid())
  walletId    String
  eventType   String   // "click_trade_button", "simulate_intent", "sign_intent", "share_receipt", "follow_signal"
  eventData   String?  // JSON with event details
  sessionId   String?  // Track user sessions
  userAgent   String?  // Browser info
  referrer    String?  // Where they came from
  timestamp   DateTime @default(now())
}
```

### UserRetention
```sql
model UserRetention {
  id          String   @id @default(cuid())
  walletId    String
  firstAction DateTime // When they first used Actions
  lastAction  DateTime // When they last used Actions
  d1Active    Boolean  @default(false) // Active on day 1
  d3Active    Boolean  @default(false) // Active on day 3
  d7Active    Boolean  @default(false) // Active on day 7
  d14Active   Boolean  @default(false) // Active on day 14
  d30Active   Boolean  @default(false) // Active on day 30
  totalActions Int     @default(0) // Total number of actions taken
}
```

### SocialShare
```sql
model SocialShare {
  id          String   @id @default(cuid())
  intentId    String
  walletId    String
  platform    String   // "twitter", "linkedin", "facebook", "copy_trade"
  shareUrl    String?  // The shared URL
  receiptId   String?  // Associated receipt
  createdAt   DateTime @default(now())
}
```

## API Endpoints

### GET /api/analytics/pmf
Returns current PMF metrics with status indicators.

**Query Parameters:**
- `period`: `daily` | `weekly` | `monthly` (default: `weekly`)

**Response:**
```json
{
  "period": "weekly",
  "overallStatus": "excellent",
  "pmfScore": 85,
  "metrics": {
    "clickSimRate": {
      "value": 0.65,
      "target": 0.5,
      "status": "pass",
      "percentage": 65,
      "description": "Click→Sim Rate: Users who click 'Trade this' and then simulate"
    },
    // ... other metrics
  },
  "summary": {
    "passed": 4,
    "total": 5,
    "critical": 0,
    "warning": 1
  }
}
```

### POST /api/analytics/track-event
Tracks user events for analytics.

**Body:**
```json
{
  "walletId": "string",
  "eventType": "click_trade_button",
  "eventData": { "insightId": "string" },
  "sessionId": "string",
  "userAgent": "string",
  "referrer": "string"
}
```

### POST /api/cron/pmf-metrics
Calculates and stores PMF metrics (cron job).

**Headers:**
- `X-Cron-Key`: Required for security

## Dashboard

### Admin Dashboard
- **URL**: `/admin-dashboard/pmf`
- **Features**:
  - Real-time PMF metrics display
  - Status indicators (Pass/Warning/Fail)
  - Historical trends
  - Overall PMF score
  - Key insights and recommendations

### Navigation
- **URL**: `/admin-dashboard`
- **Sections**:
  - System Metrics
  - System Monitoring
  - PMF Analytics

## Event Tracking

### Automatic Tracking
The system automatically tracks events in the following components:

1. **Studio Page** (`/studio`):
   - "Trade this" button clicks → `click_trade_button`

2. **TradePanel** (`/advisor/actions`):
   - Intent simulation → `simulate_intent`
   - Intent signing → `sign_intent`

3. **ReceiptCard**:
   - Social sharing → `share_receipt`

### Manual Tracking
Use the `PMFTracker` class for custom event tracking:

```typescript
import { PMFTracker } from '../lib/analytics/pmf-tracker';

// Track custom event
await PMFTracker.trackEvent(
  walletId,
  'custom_event',
  { customData: 'value' },
  sessionId
);

// Track specific events
await PMFTracker.trackTradeButtonClick(walletId, insightId, sessionId);
await PMFTracker.trackIntentSimulation(walletId, intentId, sessionId);
await PMFTracker.trackIntentSigning(walletId, intentId, sessionId);
await PMFTracker.trackSocialShare(walletId, intentId, platform, shareUrl);
```

## Cron Jobs

### Daily PMF Metrics Calculation
- **Schedule**: `0 1 * * *` (1:00 AM daily)
- **Endpoint**: `/api/cron/pmf-metrics`
- **Purpose**: Calculate and store PMF metrics for all periods

### Manual Execution
```bash
# Run PMF metrics calculation
npm run pmf:metrics

# Or via API
curl -X POST /api/cron/pmf-metrics \
  -H "X-Cron-Key: YOUR_CRON_KEY"
```

## Status Indicators

### Overall PMF Score
- **Excellent**: 80%+ metrics passing
- **Good**: 60-79% metrics passing
- **Warning**: 40-59% metrics passing
- **Critical**: <40% metrics passing

### Individual Metric Status
- **Pass**: Meets or exceeds target
- **Warning**: 80-99% of target
- **Fail**: <80% of target

## Monitoring and Alerts

The PMF system integrates with the existing monitoring infrastructure:

1. **Synthetic Tests**: Run every 10 minutes
2. **SLO Monitoring**: Tracks system performance
3. **PMF Metrics**: Calculated daily
4. **Dashboard**: Real-time monitoring

## Best Practices

1. **Event Tracking**: Always include relevant context in `eventData`
2. **Session Management**: Use consistent `sessionId` for user sessions
3. **Error Handling**: Gracefully handle tracking failures
4. **Privacy**: Respect user privacy in event data
5. **Performance**: Use async tracking to avoid blocking UI

## Troubleshooting

### Common Issues

1. **Missing Events**: Check if tracking is properly implemented
2. **Low Conversion Rates**: Analyze user flow and UX
3. **Database Errors**: Verify Prisma schema and migrations
4. **Cron Failures**: Check Vercel cron job configuration

### Debug Commands

```bash
# Check PMF metrics
curl /api/analytics/pmf?period=weekly

# Test event tracking
curl -X POST /api/analytics/track-event \
  -H "Content-Type: application/json" \
  -d '{"walletId":"test","eventType":"test_event"}'

# Run manual metrics calculation
npm run pmf:metrics
```

## Future Enhancements

1. **Real-time Updates**: WebSocket-based live metrics
2. **Advanced Analytics**: Cohort analysis, funnel visualization
3. **A/B Testing**: Built-in experimentation framework
4. **Machine Learning**: Predictive analytics and recommendations
5. **Integration**: Slack/email alerts for PMF changes
