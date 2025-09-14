'use client'
import React, { useState, useEffect } from 'react'
import { useSimplifiedWallet } from '../components/wallet/SimplifiedWalletProvider'
import { useWalletAuth } from '../lib/useWalletAuth'

function shortAddress(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`
}

export default function AccountClient() {
  const { isConnected, publicKey } = useSimplifiedWallet()
  const { isAuthenticated: siwsOk, wallet: authWallet } = useWalletAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Derive three booleans as requested
  const isWalletConnected = !!publicKey && isConnected
  const isSiwsOk = siwsOk === true
  const canShowAccount = isWalletConnected && isSiwsOk

  if (!mounted) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-semibold text-slate-100 mb-6">Your Account</h1>
        <div className="rounded-xl border border-slate-700 p-6 text-slate-200">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-1/4 mb-4"></div>
            <div className="h-3 bg-slate-700 rounded w-1/2"></div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-100 mb-6">Your Account</h1>

      {!canShowAccount && (
        <div className="rounded-xl border border-slate-700 p-8 text-center text-slate-200">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">Connect Phantom to access your account</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Connect your wallet and sign a message to view your account details, subscription status, and transaction history.
            </p>
          </div>
        </div>
      )}

      {canShowAccount && (
        <div className="rounded-xl border border-slate-700 p-6 text-slate-200">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Wallet Connected</h2>
            <p className="text-sm text-slate-400 mb-4">
              Address: <span className="font-mono bg-slate-800/50 px-2 py-1 rounded">{publicKey ? shortAddress(publicKey) : 'Unknown'}</span>
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-md font-semibold mb-2">Account Details</h3>
            <div className="space-y-2 text-sm">
              <div>Plan: <span className="font-medium text-indigo-400">Starter (Free)</span></div>
              <div>Status: <span className="font-medium text-green-400">Active</span></div>
              <div>Features: <span className="font-medium">Basic predictions and insights</span></div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-md font-semibold mb-2">Upgrade Options</h3>
            <p className="text-sm text-slate-400 mb-3">Unlock advanced features with a Pro subscription:</p>
            <ul className="text-sm space-y-1 text-slate-300">
              <li>• Advanced AI analysis</li>
              <li>• Priority support</li>
              <li>• Historical data access</li>
              <li>• Custom alerts</li>
            </ul>
            <a 
              href="/pricing" 
              className="inline-block mt-3 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
            >
              View Pricing
            </a>
          </div>

          <div>
            <h3 className="text-md font-semibold mb-2">Transaction History</h3>
            <p className="text-sm text-slate-400">No transactions yet. Your activity will appear here once you start using the platform.</p>
          </div>
        </div>
      )}
    </main>
  )
}
