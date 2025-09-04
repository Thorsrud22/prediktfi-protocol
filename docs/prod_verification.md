# Production Verification Checklist

## Required Manual Checks After Each Production Deploy

### 1. Status Endpoint Verification
```bash
curl https://[your-production-domain]/api/status
```

**Must verify:**
- `"status": "healthy"`
- `"environment": "production"`
- `"commitSha"` matches expected deployment
- `"buildTime"` is within last hour

### 2. Core E8 Functionality
```bash
# Studio page loads
curl -I https://[your-production-domain]/studio

# Analysis endpoint exists (should return 501 for E8 stub)
curl -I https://[your-production-domain]/api/analysis
```

### 3. Redirect Verification
Test that old paths redirect to `/studio`:
```bash
curl -I https://[your-production-domain]/trade
curl -I https://[your-production-domain]/paper
curl -I https://[your-production-domain]/markets
```

**Expected:** HTTP 30x with Location header pointing to `/studio`

### 4. Content Verification
- Home page mentions "AI prediction studio", "freemium quotas", "shareable insights"
- No references to trading, betting, or gambling
- Studio page loads with E8 UI components

### 5. Build Validation (Pre-Deploy)
Automated checks that should be in CI/CD:
```bash
# Verify app root is correct (not /web)
[ -f "app/page.tsx" ] || exit 1

# Verify status endpoint exists
[ -f "app/api/status/route.ts" ] || exit 1

# Run smoke test locally
./smoke-e8.sh http://localhost:3000
```

## Emergency Rollback Process

### If Production Shows Wrong Version:

1. **Immediate Action:**
   ```bash
   # In Vercel dashboard:
   # 1. Go to Deployments
   # 2. Find deployment with e8_stable commit SHA
   # 3. Click "Promote to Production"
   ```

2. **Verify Rollback:**
   ```bash
   curl https://[domain]/api/status | jq '.build.commitSha'
   # Should match e8_stable tag
   ```

3. **Document in GitHub:**
   - Comment on active PR with before/after commit SHAs
   - Note timestamp of rollback

## Branch Protection Setup

**Required GitHub settings:**
- Branch protection on `main` branch
- Require status checks before merge
- Require up-to-date branches
- No direct pushes to production branch

## Deployment Aliases/Channels

**Vercel configuration:**
- Use production branch: `main` (or designated release branch)
- Never auto-deploy from feature branches
- Require manual promotion for production deploys

## Tags for Stability

**Current stable tags:**
- `e8_stable`: Last known good E8 implementation
- `production_stable`: Last verified production deploy

**Rollback command:**
```bash
# Create new release branch from stable tag
git checkout -b hotfix_rollback e8_stable
git push origin hotfix_rollback

# Then deploy hotfix_rollback in Vercel
```
