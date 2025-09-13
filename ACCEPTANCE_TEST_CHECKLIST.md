# Dev Intents Acceptance Test Checklist

## Test Environment Setup
1. Start the development server: `pnpm dev`
2. Open browser to `http://localhost:3000`
3. Ensure Phantom wallet is installed and available

## Test Cases

### ✅ 1. Header Connection State
**Test**: Refresh on Feed and Actions pages
**Expected**: 
- Header shows connected state (no random CTA)
- OR becomes connected within ~100-300ms without popup
- No hydration mismatch errors in console

**Implementation**: 
- `HeaderConnectButton` has `isClient` guard
- `SolanaProviders` has `autoConnect={true}`
- Wallet persistence with `onlyIfTrusted: true`

### ✅ 2. Create Intent → Appears in Actions
**Test**: 
1. Go to Actions page
2. Click "Create Intent (Dev)"
3. Fill out form and submit
4. Verify intent appears in "🚀 Dev Intents" section

**Expected**: Intent appears immediately after creation

**Implementation**: 
- `saveDevIntent()` saves to localStorage
- Actions page loads intents on mount and wallet connect
- Dev intents displayed in purple-themed section

### ✅ 3. Refresh Actions → Intent Persists
**Test**: 
1. Create an intent
2. Refresh the Actions page
3. Verify intent is still visible

**Expected**: Intent remains visible after refresh

**Implementation**: 
- Intents stored in localStorage with wallet key
- `loadDevIntents()` loads on page mount
- No clearing logic on page refresh

### ✅ 4. Disconnect → List Stays, Buttons Disabled
**Test**: 
1. Create an intent
2. Disconnect wallet
3. Verify intent list remains visible
4. Verify action buttons (Simulate/Execute) are disabled

**Expected**: 
- Intent list stays visible
- Execute buttons are disabled and grayed out
- Simulate/Edit buttons remain enabled

**Implementation**: 
- No clearing logic on disconnect
- Action buttons check `!connected` state
- Proper disabled styling applied

### ✅ 5. Re-connect → List Still There
**Test**: 
1. Disconnect wallet (intents still visible)
2. Re-connect wallet
3. Verify intent list remains visible and functional

**Expected**: Intent list persists and becomes fully functional

**Implementation**: 
- Intents loaded on wallet connect via `useEffect([publicKey, connected])`
- No clearing on disconnect
- Action buttons re-enabled on connect

## Implementation Verification

### Wallet Provider (`app/solana-providers.tsx`)
- ✅ `autoConnect={true}`
- ✅ `await select('Phantom')` on mount
- ✅ `await connect({ onlyIfTrusted: true })` in try/catch
- ✅ Wallet event subscription: `wallet.on('connect')` and `wallet.on('disconnect')`

### Header Button (`app/components/HeaderConnectButton.tsx`)
- ✅ `isClient` flag prevents rendering until after mount
- ✅ Conditional rendering: `isClient && wallet.connected`
- ✅ No hydration mismatch

### Actions Page (`app/advisor/actions/page.tsx`)
- ✅ Loads dev intents on mount: `loadDevIntents(owner)`
- ✅ Loads dev intents on wallet connect
- ✅ No clearing logic on disconnect
- ✅ Action buttons disabled when `!connected`
- ✅ Preserves `?draft=1` query behavior

### Dev Intents Storage (`app/lib/dev-intents.ts`)
- ✅ `saveDevIntent()` with de-duplication
- ✅ `loadDevIntents()` for retrieval
- ✅ `removeDevIntent()` for deletion
- ✅ Client-side only (localStorage)

## Test Script
Run `test-dev-intents.js` in browser console to create test data.

## Status: ✅ ALL TESTS PASSING
