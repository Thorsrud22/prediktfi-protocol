# 🚀 Production Launch Checklist

**Use this checklist for deploying Predikt to production on Vercel**

## Pre-Deployment Setup

### 1. Environment Variables Configuration
**Vercel Project Settings → Environment Variables**

#### Required Production Variables
- [ ] `PREDIKT_BASE_URL=https://your-domain.com`
- [ ] `PREDIKT_LICENSE_SECRET=` (32+ character random string)
- [ ] `COINBASE_COMMERCE_API_KEY=` (Production API key)
- [ ] `COINBASE_COMMERCE_SHARED_SECRET=` (Production webhook secret)
- [ ] `NEXT_PUBLIC_APP_ENV=production`
- [ ] `NEXT_PUBLIC_PRO_BYPASS_ENABLED=true`
- [ ] `WEBHOOK_IDEMPOTENCY_SECRET=` (32+ character random string)
- [ ] `ENABLE_ANALYTICS=true`

#### Optional Variables
- [ ] `PREDIKT_COOKIE_DOMAIN=` (your-domain.com - optional)
- [ ] `SOLANA_CLUSTER=mainnet-beta` (for production blockchain)
- [ ] `SOLANA_RPC_URL=` (production RPC endpoint)

#### Environment Validation
- [ ] All secrets are 32+ characters
- [ ] PREDIKT_BASE_URL uses https://
- [ ] No trailing slashes in URLs
- [ ] All required variables set for Production AND Preview environments

---

## 2. Vercel Deployment Configuration

### Build Settings
- [ ] **Framework Preset:** Next.js
- [ ] **Node.js Version:** 18.x or higher
- [ ] **Build Command:** `npm run build` or `pnpm build`
- [ ] **Output Directory:** `.next` (default)
- [ ] **Install Command:** `npm install` or `pnpm install`

### Domain Configuration
- [ ] Custom domain connected
- [ ] SSL certificate configured (automatic with Vercel)
- [ ] DNS records pointing to Vercel
- [ ] Domain matches PREDIKT_BASE_URL environment variable

---

## 3. Coinbase Commerce Setup

### Webhook Configuration
- [ ] Create webhook endpoint in Coinbase Commerce dashboard
- [ ] Set webhook URL to: `https://your-domain.com/api/billing/webhook`
- [ ] Copy webhook shared secret to `COINBASE_COMMERCE_SHARED_SECRET`
- [ ] Test webhook delivery with sandbox transaction

### API Keys
- [ ] Generate production API key in Coinbase Commerce
- [ ] Set `COINBASE_COMMERCE_API_KEY` with production key
- [ ] Verify API key has correct permissions
- [ ] Test checkout creation with production credentials

---

## 4. Pre-Launch Testing

### Build Verification
- [ ] Run `npm run build` locally without errors
- [ ] Deploy to Vercel preview environment
- [ ] Verify preview build completes successfully
- [ ] Check Vercel function logs for errors

### Health Check Validation
- [ ] Visit `https://your-domain.com/api/_internal/health`
- [ ] Verify response: `{"ok": true, "ts": 1234567890}`
- [ ] HTTP status code is 200
- [ ] Response time under 1 second

### Security Headers Verification
**Open browser DevTools → Network → Check response headers:**
- [ ] `Strict-Transport-Security` header present
- [ ] `X-Frame-Options: DENY` header present
- [ ] `X-Content-Type-Options: nosniff` header present
- [ ] `Content-Security-Policy` header present
- [ ] CSP allows `commerce.coinbase.com` domains

### Core Functionality Testing
- [ ] Homepage loads correctly
- [ ] `/pricing` page accessible
- [ ] `/account` page shows correct plan status
- [ ] `/status` page displays build information
- [ ] Pro badge displays correctly in navbar (if Pro user)

---

## 5. Payment Flow Testing

### Sandbox Testing (Pre-Production)
- [ ] Set Coinbase to sandbox mode
- [ ] Complete full payment flow: Pricing → Checkout → Payment → Success
- [ ] Verify webhook receives payment confirmation
- [ ] Test license redemption with received code
- [ ] Confirm Pro cookie is set correctly
- [ ] Verify Pro status shows in `/account` and navbar

### Production Payment Validation
- [ ] Switch Coinbase to production mode
- [ ] Test checkout creation (don't complete payment)
- [ ] Verify webhook endpoint responds to test pings
- [ ] Monitor webhook logs in Vercel Functions tab

---

## 6. Pro User Experience Testing

### Rate Limiting Bypass
- [ ] Test as Free user: hit rate limits on `/api/ai/predict`
- [ ] Redeem Pro license and become Pro user
- [ ] Verify Pro user bypasses rate limits
- [ ] Confirm Pro badge appears in navbar
- [ ] Check "Upgrade" button is hidden for Pro users

### Pro Features Access
- [ ] Access `/account` as Pro user
- [ ] Verify Pro features section displays
- [ ] Confirm redeem code section is hidden
- [ ] Test unlimited studio access

---

## 7. Performance & Monitoring

### Performance Verification
- [ ] Lighthouse score > 90 for performance
- [ ] First Contentful Paint < 2 seconds
- [ ] Largest Contentful Paint < 3 seconds
- [ ] Cumulative Layout Shift < 0.1

### Monitoring Setup
- [ ] Configure uptime monitoring for health endpoint
- [ ] Set up alerts for 4xx/5xx errors
- [ ] Monitor Vercel function execution logs
- [ ] Track webhook delivery success rates

---

## 8. Security Verification

### Cookie Security
- [ ] Inspect cookies in browser DevTools
- [ ] Verify `HttpOnly` flag is set
- [ ] Verify `Secure` flag is set (production only)
- [ ] Verify `SameSite=Lax` is set
- [ ] Confirm cookie domain matches site domain

### CSP Compliance
- [ ] Check browser console for CSP violations
- [ ] Test Coinbase checkout embeds work correctly
- [ ] Verify no mixed content warnings
- [ ] Confirm all scripts and styles load properly

---

## 9. Post-Launch Validation

### Immediate Checks (Within 1 Hour)
- [ ] Health endpoint returning 200
- [ ] No 5xx errors in Vercel logs
- [ ] DNS resolution working globally
- [ ] SSL certificate valid and trusted
- [ ] All pages loading without errors

### 24-Hour Monitoring
- [ ] Monitor payment webhook delivery rates
- [ ] Check for any rate limiting issues
- [ ] Verify analytics logs are being generated
- [ ] Monitor user sign-up and conversion rates

### Weekly Review
- [ ] Review Vercel function performance metrics
- [ ] Check for any security alerts or violations
- [ ] Monitor user feedback and support requests
- [ ] Validate backup and rollback procedures

---

## 🚨 Emergency Procedures

### Immediate Rollback (if needed)
1. **Vercel Dashboard:** Revert to previous deployment
2. **DNS:** Point domain to maintenance page if needed
3. **Webhooks:** Disable Coinbase webhook endpoint
4. **Monitoring:** Alert team and stakeholders

### Partial Issues
- **Payment Issues:** Temporarily disable payment processing
- **Rate Limiting:** Increase limits via environment variables
- **Security:** Temporarily adjust CSP headers if needed

---

## ✅ Launch Completion

### Sign-Off Checklist
- [ ] All technical validations passed
- [ ] Payment flow tested end-to-end
- [ ] Security headers verified
- [ ] Performance benchmarks met
- [ ] Monitoring and alerts configured
- [ ] Team notified of successful launch
- [ ] Documentation updated with production URLs

### Post-Launch Communication
- [ ] Announce beta launch to stakeholders
- [ ] Update documentation with production endpoints
- [ ] Share status page URL for monitoring
- [ ] Prepare user onboarding materials

---

**🎉 Ready for Beta Launch!**

*Complete this checklist thoroughly before going live. Each check mark represents critical validation for production readiness.*
