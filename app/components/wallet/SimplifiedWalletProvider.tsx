'use client';

// Re-export PhantomProvider to maintain backward compatibility
// and fix the module resolution error by clearing the old content.

import PhantomProvider, { usePhantomWallet } from './PhantomProvider';

export const useSimplifiedWallet = usePhantomWallet;

export default PhantomProvider;
