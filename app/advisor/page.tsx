'use client'
import React, { Suspense, lazy } from 'react'
import { useSimplifiedWallet } from '../components/wallet/SimplifiedWalletProvider'
import Link from 'next/link'
import { FastPageLoader } from '../components/PageLoader'

// If there are heavy components, we can lazy load them
// const HeavyAdvisorComponent = lazy(() => import('../components/advisor/HeavyComponent'));

export default function AdvisorPage() {
  const { isConnected } = useSimplifiedWallet()

  // Allow access to actions page even when disconnected
  // Only require wallet connection for other advisor features
  return pageFrame(
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-200 mb-2">Welcome to Predikt Advisor</h2>
        <p className="text-slate-400 mb-6">
          Monitor trading opportunities and manage your intents. No trades are executed automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Actions - Always available */}
        <div className="rounded-lg border border-slate-600 p-6 bg-slate-800/50">
          <h3 className="text-lg font-semibold text-slate-200 mb-2">📋 Trading Actions</h3>
          <p className="text-sm text-slate-400 mb-4">
            View and manage your trading intents. Create, simulate, and execute trades.
          </p>
          <Link
            href="/advisor/actions"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View Actions
          </Link>
        </div>

        {/* Other features - Require wallet connection */}
        {isConnected ? (
          <>
            <div className="rounded-lg border border-slate-600 p-6 bg-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-200 mb-2">🔔 Alerts</h3>
              <p className="text-sm text-slate-400 mb-4">
                Set up price alerts and notifications for your portfolio.
              </p>
              <Link
                href="/advisor/alerts"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Manage Alerts
              </Link>
            </div>

            <div className="rounded-lg border border-slate-600 p-6 bg-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-200 mb-2">⚙️ Strategies</h3>
              <p className="text-sm text-slate-400 mb-4">
                Create and manage automated trading strategies.
              </p>
              <Link
                href="/advisor/strategies"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Manage Strategies
              </Link>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-slate-600 p-6 bg-slate-800/50">
            <h3 className="text-lg font-semibold text-slate-200 mb-2">🔐 Connect Wallet</h3>
            <p className="text-sm text-slate-400 mb-4">
              Connect your wallet to access alerts, strategies, and other advanced features.
            </p>
            <div className="text-sm text-slate-500">
              Use the "Connect Phantom" button in the header to get started.
            </div>
          </div>
        )}
      </div>
    </div>
  )

  function pageFrame(content: React.ReactNode) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-semibold text-slate-100 mb-2">Predikt Advisor</h1>
        <p className="text-sm text-slate-300 mb-6">Monitor only — no trades are executed automatically.</p>
        <div className="rounded-xl border border-slate-700 p-6 text-slate-200">{content}</div>
      </main>
    )
  }
}

