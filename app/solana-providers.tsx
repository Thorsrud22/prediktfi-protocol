'use client'
import React, { useMemo, useCallback, useEffect, useState } from 'react'
import { clusterApiUrl } from '@solana/web3.js'
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { WalletError } from '@solana/wallet-adapter-base'

// Wallet persistence component
function WalletPersistence() {
  const { select, connect, connected, wallet, publicKey, disconnect } = useWallet()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const initializeWallet = async () => {
      try {
        // Read saved wallet preference
        const savedWalletName = localStorage.getItem('predikt:wallet:name')
        const savedWalletPubkey = localStorage.getItem('predikt:wallet:pubkey')
        
        if (savedWalletName === 'Phantom' && savedWalletPubkey && window.phantom?.solana?.isPhantom) {
          console.log('[WalletPersistence] Found saved Phantom wallet, attempting auto-connect')
          
          // Select Phantom wallet
          await select('Phantom')
          
          // Try trusted connection first (no popup if extension already trusts the site)
          try {
            await connect({ onlyIfTrusted: true })
            console.log('[WalletPersistence] Connected with trusted connection')
          } catch (error) {
            console.log('[WalletPersistence] Trusted connection failed, will require manual connect')
            // Don't auto-connect if not trusted - user must click "Connect Phantom"
          }
        }
      } catch (error) {
        console.warn('[WalletPersistence] Auto-connect failed:', error)
      }
    }

    // Small delay to ensure wallet adapters are ready
    const timeout = setTimeout(initializeWallet, 100)
    return () => clearTimeout(timeout)
  }, [select, connect])

  // Subscribe to wallet events once
  useEffect(() => {
    const adapter = wallet?.adapter
    if (!adapter) return

    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)

    adapter.on('connect', handleConnect)
    adapter.on('disconnect', handleDisconnect)

    return () => {
      adapter.off('connect', handleConnect)
      adapter.off('disconnect', handleDisconnect)
    }
  }, [wallet])

  // Save wallet name and pubkey when connected
  useEffect(() => {
    if (connected && wallet?.adapter?.name === 'Phantom' && publicKey) {
      localStorage.setItem('predikt:wallet:name', 'Phantom')
      localStorage.setItem('predikt:wallet:pubkey', publicKey.toBase58())
    }
  }, [connected, wallet, publicKey])

  // Remove wallet data when disconnected
  // COMMENTED OUT: This was causing auto-logout on refresh because connected is temporarily false during startup
  // localStorage cleanup is now handled in HeaderConnectButton disconnect handler
  // useEffect(() => {
  //   if (!connected) {
  //     localStorage.removeItem('predikt:wallet:name')
  //     localStorage.removeItem('predikt:wallet:pubkey')
  //   }
  // }, [connected])

  return null
}

export default function SolanaProviders({ children }: { children: React.ReactNode }) {
  const endpoint = clusterApiUrl(process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet')
  const wallets = useMemo(() => [new PhantomWalletAdapter()], [])
  
  // Diagnostic logging (one-time on mount)
  useEffect(() => {
    console.debug('[Providers] Mount - wallets:', wallets.map(w => ({
      name: w.name,
      readyState: w.readyState
    })))
  }, [wallets])

  const onError = useCallback((e: WalletError) => {
    // Ignore common noise errors - never disconnect automatically  
    const noiseErrors = [
      'WalletNotConnectedError',
      'WalletNotReadyError', 
      'WalletNotSelectedError',
      'WalletConnectionError',
      'WalletDisconnectedError',
      'WalletTimeoutError'
    ]
    
    if (noiseErrors.includes(e?.name || '')) {
      // Only log meaningful wallet errors, skip noise
      return
    }
    
    // Log only meaningful errors
    console.error('[WalletError]', e?.name || 'WalletError', e?.message || e)
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true} localStorageKey="predikt:wallet:name" onError={onError}>
        <WalletPersistence />
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
