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
    <ConnectionProvider endpoint={ENDPOINT}>
      <SolWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolWalletProvider>
    </ConnectionProvider>
  );
}
