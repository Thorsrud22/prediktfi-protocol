# CreatorDaily Backfill System

This document describes the CreatorDaily backfill system for historical data processing and data quality monitoring.

## Overview

The CreatorDaily backfill system provides:
- **Idempotent backfill** of historical CreatorDaily metrics
- **Data quality sentinel** with invariant validation
- **Slack notifications** for data quality violations
- **Batch processing** with concurrency control

## Components

### 1. Backfill Script (`scripts/backfill-creator-daily.ts`)

Command-line script for backfilling historical CreatorDaily data.

**Usage:**
```bash
# Basic usage
pnpm backfill:creator-daily --since=2024-01-01 --until=2024-01-31

# With custom batch size and concurrency
pnpm backfill:creator-daily --since=2024-01-01 --until=2024-01-31 --batchDays=5 --concurrency=2

# Dry run to see what would be processed
pnpm backfill:creator-daily --since=2024-01-01 --until=2024-01-31 --dry-run
```

**Parameters:**
- `--since=YYYY-MM-DD` - Start date (inclusive)
- `--until=YYYY-MM-DD` - End date (inclusive)
- `--batchDays=N` - Days per batch (default: 3, max: 30)
- `--concurrency=N` - Concurrent batches (default: 3, max: 10)
- `--dry-run` - Show what would be processed without executing

**Features:**
- Idempotent processing (safe to re-run)
- Progress logging with timing
- Error handling and reporting
- Rate limiting between batches

### 2. Admin Endpoint (`/api/ops/creator-backfill`)

HTTP endpoint for triggering backfill jobs with background processing.

**Authentication:**
- HMAC signature using `OPS_SECRET`
- Header: `x-ops-signature`

**POST Request:**
```json
{
  "since": "2024-01-01",
  "until": "2024-01-31",
  "batchDays": 3,
  "concurrency": 3
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "backfill_1705312200000_abc123",
  "message": "Backfill job started for 2024-01-01 to 2024-01-31",
  "config": {
    "since": "2024-01-01",
    "until": "2024-01-31",
    "batchDays": 3,
    "concurrency": 3
  },
  "startedAt": "2024-01-15T10:30:00Z"
}
```

**Job Status (GET):**
```bash
GET /api/ops/creator-backfill?jobId=backfill_1705312200000_abc123
```

### 3. Data Quality Sentinel (`/api/ops/creator-dq`)

Validates CreatorDaily data quality invariants.

**Validation Rules:**
- All components in range [0,1]: `accuracy`, `consistency`, `volumeScore`, `recencyScore`
- Accuracy calculation: `accuracy ≈ 1 - brierMean` (±1e-6)
- Score calculation: `score = W_ACC*acc + W_CONS*cons + W_VOL*vol + W_REC*rec` (±1e-6)
- Non-negative values: `maturedN >= 0`, `notional30d >= 0`
- Optional non-negative: `retStd30d >= 0` or `null`

**Request:**
```bash
GET /api/ops/creator-dq?days=7
```

**Response:**
```json
{
  "ok": false,
  "violations": [
    {
      "creatorId": "creator123",
      "creatorIdHashed": "a1b2c3d4",
      "field": "accuracy",
      "value": 1.5,
      "expected": "[0,1]",
      "day": "2024-01-15",
      "severity": "error",
      "message": "accuracy must be in range [0,1], got 1.5"
    }
  ],
  "summary": {
    "totalRecords": 100,
    "violationCount": 1,
    "errorCount": 1,
    "warningCount": 0
  },
  "checkedAt": "2024-01-15T10:30:00Z"
}
```

### 4. Data Quality Watch (`/api/ops/creator-dq-watch`)

Nightly cron endpoint that runs data quality checks and sends Slack notifications.

**Features:**
- Runs data quality checks on last 7 days
- Sends formatted Slack notifications
- Handles errors gracefully
- Top 10 violations in notification

**Slack Message Format:**
```
🔍 CreatorDaily Data Quality Report

Total Records: 100
Violations: 5
Errors: 3
Warnings: 2

Top 10 Violations:
• `a1b2c3d4` - accuracy: 1.5 (expected: [0,1])
• `e5f6g7h8` - maturedN: -1 (expected: >= 0)
```

## Environment Variables

```bash
# Required
OPS_SECRET=your_32_char_ops_secret_here
DATABASE_URL=postgresql://...

# Optional
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
PREDIKT_BASE_URL=https://your-domain.com
```

## Cron Setup

Add to your crontab for nightly data quality monitoring:

```bash
# Run data quality watch every night at 3:00 AM Europe/Oslo
0 3 * * * cd /path/to/prediktfi-protocol && curl -X GET "https://your-domain.com/api/ops/creator-dq-watch" -H "x-ops-signature: $(echo -n '' | openssl dgst -sha256 -hmac "$OPS_SECRET" -binary | xxd -p)"
```

## Testing

### Unit Tests
```bash
# Run data quality sentinel tests
pnpm test tests/creator-dq-sentinel.test.ts

# Run E2E Slack integration tests
pnpm test tests/e2e/creator-dq-slack.test.ts
```

### Manual Testing
```bash
# Test data quality check
pnpm dq:check

# Test data quality watch
pnpm dq:watch

# Test backfill script
pnpm backfill:creator-daily --since=2024-01-01 --until=2024-01-03 --dry-run
```

## Monitoring

### Health Checks
```bash
# Check backfill endpoint
curl -I https://your-domain.com/api/ops/creator-backfill

# Check data quality endpoint
curl -I https://your-domain.com/api/ops/creator-dq

# Check data quality watch endpoint
curl -I https://your-domain.com/api/ops/creator-dq-watch
```

### Logs
- Backfill progress: Server logs
- Data quality violations: Slack notifications
- Errors: Server logs + Slack alerts

## Troubleshooting

### Common Issues

**Backfill fails with database errors:**
- Check database connection
- Verify CreatorDaily table exists
- Check for data corruption

**Data quality violations:**
- Review scoring algorithm implementation
- Check for data type mismatches
- Verify calculation precision

**Slack notifications not working:**
- Verify `SLACK_WEBHOOK_URL` is set
- Check webhook URL is valid
- Test with manual curl request

**HMAC signature errors:**
- Verify `OPS_SECRET` is set correctly
- Check signature generation matches verification
- Ensure consistent encoding

### Debug Commands

```bash
# Check database connection
pnpm exec prisma db pull

# Test HMAC signature
echo -n 'test' | openssl dgst -sha256 -hmac "$OPS_SECRET" -binary | xxd -p

# Test Slack webhook
curl -X POST "$SLACK_WEBHOOK_URL" -H "Content-Type: application/json" -d '{"text":"Test message"}'
```

## Performance Considerations

- **Batch size**: Larger batches = fewer DB calls, but more memory usage
- **Concurrency**: Higher concurrency = faster processing, but more DB load
- **Rate limiting**: 1s pause between batch chunks to avoid overwhelming DB
- **Memory**: Each batch processes all creators for the date range

## Security

- All endpoints require HMAC authentication
- Creator IDs are hashed in Slack notifications for privacy
- No sensitive data in logs or notifications
- Rate limiting on all endpoints

## Future Enhancements

- Redis-based job tracking for production
- Webhook retry logic with exponential backoff
- Data quality metrics dashboard
- Automated remediation for common violations
- Integration with monitoring systems (PagerDuty, etc.)
