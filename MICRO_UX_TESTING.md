# Mikro UX Testing Guide - Phase H

## Quick Testing Checklist

### ✅ CopyButton Component
- [ ] Go to any market detail page
- [ ] Scroll to RefPanel section  
- [ ] Click "Kopier lenke" button
- [ ] Verify button text changes to "Kopiert!" for 2 seconds
- [ ] Check screen reader announcement (inspect element)

### ✅ Amount Presets in Market Detail
- [ ] Navigate to any market (e.g., `/market/bitcoin-2025`) 
- [ ] Scroll to betting section
- [ ] Click "0.05 SOL" preset button
- [ ] Verify input field populates with "0.05"
- [ ] Click "0.1 SOL" and "0.25 SOL" presets  
- [ ] Click "Tøm" button
- [ ] Verify input field clears completely

### ✅ Enhanced Error Validation
- [ ] In betting input, type "abc" or leave empty
- [ ] Verify shows "Ugyldig beløp" message
- [ ] Try typing "NaN" or invalid numbers
- [ ] Confirm consistent error messaging

### ✅ Portfolio Copy Button  
- [ ] Place a test bet or navigate to `/me?sig=test123`
- [ ] Find transaction signature section
- [ ] Click "Kopier signatur" button  
- [ ] Verify confirmation appears for 2 seconds

### ✅ Navigation State Preservation
- [ ] Go to `/markets`
- [ ] Search for "bitcoin" and select "Crypto" category
- [ ] Click on any market
- [ ] Click "Tilbake til markets" button  
- [ ] Verify search and category filter are restored

### ✅ Skeleton Loading
- [ ] Go to `/markets` (hard refresh)
- [ ] Observe 3 skeleton cards for first ~800ms
- [ ] Verify smooth transition to real content

### ✅ URL Parameter Navigation
- [ ] Navigate to `/markets?search=bitcoin&category=Crypto`
- [ ] Verify search field and category are pre-filled
- [ ] Confirm state persistence works with URL params

## Error Message Testing

### Test Error Mapping
```javascript
// Test these scenarios in browser console:
// Network error simulation
fetch('/api/nonexistent').catch(console.log)

// Test validation 
const error = new Error('Invalid signature format')
console.log(mapVerifyError(error)) // Should return "Ugyldig signatur format"
```

## Accessibility Verification

### Focus States
- [ ] Tab through all interactive elements
- [ ] Verify visible focus rings on all buttons/inputs
- [ ] Check preset buttons have focus indicators
- [ ] Confirm copy buttons are keyboard accessible

### Screen Reader Labels  
- [ ] Inspect CopyButton aria-live regions
- [ ] Verify all buttons have descriptive aria-labels
- [ ] Check form validation messages are announced

## Performance Notes
- Skeleton loading: 800ms initial display
- CopyButton confirmation: 2 second timeout
- Search debounce: 300ms delay
- SessionStorage: Automatic save/restore

## Known Issues/Limitations
- SessionStorage only works in browser (not SSR)
- URL params override sessionStorage on initial load
- Copy API requires HTTPS for production
- Amount validation is client-side only

## Files Modified Summary
```
Created:
- app/components/CopyButton.tsx
- app/lib/error-messages.ts

Updated:
- app/components/RefPanel.tsx
- app/me/page.tsx  
- app/market/[id]/page.tsx
- app/markets/page.tsx
```
