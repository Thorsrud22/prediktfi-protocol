import React from 'react'
import Link from 'next/link' // Import Link for internal navigation
import { Check, ArrowRight, Zap, Shield, Globe, Lock } from 'lucide-react'
import { Metadata } from 'next'
import SubscribeButton from '../components/SubscribeButton'

export const metadata: Metadata = {
  alternates: {
    canonical: '/pricing',
  },
}

export default function PricingPage() {
  return (
    <div className="min-h-screen text-slate-100 selection:bg-blue-500/30">

      {/* Header */}
      <div className="relative pt-6 pb-4 sm:pt-8 sm:pb-5 px-6 text-center z-10">
        <h1 className="text-3xl sm:text-[2.75rem] font-serif text-white tracking-tight mb-0">
          Choose Your Plan
        </h1>
      </div>

      {/* Tiers */}
      <div className="mt-4 sm:mt-5 max-w-[1220px] mx-auto px-4 sm:px-6 pb-20 grid md:grid-cols-3 gap-5 relative z-20">

        {/* FREE / SCOUT */}
        <div className="p-5 lg:p-6 rounded-3xl bg-slate-900/40 border border-white/5 flex flex-col md:min-h-[580px] relative overflow-hidden group hover:border-blue-400/30 transition-all duration-500">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="mb-0 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={20} className="text-blue-400" />
              <h3 className="text-lg font-bold text-white">Market Scout</h3>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-4xl font-black text-white tracking-tight">$0</span>
              <span className="text-sm text-slate-500 font-medium">/ forever</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed min-h-14">
              Essential reconnaissance for early trends.
            </p>
          </div>

          <Link
            href="/studio"
            className="w-full mt-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-center transition-all uppercase tracking-widest text-xs relative z-10 group-hover:border-white/20"
          >
            Start Scouting
          </Link>

          <div className="border-t border-white/5 w-full my-6 relative z-10" />

          <ul className="space-y-3 flex-1 relative z-10">
            {[
              '3 AI Evaluations / Day',
              'Basic Due Diligence',
              'Market Sentiment Analysis',
              'Community Access'
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                <Check className="w-4 h-4 text-slate-500 mt-0.5 shrink-0 group-hover:text-blue-400 transition-colors" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* PRO / FOUNDER */}
        <div className="p-5 lg:p-6 rounded-3xl bg-slate-900/40 border border-blue-500/10 flex flex-col md:min-h-[580px] relative overflow-hidden group hover:border-blue-400/40 transition-all duration-500 ring-1 ring-blue-500/5 shadow-[0_0_50px_-12px_rgba(59,130,246,0.15)]">
          <div className="absolute inset-0 bg-blue-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="mb-0 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-blue-400" />
                <h3 className="text-lg font-bold text-white">Founder Pro</h3>
              </div>
              <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                Recommended
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-4xl font-black text-white tracking-tight">$49</span>
              <span className="text-sm text-slate-500 font-medium">/ month</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed min-h-14">
              For serious builders needing deep forensics and privacy.
            </p>
          </div>

          <SubscribeButton
            priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FOUNDER || 'price_1Qv...'}
            className="w-full mt-3 py-3 rounded-xl bg-white text-black font-bold text-center uppercase tracking-widest text-xs border border-transparent transition-all block relative z-10 hover:bg-slate-200 cursor-pointer"
          >
            Get Founder Pro
          </SubscribeButton>

          <div className="border-t border-white/5 w-full my-6 relative z-10" />

          <div className="relative z-10 mb-4">
            <p className="text-xs font-medium text-slate-400">Everything in Free, plus:</p>
          </div>

          <ul className="space-y-3 flex-1 relative z-10">
            {[
              'Unlimited Evaluations',
              'Deep Contract Forensics',
              'Private Mode (No Public Feed)',
              'Priority GPU Queue',
              'PDF Export for Investors'
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                <Check className="w-4 h-4 text-slate-500 mt-0.5 shrink-0 group-hover:text-blue-400 transition-colors" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* VC / INSTITUTIONAL */}
        <div className="p-5 lg:p-6 rounded-3xl bg-slate-900/40 border border-white/5 flex flex-col md:min-h-[580px] relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="mb-0 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={20} className="text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Institutional</h3>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-4xl font-black text-white tracking-tight">API</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed min-h-14">
              High-throughput data for funds and platforms.
            </p>
          </div>

          <a
            href="mailto:partners@predikt.fi"
            className="w-full mt-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-center transition-all uppercase tracking-widest text-xs block relative z-10 group-hover:border-white/20"
          >
            Contact Sales
          </a>

          <div className="border-t border-white/5 w-full my-6 relative z-10" />

          <ul className="space-y-3 flex-1 relative z-10">
            {[
              'Custom API Rate Limits',
              'White-label Reports',
              'Diligence Automation',
              'Private Slack Channel'
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                <Check className="w-4 h-4 text-slate-500 mt-0.5 shrink-0 group-hover:text-emerald-500 transition-colors" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Trust */}
      <div className="mt-6 md:mt-10 text-center pb-20 px-6 border-t border-white/5 pt-6 max-w-4xl mx-auto">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
          Trusted by early adopters from
        </h4>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
          {['Solana', 'Ethereum', 'Base', 'Arbitrum'].map(chain => (
            <span key={chain} className="text-xl font-black text-white">{chain}</span>
          ))}
        </div>
      </div>

    </div>
  )
}
