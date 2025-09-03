"use client";

import { ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

require("@solana/wallet-adapter-react-ui/styles.css");

const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER || "devnet";
const ENDPOINT =
  CLUSTER === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com";

export default function WalletProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

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
        // Additional stability settings
        fetch: undefined, // Use default fetch
      }}
    >
      <SolWalletProvider 
        wallets={wallets} 
        autoConnect={false}
        localStorageKey="wallet-adapter"
        onError={(error) => {
          console.warn('Wallet error:', error);
          // Don't crash the app on wallet errors
        }}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolWalletProvider>
    </ConnectionProvider>
  );
}
