# P2A Monitoring System Documentation

## Overview

The Predikt Prediction-to-Action (P2A) monitoring system provides comprehensive real-time monitoring of system health, performance, and SLO compliance. It consists of synthetic testing, SLO monitoring, and alerting components that work together to ensure system reliability.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Synthetic      │───▶│  SLO Monitor    │───▶│  Alert System   │
│  Testing        │    │                 │    │                 │
│  (Every 10min)  │    │  (Every 5min)   │    │  (Real-time)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Test Results   │    │  SLO Metrics    │    │  Slack/Webhook  │
│  Database       │    │  Database       │    │  Notifications  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components

### 1. Synthetic Testing System

**Location**: `scripts/synthetic-p2a.ts`

**Purpose**: Automated testing of P2A system functionality every 10 minutes

**Features**:
- Dummy intent creation with realistic parameters
- Intent simulation testing
- Intent execution testing (simulation mode)
- Public API testing
- Embed functionality testing
- Health endpoint testing

**Test Flow**:
1. Create dummy intent (SOL/USDC pair)
2. Test simulation API call
3. Test execution API call (simulation only)
4. Test public API access
5. Test embed page functionality
6. Test health endpoints
7. Generate comprehensive metrics
8. Clean up test data

**Metrics Tracked**:
- Test pass/fail rates
- P95 latency
- Average latency
- Consecutive failures
- Individual test durations

### 2. SLO Monitoring System

**Location**: `scripts/slo-monitor.ts`

**Purpose**: Monitor key performance indicators and alert on SLO violations

**SLOs Monitored**:

#### Simulation Latency P95
- **Threshold**: 1.5 seconds
- **Window**: 5 minutes
- **Alert**: Critical if P95 > 1.5s for 5+ minutes

#### Execution Fail Rate
- **Threshold**: 1%
- **Window**: 5 minutes
- **Alert**: Critical if fail rate > 1% for 5+ minutes

#### Synthetic Test Failures
- **Threshold**: 2 consecutive failures
- **Window**: 5 minutes
- **Alert**: Critical if 2+ consecutive synthetic test failures

#### Database Latency
- **Threshold**: 100ms
- **Window**: 5 minutes
- **Alert**: Warning if latency > 100ms

#### Embed Load Time
- **Threshold**: 500ms
- **Window**: 5 minutes
- **Alert**: Warning if load time > 500ms

### 3. Alert System

**Channels**:
- Slack webhooks
- Generic webhook endpoints
- Database logging

**Alert Content**:
- IntentId (when available)
- Trading pair
- Reason for alert
- Duration of violation
- Severity level

**Alert Conditions**:
- Critical alerts: Sustained violations for 5+ minutes
- Warning alerts: Immediate notification
- Synthetic failures: 2+ consecutive failures

## Configuration

### Environment Variables

```bash
# Required
CRON_KEY=your_32_character_cron_key_here

# Optional - Alert Channels
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_WEBHOOK_URL=https://your-webhook-endpoint.com/alerts

# Optional - App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.com
```

### Cron Jobs (Vercel)

```json
{
  "crons": [
    {
      "path": "/api/monitoring/synthetic",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

## API Endpoints

### Synthetic Monitoring
- **Endpoint**: `GET /api/monitoring/synthetic`
- **Headers**: `X-Cron-Key: your_cron_key`
- **Purpose**: Trigger synthetic tests and SLO monitoring
- **Response**: Success/error status with duration

### Monitoring Dashboard
- **Endpoint**: `GET /api/monitoring/dashboard`
- **Purpose**: Get real-time monitoring metrics
- **Response**: Comprehensive monitoring data

### Health Checks
- **P2A Health**: `GET /api/health/p2a`
- **Alerts Health**: `GET /api/health/alerts`

## Monitoring Dashboard

**Location**: `/admin-dashboard/monitoring`

**Features**:
- Real-time status overview
- Synthetic test performance metrics
- SLO compliance status
- Recent test results
- Recent alerts
- Auto-refresh every 30 seconds

**Status Indicators**:
- 🟢 Healthy: All systems operational
- 🟡 Warning: Minor issues detected
- 🔴 Critical: Major issues requiring attention

## Database Schema

### Intent Receipts (Monitoring Data)

The system uses the existing `IntentReceipt` table to store monitoring data:

```sql
-- Synthetic test results
intentId: 'synthetic_test_<timestamp>'
status: 'simulated' | 'failed'
simJson: {
  "test": "synthetic_tests",
  "metrics": { ... },
  "results": [ ... ]
}

-- SLO alerts
intentId: 'slo_alert_<timestamp>_<random>'
status: 'failed'
simJson: {
  "type": "slo_alert",
  "alert": { ... }
}
```

## Alert Examples

### Slack Alert
```json
{
  "text": "🚨 P2A SLO Alert: simulation_latency_p95",
  "attachments": [
    {
      "color": "danger",
      "fields": [
        {
          "title": "Metric",
          "value": "simulation_latency_p95",
          "short": true
        },
        {
          "title": "Value",
          "value": "2100ms",
          "short": true
        },
        {
          "title": "Threshold",
          "value": "1500ms",
          "short": true
        },
        {
          "title": "IntentId",
          "value": "intent_12345",
          "short": true
        },
        {
          "title": "Pair",
          "value": "SOL/USDC",
          "short": true
        },
        {
          "title": "Duration",
          "value": "7 minutes",
          "short": true
        }
      ]
    }
  ]
}
```

### Webhook Alert
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "p2a-monitoring",
  "alert": {
    "metric": "simulation_latency_p95",
    "value": 2100,
    "threshold": 1500,
    "unit": "ms",
    "severity": "critical",
    "message": "Critical SLO violation: simulation_latency_p95 is 2100ms, exceeding threshold of 1500ms",
    "intentId": "intent_12345",
    "pair": "SOL/USDC",
    "reason": "P95 latency 2100ms exceeds 1.5s threshold",
    "duration": 7
  }
}
```

## Troubleshooting

### Common Issues

#### Synthetic Tests Failing
1. Check if P2A features are enabled
2. Verify database connectivity
3. Check API endpoint availability
4. Review test logs for specific errors

#### SLO Alerts Not Firing
1. Verify alert thresholds are correct
2. Check if violations are sustained for required duration
3. Verify webhook URLs are configured
4. Check database for stored alert data

#### High Latency Issues
1. Check database performance
2. Verify external API response times
3. Review system resource usage
4. Check for network issues

### Debug Commands

```bash
# Run synthetic tests manually
npm run synthetic-tests

# Run SLO monitoring manually
npm run slo-monitor

# Check monitoring dashboard
curl http://localhost:3000/api/monitoring/dashboard

# Check health endpoints
curl http://localhost:3000/api/health/p2a
curl http://localhost:3000/api/health/alerts
```

## Best Practices

### Monitoring
1. Review monitoring dashboard regularly
2. Set up proper alert thresholds based on business requirements
3. Monitor trends over time, not just current values
4. Investigate alerts promptly

### Maintenance
1. Clean up old test data periodically
2. Review and adjust SLO thresholds as needed
3. Update alert channels as team changes
4. Document any custom monitoring requirements

### Performance
1. Synthetic tests should complete within 30 seconds
2. SLO monitoring should complete within 10 seconds
3. Database queries should be optimized for performance
4. Alert delivery should be reliable and fast

## Future Enhancements

1. **Custom Metrics**: Add business-specific metrics
2. **Advanced Alerting**: Implement alert escalation and routing
3. **Historical Analysis**: Add trend analysis and forecasting
4. **Integration**: Connect with external monitoring tools
5. **Automation**: Add auto-remediation for common issues
