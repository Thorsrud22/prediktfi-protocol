# Signals API Gradual Rollout Guide

This guide implements the gradual rollout strategy for the Signals API with ETag caching and monitoring.

## 🚀 Quick Start

### 1) Enable for 10% of traffic

Set environment variables (method varies by deployment platform):

```bash
# Environment variables
export SIGNALS=on
export ROLLOUT_PERCENT=10
```

For Vercel deployment:
```bash
vercel env add SIGNALS
# Enter: on

vercel env add ROLLOUT_PERCENT  
# Enter: 10
```

### 2) Smoke Test: Verify ETag and 304 responses

```bash
# Run the smoke test script
./smoke-signals-rollout.sh <your-host>

# Example for production:
./smoke-signals-rollout.sh your-domain.com

# Example for staging:
./smoke-signals-rollout.sh staging.your-domain.com
```

Expected output:
- HTTP 304 responses for cached content
- `X-Cache: HIT-304` header present
- `X-Rollout-Status: enabled` for included users
- `X-Rollout-Status: disabled` for excluded users (503 response)

### 3) Monitor for 30-60 minutes

```bash
# Start continuous monitoring
./monitor-signals-rollout.sh <your-host> 60

# This will track:
# - P95 latency (target: < 200ms)
# - 5xx error rate (target: < 0.5%)
# - Cache hit rate (target: > 60%)
```

### 4) Scale up if metrics look good

```bash
# Scale to 50%
export ROLLOUT_PERCENT=50
# Redeploy and monitor for 30-60 minutes

# Scale to 100%
export ROLLOUT_PERCENT=100
# Final deployment
```

## 📊 Monitoring Targets

### Critical SLOs
- **P95 Latency**: < 200ms
- **5xx Error Rate**: < 0.5%
- **Cache Hit Rate**: > 60% (after warmup period)

### Secondary Metrics
- Simulate/execute latency should remain stable
- Conversion funnel (view→copy, copy→sign) should remain stable

## 🔧 Implementation Details

### Feature Flag System

The rollout uses IP-based consistent hashing:

```typescript
// app/lib/flags.ts
export function shouldEnableSignals(clientIp?: string): boolean {
  const flags = getFeatureFlags();
  
  if (!flags.SIGNALS) return false;
  
  // Always enabled in development/staging
  if (process.env.NODE_ENV !== 'production') return true;
  
  const rolloutPercent = parseInt(process.env.ROLLOUT_PERCENT || '0');
  if (rolloutPercent >= 100) return true;
  if (rolloutPercent <= 0) return false;
  
  // Consistent IP-based rollout
  const hash = hashString(clientIp);
  return (hash % 100) < rolloutPercent;
}
```

### API Response Headers

All responses include rollout tracking headers:

```
X-Rollout-Status: enabled|disabled
X-Rollout-Percent: 10
X-Cache: HIT|MISS|STALE|HIT-304
```

### Disabled Users Response

Users not in the rollout receive:

```http
HTTP/1.1 503 Service Unavailable
X-Rollout-Status: disabled
Retry-After: 3600

{
  "error": "Signals API not available"
}
```

## 🧪 Testing

### Manual Testing

```bash
# Test enabled user (if your IP is in rollout)
curl -v https://your-domain.com/api/public/signals

# Test ETag caching
curl -s -D- https://your-domain.com/api/public/signals | tee /tmp/sig1.txt
E=$(grep -i '^etag:' /tmp/sig1.txt | awk '{print $2}' | tr -d '\r\n')
curl -s -D- -H "If-None-Match: $E" https://your-domain.com/api/public/signals
```

### Automated Testing

```bash
# Quick smoke test
npm run test:signals-rollout

# Extended monitoring
npm run monitor:signals-rollout
```

## 🚨 Rollback Plan

If metrics degrade:

1. **Immediate**: Set `ROLLOUT_PERCENT=0` to disable for new requests
2. **Cache Clear**: Existing cached responses will continue serving
3. **Investigation**: Check logs and metrics for root cause
4. **Gradual Re-enable**: Start with `ROLLOUT_PERCENT=5` after fixes

## 📈 Scaling Strategy

### Phase 1: Initial Rollout (10%)
- Duration: 30-60 minutes
- Focus: Basic functionality and error rates
- Success criteria: No 5xx errors, P95 < 200ms

### Phase 2: Expanded Rollout (50%)
- Duration: 30-60 minutes  
- Focus: Performance under increased load
- Success criteria: Maintained SLOs, stable cache hit rates

### Phase 3: Full Rollout (100%)
- Duration: Ongoing monitoring
- Focus: Long-term stability
- Success criteria: All SLOs maintained, no degradation in user metrics

## 🔍 Troubleshooting

### Common Issues

**High latency (P95 > 200ms)**
- Check if cache is warming up properly
- Verify database performance
- Monitor memory usage

**Low cache hit rate (< 60%)**
- Expected during initial rollout
- Check ETag generation consistency
- Verify cache TTL settings

**5xx errors**
- Check application logs
- Verify database connectivity
- Monitor resource limits

### Debug Commands

```bash
# Check rollout status for specific IP
curl -H "X-Forwarded-For: 1.2.3.4" https://your-domain.com/api/public/signals

# View cache statistics (if implemented)
curl https://your-domain.com/api/admin/cache/signals/stats

# Check feature flag status
curl https://your-domain.com/api/status
```

## 📝 Deployment Checklist

- [ ] Environment variables set (`SIGNALS=on`, `ROLLOUT_PERCENT=10`)
- [ ] Smoke test passes
- [ ] Monitoring dashboard configured
- [ ] Alert thresholds set
- [ ] Rollback plan communicated
- [ ] Stakeholders notified
- [ ] Documentation updated

## 🎯 Success Metrics

After full rollout, expect:

- **Improved API performance**: Faster response times due to caching
- **Reduced server load**: Higher cache hit rates
- **Better user experience**: Consistent, fast market signals
- **Operational efficiency**: Automated rollout and monitoring

The gradual rollout ensures minimal risk while validating performance improvements at each stage.
