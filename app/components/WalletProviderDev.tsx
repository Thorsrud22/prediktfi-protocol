"use client";

import { ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolWalletProvider,
} from "@solana/wallet-adapter-react";

// Development mode - minimal wallet setup for faster compilation
const isDev = process.env.NODE_ENV === 'development';

// Lazy load heavy wallet dependencies only in production
const WalletModalProvider = isDev ? 
  ({ children }: { children: ReactNode }) => <>{children}</> :
  require("@solana/wallet-adapter-react-ui").WalletModalProvider;

const PhantomWalletAdapter = isDev ? null : require("@solana/wallet-adapter-wallets").PhantomWalletAdapter;
const SolflareWalletAdapter = isDev ? null : require("@solana/wallet-adapter-wallets").SolflareWalletAdapter;

if (!isDev) {
  require("@solana/wallet-adapter-react-ui/styles.css");
}

const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER || "devnet";
const ENDPOINT =
  CLUSTER === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com";

export default function WalletProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => {
    if (isDev) {
      // Empty wallet array in development for faster compilation
      console.log('🚀 Development mode: Wallets disabled for performance');
      return [];
    }
    return [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
  }, []);

  return (
    <ConnectionProvider 
      endpoint={ENDPOINT}
      config={{
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 30000,
        httpHeaders: {
          'Content-Type': 'application/json',
        },
        wsEndpoint: undefined, // Disable websocket to reduce instability
        disableRetryOnRateLimit: false,
        fetch: undefined, // Use default fetch
      }}
    >
      <SolWalletProvider 
        wallets={wallets} 
        autoConnect={false}
        localStorageKey="wallet-adapter"
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolWalletProvider>
    </ConnectionProvider>
  );
}
