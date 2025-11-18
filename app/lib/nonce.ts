// In-memory store for nonces (in production, use Redis or database)
// Use global to persist across hot reloads in development
const globalForNonce = global as typeof globalThis & {
  nonceStore?: Map<string, { nonce: string; expiresAt: number }>;
};

const nonceStore = globalForNonce.nonceStore ?? new Map<string, { nonce: string; expiresAt: number }>();

if (process.env.NODE_ENV !== 'production') {
  globalForNonce.nonceStore = nonceStore;
}

// Helper function to verify nonce
export function verifyNonce(wallet: string, nonce: string): boolean {
  const stored = nonceStore.get(wallet);
  if (!stored) return false;
  
  if (Date.now() > stored.expiresAt) {
    nonceStore.delete(wallet);
    return false;
  }
  
  return stored.nonce === nonce;
}

// Helper function to consume nonce (one-time use)
export function consumeNonce(wallet: string, nonce: string): boolean {
  console.log('consumeNonce called with wallet:', wallet, 'nonce:', nonce);
  
  const stored = nonceStore.get(wallet);
  if (!stored) {
    console.log('No stored nonce found for wallet:', wallet);
    console.log('Available nonces in store:', Array.from(nonceStore.keys()));
    return false;
  }
  
  console.log('Found stored nonce:', stored.nonce, 'expires at:', new Date(stored.expiresAt).toISOString());
  
  if (Date.now() > stored.expiresAt) {
    console.log('Nonce expired for wallet:', wallet);
    nonceStore.delete(wallet);
    return false;
  }
  
  if (stored.nonce === nonce) {
    console.log('Nonce matches, consuming for wallet:', wallet);
    nonceStore.delete(wallet);
    return true;
  }
  
  console.log('Nonce mismatch for wallet:', wallet, 'expected:', stored.nonce, 'got:', nonce);
  return false;
}

// Helper function to store nonce
export function storeNonce(wallet: string, nonce: string, expiresAt: number): void {
  console.log('Storing nonce for wallet:', wallet, 'nonce:', nonce, 'expires at:', new Date(expiresAt).toISOString());
  nonceStore.set(wallet, { nonce, expiresAt });
}

// Helper function to clean up expired nonces
export function cleanupExpiredNonces(): void {
  for (const [key, value] of nonceStore.entries()) {
    if (Date.now() > value.expiresAt) {
      nonceStore.delete(key);
    }
  }
}
