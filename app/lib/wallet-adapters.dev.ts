// Development mock for wallet adapters to improve performance
// This file prevents loading heavy wallet dependencies during development

export const PhantomWalletAdapter = null;
export const SolflareWalletAdapter = null;

// Mock wallet adapters array for development
export const wallets = [];

console.log('🚀 Development mode: Wallet adapters disabled for faster compilation');
