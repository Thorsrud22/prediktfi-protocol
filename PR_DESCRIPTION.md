# Pull Request: Implementing Markets Page and Additional Features

## Summary
This PR implements a set of features for the PrediktFi prediction markets platform:

1. Created a markets listing page with mock data
2. Updated the landing page to feature markets with a "View all" link
3. Improved accessibility of YES/NO segment controls using proper radio inputs
4. Added SPL Memo utilities for bet payloads
5. Added unit and E2E tests
6. Fixed metadata configuration and server/client code separation

## Changes

### Markets Page
- Created app/lib/markets.mock.ts with realistic market data
- Implemented app/markets/page.tsx with responsive grid layout
- Added market card components with proper formatting

### Landing Page Updates
- Updated app/page.tsx to display featured markets
- Added "View all" link to the markets page

### Accessibility Improvements
- Completely rewrote the Segmented component to use proper radio inputs
- Added appropriate ARIA attributes and keyboard navigation support
- Ensured focus states are visible for keyboard users

### SPL Memo Utilities
- Added utilities in app/lib/solana.ts for creating and parsing memo data
- Created app/lib/solana.server.ts for server-only code
- Implemented JSON stringification/parsing with error handling

### Testing
- Added unit tests for memo functionality
- Created E2E smoke tests for basic navigation flow
- Added mock bet tests to verify bet flow without wallet connection

### Technical Improvements
- Fixed metadata configuration in app/layout.tsx
- Properly separated server/client code to prevent inclusion in client bundles
- Updated environment variables for consistent testing
- Fixed React hydration errors with string-based formatting

## Testing
- All unit tests pass with `npm run test`
- Type checking passes with `npm run typecheck`
- E2E tests for basic navigation and mock bet flow pass

## Next Steps
- Implement actual bet placement with wallet connection (in progress)
- Add additional market details and visualizations
- Implement filtering and sorting for markets page
