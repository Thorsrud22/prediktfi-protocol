# Predikt Prediction-to-Action v1 - Environment Configuration

## Required Environment Variables

### Feature Flags
```bash
# Enable P2A features (default: false in production)
FEATURE_ACTIONS=true
FEATURE_EMBED_INTENT=true

# Canary rollout percentages (default: 10%)
FEATURE_ACTIONS_ROLLOUT=10
FEATURE_EMBED_INTENT_ROLLOUT=10
```

### Jupiter API Configuration
```bash
# Jupiter aggregator API
JUPITER_BASE_URL=https://quote-api.jup.ag
JUPITER_API_KEY=your_jupiter_api_key_here

# Optional: Custom Jupiter endpoints
JUPITER_QUOTE_URL=https://quote-api.jup.ag/v6/quote
JUPITER_SWAP_URL=https://quote-api.jup.ag/v6/swap
```

### Security Configuration
```bash
# Webhook HMAC secret (generate a random string)
WEBHOOK_HMAC_SECRET=your_random_hmac_secret_here

# Base URL for webhooks and embeds
PREDIKT_BASE_URL=https://your-domain.com

# CSRF protection
CSRF_SECRET=your_csrf_secret_here
```

### Database Configuration
```bash
# PostgreSQL database URL
DATABASE_URL=postgresql://username:password@localhost:5432/predikt

# Redis for idempotency and caching
REDIS_URL=redis://localhost:6379
REDIS_TOKEN=your_redis_token_here
```

### Monitoring Configuration
```bash
# SLO monitoring thresholds
SLO_SIMULATION_LATENCY_P95=1500
SLO_EXECUTION_SUCCESS_RATE=99
SLO_GUARD_VIOLATION_RATE=5
SLO_EMBED_LOAD_TIME=500

# Alert webhooks
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
PAGERDUTY_INTEGRATION_KEY=your_pagerduty_key
```

### Rate Limiting Configuration
```bash
# Rate limits (requests per minute)
RATE_LIMIT_FREE=10
RATE_LIMIT_PRO=100
RATE_LIMIT_ADVISOR_READ=30
RATE_LIMIT_ADVISOR_WRITE=10
RATE_LIMIT_ALERTS=5
```

## Development Environment

### Local Development
```bash
# .env.local
NODE_ENV=development
DATABASE_URL=file:./dev.db
FEATURE_ACTIONS=true
FEATURE_EMBED_INTENT=true
JUPITER_BASE_URL=https://quote-api.jup.ag
WEBHOOK_HMAC_SECRET=dev-secret-key
PREDIKT_BASE_URL=http://localhost:3000
```

### Staging Environment
```bash
# .env.staging
NODE_ENV=staging
DATABASE_URL=postgresql://staging_user:password@staging-db:5432/predikt_staging
FEATURE_ACTIONS=true
FEATURE_EMBED_INTENT=true
JUPITER_BASE_URL=https://quote-api.jup.ag
JUPITER_API_KEY=staging_jupiter_key
WEBHOOK_HMAC_SECRET=staging-hmac-secret
PREDIKT_BASE_URL=https://staging.predikt.fi
REDIS_URL=redis://staging-redis:6379
```

## Production Environment

### Production Configuration
```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:secure_password@prod-db:5432/predikt_prod
FEATURE_ACTIONS=false
FEATURE_EMBED_INTENT=false
FEATURE_ACTIONS_ROLLOUT=10
FEATURE_EMBED_INTENT_ROLLOUT=10
JUPITER_BASE_URL=https://quote-api.jup.ag
JUPITER_API_KEY=production_jupiter_key
WEBHOOK_HMAC_SECRET=production-hmac-secret-32-chars-min
PREDIKT_BASE_URL=https://predikt.fi
REDIS_URL=redis://prod-redis:6379
REDIS_TOKEN=production_redis_token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/prod/...
SLO_SIMULATION_LATENCY_P95=1500
SLO_EXECUTION_SUCCESS_RATE=99
SLO_GUARD_VIOLATION_RATE=5
```

## Security Considerations

### HMAC Secret Generation
```bash
# Generate a secure HMAC secret
openssl rand -hex 32
```

### Database Security
- Use connection pooling
- Enable SSL/TLS
- Use read replicas for analytics
- Regular backups

### Redis Security
- Use AUTH token
- Enable TLS
- Restrict network access
- Regular key expiration

### Webhook Security
- Only HTTPS URLs in production
- HMAC signature verification
- Rate limiting per webhook
- Delivery status tracking

## Monitoring Setup

### Health Checks
```bash
# P2A health check endpoint
curl https://predikt.fi/api/health/p2a

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "duration": 150,
  "features": {
    "actions": true,
    "embed": true
  },
  "checks": [...],
  "summary": {
    "total": 5,
    "passed": 5,
    "failed": 0
  }
}
```

### Synthetic Tests
```bash
# Run synthetic tests
npm run p2a:synthetic

# Run SLO monitoring
npm run p2a:slo

# Run full monitoring cycle
npm run p2a:monitor
```

### Cron Jobs
```bash
# Add to crontab for production monitoring
*/10 * * * * cd /path/to/predikt && npm run p2a:monitor
```

## Troubleshooting

### Common Issues

**Feature flags not working**
- Check environment variable names
- Verify NODE_ENV is set correctly
- Restart application after changes

**Jupiter API errors**
- Verify API key is valid
- Check rate limits
- Monitor API status page

**Database connection issues**
- Verify DATABASE_URL format
- Check network connectivity
- Monitor connection pool

**Webhook delivery failures**
- Verify HTTPS URLs in production
- Check HMAC secret configuration
- Monitor delivery logs

### Debug Mode
```bash
# Enable debug logging
DEBUG=p2a:*
NODE_ENV=development
```

### Performance Tuning
```bash
# Database connection pool
DATABASE_POOL_SIZE=20
DATABASE_POOL_TIMEOUT=30000

# Redis configuration
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=1000

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=true
```
