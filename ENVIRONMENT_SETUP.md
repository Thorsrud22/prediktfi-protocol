# Environment Setup for Production

## Required Environment Variables

### Core System
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/prediktfi  # Production PostgreSQL
# DATABASE_URL=file:./dev.db  # Development SQLite

# Site configuration
NEXT_PUBLIC_SITE_URL=https://predikt.io  # Production domain
```

### BLOKK 5-7: Resolution & Scoring System
```bash
# Resolution system security
RESOLUTION_CRON_KEY=your_32_char_resolution_cron_key_here

# Redis for caching and rate limiting (production)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here

# Error monitoring (optional but recommended)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

### Feature Flags
```bash
# Resolution system toggles
PRICE_RESOLUTION=true
URL_RESOLUTION=true
AUTO_RESOLVE_HIGH_CONFIDENCE=0.9
SOCIAL_SHARING=true

# Price resolution sources
PRICE_PRIMARY=coingecko
PRICE_SECONDARY=coincap
```

## Deployment Checklist

### Staging Environment
- [ ] All environment variables set
- [ ] Database migrated (`npx prisma migrate deploy`)
- [ ] Redis connection tested
- [ ] Sentry error tracking active
- [ ] Health checks responding (GET /api/healthz)

### Production Environment
- [ ] All environment variables set with production values
- [ ] Database migrated and backed up
- [ ] Redis cluster configured
- [ ] Sentry configured with production DSN
- [ ] Cron jobs configured (Vercel Cron or GitHub Actions)
- [ ] Health monitoring active

## Cron Jobs Configuration

### Vercel Cron (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/resolve/run",
      "schedule": "10 * * * *"
    },
    {
      "path": "/api/cron/recompute-scores",
      "schedule": "20 0 * * *"
    }
  ]
}
```

### GitHub Actions Alternative
```yaml
# .github/workflows/cron-resolve.yml
name: Resolution Cron
on:
  schedule:
    - cron: '10 * * * *'  # Every hour at :10
jobs:
  resolve:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Resolution
        run: |
          curl -X GET "${{ secrets.SITE_URL }}/api/resolve/run" \
            -H "X-Cron-Key: ${{ secrets.RESOLUTION_CRON_KEY }}"

# .github/workflows/cron-scores.yml  
name: Score Recomputation
on:
  schedule:
    - cron: '20 0 * * *'  # Daily at 00:20 UTC
jobs:
  recompute:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Score Recomputation
        run: |
          curl -X GET "${{ secrets.SITE_URL }}/api/cron/recompute-scores" \
            -H "X-Cron-Key: ${{ secrets.RESOLUTION_CRON_KEY }}"
```

## Health Checks

### API Endpoints
- `GET /api/healthz` - System health
- `GET /api/resolve/run` - Resolution system health (with cron key)
- `HEAD /api/leaderboard` - Leaderboard system health

### Expected Response
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "resolution": "active"
  }
}
```

## Monitoring & Alerts

### Key Metrics to Monitor
- API response times (< 500ms p95)
- Database connection pool usage
- Redis cache hit rate (> 80%)
- Resolution success rate (> 95%)
- Score recomputation completion time

### Alert Conditions
- Health check failures (> 5 minutes)
- Resolution cron job failures
- Database connection errors
- High error rates (> 5% in 10 minutes)
- Memory usage > 80%

## Security Considerations

### Secrets Management
- Use environment-specific secret stores (Vercel Secrets, GitHub Secrets)
- Rotate RESOLUTION_CRON_KEY monthly
- Monitor for unauthorized API access
- Enable rate limiting on all public endpoints

### Network Security
- HTTPS only in production
- CORS configured for your domain
- Redis connection secured with TLS
- Database connection with SSL
