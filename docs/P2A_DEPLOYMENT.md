# Predikt Prediction-to-Action v1 - Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Database migrated to PostgreSQL
- [ ] Redis instance configured
- [ ] Environment variables set
- [ ] Feature flags configured
- [ ] Jupiter API keys obtained
- [ ] Webhook HMAC secret generated

### 2. Security Review
- [ ] HTTPS-only webhooks in production
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] HMAC signing enabled

### 3. Monitoring Setup
- [ ] Health check endpoints configured
- [ ] SLO monitoring enabled
- [ ] Synthetic tests scheduled
- [ ] Alert webhooks configured
- [ ] Logging configured

## Deployment Steps

### Step 1: Database Migration
```bash
# Run Prisma migrations
npx prisma migrate deploy

# Verify tables created
npx prisma db pull
```

### Step 2: Feature Flag Configuration
```bash
# Set feature flags (start with disabled)
export FEATURE_ACTIONS=false
export FEATURE_EMBED_INTENT=false

# Set canary rollout percentages
export FEATURE_ACTIONS_ROLLOUT=10
export FEATURE_EMBED_INTENT_ROLLOUT=10
```

### Step 3: Deploy Application
```bash
# Build application
npm run build

# Deploy to production
npm run deploy
```

### Step 4: Verify Deployment
```bash
# Check health endpoints
curl https://your-domain.com/api/health/p2a

# Run smoke tests
npm run p2a:test

# Check feature flags
curl https://your-domain.com/api/flags
```

### Step 5: Enable Canary Rollout
```bash
# Enable for 10% of users
export FEATURE_ACTIONS_ROLLOUT=10
export FEATURE_EMBED_INTENT_ROLLOUT=10

# Redeploy with canary enabled
npm run deploy
```

### Step 6: Monitor and Scale
```bash
# Monitor SLOs
npm run p2a:slo

# Check synthetic tests
npm run p2a:synthetic

# Monitor logs for errors
tail -f /var/log/predikt/p2a.log
```

## Production Configuration

### Vercel Deployment
```json
{
  "env": {
    "FEATURE_ACTIONS": "false",
    "FEATURE_EMBED_INTENT": "false",
    "FEATURE_ACTIONS_ROLLOUT": "10",
    "FEATURE_EMBED_INTENT_ROLLOUT": "10",
    "JUPITER_BASE_URL": "https://quote-api.jup.ag",
    "JUPITER_API_KEY": "your_jupiter_key",
    "WEBHOOK_HMAC_SECRET": "your_hmac_secret",
    "PREDIKT_BASE_URL": "https://predikt.fi",
    "DATABASE_URL": "postgresql://...",
    "REDIS_URL": "redis://...",
    "REDIS_TOKEN": "your_redis_token"
  }
}
```

### Docker Configuration
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Kubernetes Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: predikt-p2a
spec:
  replicas: 3
  selector:
    matchLabels:
      app: predikt-p2a
  template:
    metadata:
      labels:
        app: predikt-p2a
    spec:
      containers:
      - name: predikt-p2a
        image: predikt/p2a:latest
        ports:
        - containerPort: 3000
        env:
        - name: FEATURE_ACTIONS
          value: "false"
        - name: FEATURE_EMBED_INTENT
          value: "false"
        - name: FEATURE_ACTIONS_ROLLOUT
          value: "10"
        - name: FEATURE_EMBED_INTENT_ROLLOUT
          value: "10"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: predikt-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: predikt-secrets
              key: redis-url
```

## Monitoring and Alerting

### Health Check Endpoints
- `GET /api/health/p2a` - P2A system health
- `GET /api/health/alerts` - Alerts system health
- `GET /api/public/intents/{id}` - Intent status

### SLO Monitoring
```bash
# Run SLO monitoring
npm run p2a:slo

# Expected SLOs:
# - Simulation latency P95 < 1.5s
# - Execution success rate > 99%
# - Guard violation rate < 5%
# - Embed load time < 500ms
```

### Synthetic Tests
```bash
# Run synthetic tests
npm run p2a:synthetic

# Schedule every 10 minutes
*/10 * * * * cd /app && npm run p2a:monitor
```

### Alert Configuration
```bash
# Slack webhook for alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Discord webhook for alerts
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# PagerDuty for critical alerts
PAGERDUTY_INTEGRATION_KEY=your_key
```

## Rollback Procedures

### Emergency Rollback
```bash
# Disable all P2A features
export FEATURE_ACTIONS=false
export FEATURE_EMBED_INTENT=false

# Redeploy immediately
npm run deploy

# Verify rollback
curl https://your-domain.com/api/health/p2a
```

### Gradual Rollback
```bash
# Reduce canary percentage
export FEATURE_ACTIONS_ROLLOUT=0
export FEATURE_EMBED_INTENT_ROLLOUT=0

# Redeploy
npm run deploy

# Monitor for 30 minutes
# Then disable completely if needed
```

## Performance Optimization

### Database Optimization
```sql
-- Add indexes for P2A tables
CREATE INDEX idx_intents_wallet_created ON intents(wallet_id, created_at);
CREATE INDEX idx_intents_base_quote ON intents(base, quote);
CREATE INDEX idx_receipts_intent_created ON intent_receipts(intent_id, created_at);
CREATE INDEX idx_receipts_status ON intent_receipts(status);
```

### Redis Configuration
```bash
# Redis configuration for P2A
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### Rate Limiting
```bash
# Configure rate limits
RATE_LIMIT_FREE=10
RATE_LIMIT_PRO=100
RATE_LIMIT_ADVISOR_READ=30
RATE_LIMIT_ADVISOR_WRITE=10
RATE_LIMIT_ALERTS=5
```

## Security Hardening

### Webhook Security
- Only HTTPS URLs in production
- HMAC signature verification
- Rate limiting per webhook
- Delivery status tracking

### API Security
- CSRF protection on write operations
- Input validation with Zod schemas
- Rate limiting per user/IP
- Request sanitization

### Database Security
- Connection pooling
- SSL/TLS encryption
- Regular backups
- Access logging

## Troubleshooting

### Common Issues

**Feature flags not working**
```bash
# Check environment variables
env | grep FEATURE

# Verify NODE_ENV
echo $NODE_ENV

# Restart application
pm2 restart predikt
```

**Database connection issues**
```bash
# Test database connection
npx prisma db pull

# Check connection pool
npx prisma studio
```

**Jupiter API errors**
```bash
# Test Jupiter API
curl https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000000

# Check API key
echo $JUPITER_API_KEY
```

**Webhook delivery failures**
```bash
# Check webhook logs
tail -f /var/log/predikt/webhooks.log

# Test webhook endpoint
curl -X POST https://your-webhook-url.com/predikt \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=p2a:*
NODE_ENV=development

# Run with debug output
npm run dev
```

### Performance Issues
```bash
# Check database performance
npx prisma db pull

# Monitor Redis usage
redis-cli info memory

# Check application metrics
curl https://your-domain.com/api/health/p2a
```

## Post-Deployment Verification

### 1. Functional Testing
```bash
# Run integration tests
npm run test:p2a

# Run smoke tests
npm run p2a:test

# Test embed functionality
curl https://your-domain.com/embed/intent/test-id
```

### 2. Performance Testing
```bash
# Load test Actions page
ab -n 1000 -c 10 https://your-domain.com/advisor/actions

# Load test API endpoints
ab -n 1000 -c 10 https://your-domain.com/api/intents/create
```

### 3. Security Testing
```bash
# Test CSRF protection
curl -X POST https://your-domain.com/api/intents/create \
  -H "Content-Type: application/json" \
  -d '{"test": "csrf"}'

# Test rate limiting
for i in {1..20}; do curl https://your-domain.com/api/intents/create; done
```

### 4. Monitoring Verification
```bash
# Check health endpoints
curl https://your-domain.com/api/health/p2a

# Run SLO monitoring
npm run p2a:slo

# Run synthetic tests
npm run p2a:synthetic
```

## Success Criteria

### Technical Metrics
- [ ] All health checks passing
- [ ] SLOs within acceptable ranges
- [ ] Synthetic tests passing
- [ ] No critical errors in logs
- [ ] Response times < 2s P95

### Business Metrics
- [ ] Intent creation rate > 0
- [ ] Simulation success rate > 95%
- [ ] Execution success rate > 99%
- [ ] User engagement with Actions page
- [ ] Embed widget usage

### Security Metrics
- [ ] No CSRF bypasses
- [ ] Rate limiting working
- [ ] Webhook security enforced
- [ ] Input validation working
- [ ] No data leaks
