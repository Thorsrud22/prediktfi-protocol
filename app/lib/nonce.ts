// In-memory store for nonces (in production, use Redis or database)
const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();

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
  const stored = nonceStore.get(wallet);
  if (!stored) return false;
  
  if (Date.now() > stored.expiresAt) {
    nonceStore.delete(wallet);
    return false;
  }
  
  if (stored.nonce === nonce) {
    nonceStore.delete(wallet);
    return true;
  }
  
  return false;
}

// Helper function to store nonce
export function storeNonce(wallet: string, nonce: string, expiresAt: number): void {
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
