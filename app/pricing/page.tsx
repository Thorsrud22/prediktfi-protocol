'use client'
import React from 'react'
import Link from 'next/link'
import { useSimplifiedWallet } from '../components/wallet/SimplifiedWalletProvider'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
  const { isConnected, publicKey } = useSimplifiedWallet()
  const router = useRouter()
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-16">
        <p className="text-center text-sm text-slate-400">
          No credit card required • Cancel anytime
        </p>
        <h1 className="mt-2 text-center text-5xl font-extrabold tracking-tight">
          Simple, transparent <span className="text-indigo-400">pricing</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-400">
          Start free and upgrade when you need more power.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {[
            {
              id: 'starter',
              title: 'Starter',
              price: 0,
              button: { label: 'Get Started', href: '/studio' },
              features: ['5 intents per week', 'Community features'],
              accent: 'border-slate-800',
            },
            {
              id: 'pro',
              title: 'Pro',
              price: 9,
              button: {
                label: isConnected ? 'Upgrade with Crypto' : 'Connect with Phantom to upgrade',
                href: isConnected ? '/pay?plan=pro' : '#',
                disabled: !isConnected
              },
              features: ['30 intents per week', 'Advanced analytics', 'Priority support'],
              accent: 'border-indigo-500/60',
            },
          ].map((tier) => (
            <div
              key={tier.id}
              className={`rounded-2xl border ${tier.accent} bg-slate-900/60 p-6`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{tier.title}</h3>
                <div className="text-3xl font-bold">
                  {tier.price === 0 ? '$0' : `$${tier.price}`}
                  <span className="text-base font-normal text-slate-400">
                    {tier.price === 0 ? '' : '/month'}
                  </span>
                </div>
              </div>
              <ul className="mt-5 space-y-2 text-slate-300">
                {tier.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <Link
                href={tier.button.href}
                className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 font-semibold transition ${tier.button.disabled
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                onClick={tier.button.disabled ? (e) => e.preventDefault() : undefined}
              >
                {tier.button.label}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          You can also pay in SOL or USDC on devnet or mainnet. Funds settle directly to your wallet.
        </p>

        {!isConnected && (
          <div className="mt-8 text-center">
            <div className="rounded-xl border border-slate-700 p-6 max-w-2xl mx-auto">
              <h2 className="text-lg font-semibold text-slate-100 mb-2">Connect Your Wallet</h2>
              <p className="text-slate-400 mb-4">
                Connect with Phantom in the header to continue.
              </p>
              <p className="text-sm text-slate-500">
                Use the "Connect Wallet" button in the header to get started.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}