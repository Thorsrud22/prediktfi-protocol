'use client'
import React from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

export default function AccountPage() {
  const { publicKey } = useWallet()
  const connected = Boolean(publicKey)
  const addr = publicKey?.toBase58()

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-100 mb-6">Your Account</h1>

      {!connected && (
        <div className="rounded-xl border border-slate-700 p-6 text-slate-200">
          <p className="mb-4">Connect your wallet via the header to access your account.</p>
          <p className="text-sm text-slate-400">Once connected, you'll be able to view your account details and manage your subscription.</p>
        </div>
      )}

      {connected && (
        <div className="rounded-xl border border-slate-700 p-6 text-slate-200">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Wallet Connected</h2>
            <p className="text-sm text-slate-400 mb-4">Address: {addr}</p>
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
              className="inline-block mt-3 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
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
