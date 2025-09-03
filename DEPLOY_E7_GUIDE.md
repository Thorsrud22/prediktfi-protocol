# 🚀 BLOCK E7 — Beta Launch on Vercel + Smoke Tests

## Overview
This guide covers deploying Predikt Protocol to Vercel production with proper environment configuration and automated smoke testing.

## Prerequisites Checklist

### ✅ Code Preparation
- [ ] E5/E6 blocks completed and merged
- [ ] Production-safe cookies and security headers implemented
- [ ] `/status` and `/api/_internal/health` endpoints available
- [ ] All environment variables documented

### ✅ Service Accounts
- [ ] **Coinbase Commerce**: API key and shared secret (sandbox or live)
- [ ] **License System**: Strong secret for HMAC signing
- [ ] **GitHub**: Repository access for commit metadata

## 🔧 Vercel Environment Variables

Set these in **Vercel Project → Settings → Environment Variables** for **Production**:

### Required Production Variables
```bash
# Base configuration
PREDIKT_BASE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_ENV=production
NODE_ENV=production

# Coinbase Commerce (Production or Sandbox)
COINBASE_COMMERCE_API_KEY=your_coinbase_api_key
COINBASE_COMMERCE_SHARED_SECRET=your_coinbase_shared_secret

# License system
PREDIKT_LICENSE_SECRET=your_strong_hmac_secret_32_chars_min

# GitHub metadata (auto-populated by Vercel)
GITHUB_REPOSITORY=your-username/prediktfi-protocol
```

### Optional Variables
```bash
# Build metadata
BUILD_TIME=auto_populated_by_vercel
VERCEL_GIT_COMMIT_SHA=auto_populated
VERCEL_GIT_COMMIT_MESSAGE=auto_populated  
VERCEL_GIT_COMMIT_AUTHOR_LOGIN=auto_populated
```

## 📦 Deployment Steps

### 1. Deploy to Vercel
```bash
# Option A: Vercel CLI
vercel --prod

# Option B: GitHub Integration
# Push to main branch → auto-deploy
git push origin main
```

### 2. Verify Deployment
```bash
# Set your production URL
export PREDIKT_BASE_URL=https://your-domain.vercel.app

# Run smoke tests
./scripts/smoke-e7.sh
```

### 3. Post-Deployment Checklist
- [ ] Status page shows correct build metadata: `/status`
- [ ] Health endpoint responds: `/api/_internal/health`
- [ ] Analytics endpoints working
- [ ] Pricing page loads correctly
- [ ] Billing endpoints respond appropriately
- [ ] No Mock Mode indicators visible in production

## 🧪 Smoke Testing

### Local Testing
```bash
# Start dev server
pnpm dev

# Run tests in new terminal
./scripts/smoke-e7.sh
```

### Production Testing
```bash
# Test against production
PREDIKT_BASE_URL=https://your-domain.vercel.app ./scripts/smoke-e7.sh
```

### Expected Results
```
✅ /status 200
✅ /api/_internal/health 200  
✅ GET /api/analytics 204
✅ POST /api/analytics 204
✅ /pricing 200
✅ POST /api/billing/checkout 302
✅ POST /api/billing/redeem returns 4xx (422)
🎉 Smoke tests passed.
```

## 🔍 Status Page Enhancement

The `/status` page now displays:
- **Plan Status**: Current user's plan (Pro/Free)
- **Health Status**: System operational indicator
- **Build Information**:
  - Environment (production/development)
  - Node.js environment
  - Git commit SHA (linked to GitHub if available)
  - Build timestamp
  - Last commit message
  - Commit author

## 🚨 Troubleshooting

### Common Issues

**1. Build metadata not showing**
- Verify Vercel Git integration is enabled
- Check `GITHUB_REPOSITORY` environment variable

**2. Smoke tests failing**
- Verify all environment variables are set
- Check Vercel deployment logs
- Ensure `/api/_internal/health` endpoint exists

**3. Mock Mode showing in production**
- Verify `NEXT_PUBLIC_APP_ENV=production` is set
- Check build logs for environment variable loading

**4. Billing endpoints not working**
- Verify Coinbase Commerce credentials
- Check webhook endpoint configuration
- Ensure license secret is properly set

### Debug Commands
```bash
# Check environment in production
curl https://your-domain.vercel.app/status

# Test individual endpoints
curl -I https://your-domain.vercel.app/api/_internal/health
curl -X POST https://your-domain.vercel.app/api/analytics \
  -H 'Content-Type: application/json' \
  -d '{"event":"test"}'
```

## 📋 Post-Launch Monitoring

### Key Metrics to Monitor
- [ ] Response times for `/status` and `/api/_internal/health`
- [ ] Analytics event processing
- [ ] Billing webhook processing
- [ ] Error rates across API endpoints
- [ ] User plan distribution

### Recommended Tools
- Vercel Analytics
- Vercel Speed Insights  
- External uptime monitoring
- Log aggregation service

## 🎯 Success Criteria

**BLOCK E7 is complete when:**
- [ ] Application successfully deployed to Vercel production
- [ ] All smoke tests pass against production URL
- [ ] Status page displays accurate build metadata
- [ ] No development-only features visible in production
- [ ] All critical API endpoints responding correctly
- [ ] Environment variables properly configured
- [ ] Monitoring and alerting in place

---

**Next Steps:** Monitor production deployment and iterate based on user feedback and performance metrics.
