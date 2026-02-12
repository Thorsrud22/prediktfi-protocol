# Deploy Parity Checklist

This project has multiple local clones on the same machine. Always run this checklist to keep `localhost:3000` equal to `prediktfi.xyz`.

## Canonical Source

- Canonical repo path: `/Users/thorsrud/prediktfi-protocol-1`
- Canonical production branch: `ag-new-concept`
- Deploy method: Git-triggered deploys only from canonical repo

## Before Development

1. `cd /Users/thorsrud/prediktfi-protocol-1`
2. `git checkout ag-new-concept`
3. `git pull origin ag-new-concept`
4. Start local app from this folder only:
   - `npm run dev`

## Before Deploy

1. Verify tests/build:
   - `npm test -- tests/keyboard-navigation.test.tsx`
   - `npm test -- tests/validation.test.tsx`
   - `npm test -- tests/studio.test.tsx`
   - `npm test -- tests/pricing-page.test.tsx`
   - `npm run build`
2. Verify local build metadata:
   - `curl -s http://localhost:3000/api/status`
3. Verify pricing marker route visually:
   - `http://localhost:3000/pricing`

## Deploy

1. Commit changes on `ag-new-concept`.
2. Push using guarded workflow:
   - `npm run deploy:prod`
3. Wait for Vercel production deployment to finish.

## After Deploy

1. Verify production build metadata:
   - `curl -s https://prediktfi.xyz/api/status`
2. Verify pricing route parity:
   - `https://prediktfi.xyz/pricing`
3. Confirm local and production match for:
   - branch/commit from `/api/status`
   - pricing visuals and nav treatment
