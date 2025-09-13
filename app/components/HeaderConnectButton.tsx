'use client'

import { useCallback, useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletAuth, useSiwsGuard } from '../lib/useWalletAuth'
import Link from 'next/link'

function short(a?: string) { return a ? `${a.slice(0,4)}…${a.slice(-4)}` : '' }

export default function HeaderConnectButton() {
  const { publicKey, connected, wallets, wallet, select, connect, disconnect } = useWallet()
  const { isAuthenticated, verifying, verify, signOut } = useWalletAuth()
  const { ensureSiwsOnce } = useSiwsGuard()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Set isClient flag after mount to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleConnectPhantom = useCallback(async () => {
    // Prevent double clicks
    if (isConnecting) return
    
    // Check if Phantom is installed first
    if (typeof window !== 'undefined' && !window.phantom?.solana?.isPhantom) {
      // Show install CTA and open Phantom install page
      window.open('https://phantom.app/', '_blank')
      return
    }

    // 1) Wait for the list to exist
    if (!wallets || wallets.length === 0) {
      console.warn('[Connect] Wallets not ready yet')
      return
    }

    // 2) Find Phantom correctly (via adapter.name)
    const phantom = wallets.find(w => w.adapter?.name === 'Phantom')
    if (!phantom) {
      console.error('[Connect] Phantom adapter missing in useWallet().wallets')
      return
    }

    setIsConnecting(true)
    try {
      // 3) Select Phantom if not selected
      if (wallet?.adapter?.name !== 'Phantom') {
        // velg Phantom
        select(phantom.adapter.name as any)

        // gi React/provider ett pusterom til å sette valgt wallet
        await new Promise(r => setTimeout(r, 50))

        try {
          await connect()
          // Save wallet selection immediately after successful connect
          localStorage.setItem('predikt:wallet:name', 'Phantom')
          localStorage.setItem('walletAdapter', 'Phantom')
          localStorage.setItem('walletName', 'Phantom')
        } catch (e: any) {
          // Noen miljøer trenger ett ekstra forsøk rett etter select()
          if (e?.name === 'WalletNotSelectedError') {
            await new Promise(r => setTimeout(r, 150))
            await connect()
            // Save wallet selection after successful retry connect
            localStorage.setItem('predikt:wallet:name', 'Phantom')
            localStorage.setItem('walletAdapter', 'Phantom')
            localStorage.setItem('walletName', 'Phantom')
          } else {
            throw e // andre feil skal ikke svelges
          }
        }
      } else {
        // 6) Now you can safely connect
        await connect()
        // Save wallet selection immediately after successful connect
        localStorage.setItem('predikt:wallet:name', 'Phantom')
        localStorage.setItem('walletAdapter', 'Phantom')
        localStorage.setItem('walletName', 'Phantom')
      }
      
      // Save public key if available
      if (publicKey) {
        localStorage.setItem('predikt:wallet:pubkey', publicKey.toBase58())
      }
      
      // 8) ONLY here, once per session: SIWS guard
      await ensureSiwsOnce()
    } catch (e: any) {
      // Silent errors
      if (e?.name === 'WalletNotSelectedError' || e?.name === 'WalletNotReadyError') {
        console.warn('[Connect] Wallet not ready yet:', e?.name)
        return
      }
      console.error('[Phantom connect error]:', e)
      // Don't disconnect automatically - just show error
      alert('Could not connect to Phantom. Check that the extension is enabled for this page.')
    } finally {
      setIsConnecting(false)
    }
  }, [isConnecting, wallets, select, connect, ensureSiwsOnce])

  async function handleDisconnect() {
    try { await disconnect() } finally {
      // Remove wallet preference and any cached keys from different wallet-adapter versions
      try {
        localStorage.removeItem('predikt:wallet:name')
        localStorage.removeItem('predikt:wallet:pubkey')
        localStorage.removeItem('predikt:wallet')
        localStorage.removeItem('walletAdapter')
        localStorage.removeItem('walletName')
        // Nuke all keys that start with walletAdapter*
        Object.keys(localStorage)
          .filter(k => /^@?solana:|^walletAdapter/i.test(k))
          .forEach(k => localStorage.removeItem(k))
      } catch {}
      await signOut?.()
    }
  }

  // Don't render anything until after mount to prevent hydration mismatch
  if (!isClient) {
    return null
  }

  // Show connect CTA if not connected
  if (!connected || !publicKey) {
    return (
      <button
        onClick={handleConnectPhantom}
        disabled={isConnecting}
        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isConnecting ? 'Connecting...' : 'Connect Phantom'}
      </button>
    )
  }

  const addr = publicKey.toBase58()

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-200">{short(addr)}</span>
        <button
          onClick={verify}
          disabled={verifying}
          className="rounded-xl px-3 h-9 bg-orange-600 text-white hover:bg-orange-500 text-sm font-medium transition-colors disabled:opacity-60"
        >
          {verifying ? 'Signing…' : 'Sign to continue'}
        </button>
        <button
          onClick={handleDisconnect}
          className="rounded-xl px-3 h-9 bg-slate-700 text-white hover:bg-slate-600 text-sm font-medium transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-200">{short(addr)}</span>
      <Link href="/account" className="rounded-xl px-3 h-9 bg-slate-700 text-white hover:bg-slate-600 text-sm font-medium transition-colors inline-flex items-center">Account</Link>
      <button onClick={handleDisconnect} className="rounded-xl px-3 h-9 bg-slate-700 text-white hover:bg-slate-600 text-sm font-medium transition-colors">
        Disconnect
      </button>
    </div>
  )
}