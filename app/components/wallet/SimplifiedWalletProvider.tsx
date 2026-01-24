'use client';

// Lightweight Wallet Provider
// Explicitly avoids loading @solana/wallet-adapter-* to save ~500KB bundle size
// Uses direct window.phantom injection for max performance on mobile

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

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

  // Initialize from localStorage on mount with retry for extension injection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let attempts = 0;
    const checkWallet = () => {
      try {
        const savedWallet = localStorage.getItem('predikt:wallet:name');
        const savedPubkey = localStorage.getItem('predikt:wallet:pubkey');

        if (savedWallet === 'Phantom' && savedPubkey) {
          // If we have saved data, we can set it immediately for UI optimistically
          // BUT stricter check: verify provider exists
          if (window.phantom?.solana?.isPhantom) {
            setPublicKey(savedPubkey);
            setIsConnected(true);
            return; // Found it, done.
          }
        }
      } catch (error) {
        console.warn('Failed to restore wallet state:', error);
      }

      attempts++;
      if (attempts < 10) {
        setTimeout(checkWallet, 100); // Retry every 100ms for 1s
      }
    };

    checkWallet();
  }, []);

  const connect = async () => {
    if (isConnecting) return;

    try {
      setIsConnecting(true);

      // Fallback: Use window.solana if phantom specific path fails or is weird
      // Type assertion to any to avoid "Expected 0 arguments" error since we know it accepts options
      const solana = (window as any).solana;
      const phantomSolana = (window as any).phantom?.solana;

      const targetProvider = phantomSolana?.isPhantom ? phantomSolana : (solana?.isPhantom ? solana : null);

      if (!targetProvider) {
        window.open('https://phantom.app/', '_blank');
        return;
      }

      const response = await targetProvider.connect({ onlyIfTrusted: false });

      if (response?.publicKey) {
        const pubkey = response.publicKey.toString();
        setPublicKey(pubkey);
        setIsConnected(true);

        // Save to localStorage
        localStorage.setItem('predikt:wallet:name', 'Phantom');
        localStorage.setItem('predikt:wallet:pubkey', pubkey);
      }
    } catch (error: any) {
      console.error('Wallet connection failed:', error);

      // Handle User Rejection (4001)
      if (error?.code === 4001) {
        // User rejected the request
        return;
      }

      // Generic fallback
      console.warn("Phantom connection error details:", JSON.stringify(error, null, 2));
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      // 1. Attempt Phantom disconnect
      if (window.phantom?.solana?.disconnect) {
        try {
          await window.phantom.solana.disconnect();
        } catch (e) {
          console.warn('Phantom extension disconnect failed, continuing with local cleanup:', e);
        }
      }

      // 2. Call server-side signout API
      try {
        await fetch('/api/auth/signout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (authError) {
        console.error('Server signout failed:', authError);
      }

      // 3. Force reset local state regardless of extension/API success
      setIsConnected(false);
      setPublicKey(null);

      // 4. Clear all relevant localStorage
      localStorage.removeItem('predikt:wallet:name');
      localStorage.removeItem('predikt:wallet:pubkey');
      localStorage.removeItem('predikt:auth:v1');

      // Optional: Force a small delay then reload or redirect if needed
      // window.location.href = '/'; 
    } catch (error) {
      console.error('Wallet disconnect failed:', error);
      // Even in the catch block, we want to ensure state is reset locally
      setIsConnected(false);
      setPublicKey(null);
      localStorage.removeItem('predikt:wallet:name');
      localStorage.removeItem('predikt:wallet:pubkey');
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
    // Resolve the provider again (same logic as connect)
    const solana = (window as any).solana;
    const phantomSolana = (window as any).phantom?.solana;
    const provider = phantomSolana?.isPhantom ? phantomSolana : (solana?.isPhantom ? solana : null);

    if (!provider || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      // Type assertion for signMessage
      const response = await provider.signMessage(message);
      return response.signature;
    } catch (error: any) {
      if (error?.code === 4001) {
        console.log("User rejected signature request");
        return null;
      }
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
  // Lightweight provider without heavy adapter dependencies
  return <WalletManager>{children}</WalletManager>;
}
