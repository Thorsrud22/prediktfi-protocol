'use client';

import { ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';
import { WalletModalProvider } from './components/WalletModalProvider';

// Explicitly import only the wallets we want to support
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter
} from '@solana/wallet-adapter-wallets';

// IMPORTANT: load wallet-adapter UI styles
import '@solana/wallet-adapter-react-ui/styles.css';

export default function SolanaProviders({ children }: { children: ReactNode }) {
  const cluster = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? 'devnet') as 'devnet' | 'mainnet-beta';
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC ?? clusterApiUrl(cluster);

  const wallets = useMemo(
    () => {
      // Create explicit wallet adapters - no auto-detection
      const phantom = new PhantomWalletAdapter();
      const solflare = new SolflareWalletAdapter();
      
      // Set explicit names and keys
      phantom.name = 'Phantom';
      solflare.name = 'Solflare';
      
      phantom.key = 'phantom';
      solflare.key = 'solflare';
      
      console.log('🔧 SolanaProviders: Initializing explicit wallet adapters', { 
        adapters: [phantom.name, solflare.name]
      });
      
      return [phantom, solflare];
    },
    [] // Empty dependency array to prevent re-creation
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={false}
        localStorageKey="wallet-adapter"
        onError={(error) => {
          console.warn('Wallet error:', error);
        }}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
