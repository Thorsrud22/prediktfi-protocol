
import React from 'react'
import Link from 'next/link' // Import Link for internal navigation
import { Check, ArrowRight, Zap, Shield, Globe } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: {
    canonical: '/pricing',
  },
}

export default function PricingPage() {
  return (
    <div className="min-h-screen text-slate-100 selection:bg-blue-500/30">

      {/* Header */}
      <div className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 px-6 text-center z-10">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest">
          Transparent Business Model
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase italic mb-6">
          Who <span className="text-blue-500">Pays?</span>
        </h1>
        <p className="max-w-3xl mx-auto text-lg text-slate-400 leading-relaxed font-light">
          We don't sell your data. We sell institutional-grade processing power.
          <br className="hidden sm:block" />
          Choose the tier that matches your operational scale.
        </p>
      </div>

      {/* Tiers */}
      <div className="max-w-6xl mx-auto px-6 pb-32 grid md:grid-cols-3 gap-6 relative z-20">

        {/* FREE / SCOUT */}
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/5 flex flex-col relative overflow-hidden group hover:border-blue-400/30 transition-all duration-500">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="mb-8 relative z-10">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Zap size={18} className="text-blue-400" />
              Market Scout
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white tracking-tight">$0</span>
              <span className="text-sm text-slate-500 font-medium">/ forever</span>
            </div>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed h-10">
              Essential reconnaissance for early trends.
            </p>
          </div>
          <ul className="space-y-4 mb-8 flex-1 relative z-10">
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
          <Link
            href="/studio"
            className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-center transition-all uppercase tracking-widest text-xs relative z-10 group-hover:border-white/20"
          >
            Start Scouting
          </Link>
        </div>

        {/* PRO / FOUNDER */}
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/5 flex flex-col relative overflow-hidden group hover:border-blue-400/30 transition-all duration-500">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="mb-8 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield size={18} className="text-blue-400" />
                Founder Pro
              </h3>
              <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                Recommended
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white tracking-tight">$49</span>
              <span className="text-sm text-slate-500 font-medium">/ month</span>
            </div>
            <p className="text-sm text-blue-200/60 mt-4 leading-relaxed h-10">
              For serious builders needing deep forensics and privacy.
            </p>
          </div>
          <ul className="space-y-4 mb-8 flex-1 relative z-10">
            {[
              'Unlimited Evaluations',
              'Deep Contract Forensics',
              'Private Mode (No Public Feed)',
              'Priority GPU Queue',
              'PDF Export for Investors'
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-white">
                <Check className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          <a
            href="mailto:founders@predikt.fi?subject=Notify%20me%20when%20Founder%20Pro%20opens&body=Hi%2C%0A%0APlease%20notify%20me%20when%20Founder%20Pro%20becomes%20available.%0A%0AThanks!"
            className="w-full py-4 rounded-xl bg-white text-black font-bold text-center uppercase tracking-widest text-xs border border-transparent transition-all block hover:bg-slate-200"
          >
            Notify Me
          </a>
          <p className="text-[10px] text-center mt-3 text-slate-500 uppercase tracking-widest">
            Waitlist full — Opening Q2 2026
          </p>
        </div>

        {/* VC / INSTITUTIONAL */}
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/5 flex flex-col relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="mb-8 relative z-10">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Globe size={18} className="text-emerald-400" />
              Institutional
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white tracking-tight">API</span>
            </div>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed h-10">
              High-throughput data for funds and platforms.
            </p>
          </div>
          <ul className="space-y-4 mb-8 flex-1 relative z-10">
            {[
              'Custom API Rate Limits',
              'White-label Reports',
              'Diligence Automation',
              'Private Slack Channel'
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          <a
            href="mailto:partners@predikt.fi"
            className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-center transition-all uppercase tracking-widest text-xs block relative z-10 group-hover:border-white/20"
          >
            Contact Sales
          </a>
        </div>

      </div>

      {/* Trust */}
      <div className="text-center pb-20 px-6 border-t border-white/5 pt-16 max-w-4xl mx-auto">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">
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