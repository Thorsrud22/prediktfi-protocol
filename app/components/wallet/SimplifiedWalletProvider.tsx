'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { clusterApiUrl } from '@solana/web3.js';

interface WalletContextType {
  isConnected: boolean;
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  signMessage: (message: Uint8Array) => Promise<Uint8Array | null>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useSimplifiedWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useSimplifiedWallet must be used within SimplifiedWalletProvider');
  }
  return context;
}

function WalletManager({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedWallet = localStorage.getItem('predikt:wallet:name');
      const savedPubkey = localStorage.getItem('predikt:wallet:pubkey');

      if (savedWallet === 'Phantom' && savedPubkey && window.phantom?.solana?.isPhantom) {
        setPublicKey(savedPubkey);
        setIsConnected(true);
      }
    } catch (error) {
      console.warn('Failed to restore wallet state:', error);
    }
  }, []);

  const connect = async () => {
    if (isConnecting) return;

    try {
      setIsConnecting(true);

      // Check if Phantom is available
      if (!window.phantom?.solana?.isPhantom) {
        window.open('https://phantom.app/', '_blank');
        return;
      }

      // Connect to Phantom
      const response = await window.phantom.solana.connect?.();

      if (response?.publicKey) {
        const pubkey = response.publicKey.toString();
        setPublicKey(pubkey);
        setIsConnected(true);

        // Save to localStorage
        localStorage.setItem('predikt:wallet:name', 'Phantom');
        localStorage.setItem('predikt:wallet:pubkey', pubkey);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      if (window.phantom?.solana?.disconnect) {
        await window.phantom.solana.disconnect();
      }

      setIsConnected(false);
      setPublicKey(null);

      // Clear localStorage
      localStorage.removeItem('predikt:wallet:name');
      localStorage.removeItem('predikt:wallet:pubkey');
      localStorage.removeItem('predikt:auth:v1');
    } catch (error) {
      console.error('Wallet disconnect failed:', error);
    }
  };

  // Listen for Phantom events
  useEffect(() => {
    if (typeof window === 'undefined' || !window.phantom?.solana) return;

    const handleAccountChange = (publicKey: { toString: () => string } | null) => {
      if (publicKey) {
        const pubkey = publicKey.toString();
        setPublicKey(pubkey);
        setIsConnected(true);
        localStorage.setItem('predikt:wallet:pubkey', pubkey);
      } else {
        setIsConnected(false);
        setPublicKey(null);
        localStorage.removeItem('predikt:wallet:name');
        localStorage.removeItem('predikt:wallet:pubkey');
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setPublicKey(null);
      localStorage.removeItem('predikt:wallet:name');
      localStorage.removeItem('predikt:wallet:pubkey');
    };

    window.phantom.solana.on('accountChanged', handleAccountChange);
    window.phantom.solana.on('disconnect', handleDisconnect);

    return () => {
      if (window.phantom?.solana) {
        // Type assertion to access 'off' method which exists but isn't in the type definition
        (window.phantom.solana as any).off('accountChanged', handleAccountChange);
        (window.phantom.solana as any).off('disconnect', handleDisconnect);
      }
    };
  }, []);

  const signMessage = async (message: Uint8Array) => {
    if (!window.phantom?.solana?.isPhantom || !isConnected) {
      throw new Error('Phantom wallet not connected');
    }

    try {
      // Type assertion for signMessage which exists but isn't in the type definition
      const phantomSolana = window.phantom.solana as any;
      const response = await phantomSolana.signMessage(message);
      return response.signature;
    } catch (error) {
      console.error('Message signing failed:', error);
      throw error;
    }
  };

  const value = useMemo(
    () => ({
      isConnected,
      publicKey,
      connect,
      disconnect,
      isConnecting,
      signMessage,
    }),
    [isConnected, publicKey, isConnecting],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export default function SimplifiedWalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint = clusterApiUrl((process.env.NEXT_PUBLIC_SOLANA_CLUSTER as any) || 'devnet');
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <WalletManager>{children}</WalletManager>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
