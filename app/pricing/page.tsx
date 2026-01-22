'use client'
import React from 'react'
import Link from 'next/link' // Import Link for internal navigation
import { Check, ArrowRight, Zap, Shield, Globe } from 'lucide-react'

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

        {/* FREE / DEGEN */}
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/5 flex flex-col relative overflow-hidden group hover:border-white/10 transition-all duration-500 hover:bg-slate-900/60">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Zap size={18} className="text-yellow-400" />
              Memecoin Degen
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white tracking-tight">$0</span>
              <span className="text-sm text-slate-500 font-medium">/ forever</span>
            </div>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed h-10">
              For quick vibe checks and viral potential scanning.
            </p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            {[
              '3 AI Evaluations / Day',
              'Basic Risk & Rug Check',
              'Viral Sentiment Analysis',
              'Community Access'
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                <Check className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/studio"
            className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-center transition-all uppercase tracking-widest text-xs"
          >
            Start Free
          </Link>
        </div>

        {/* PRO / FOUNDER */}
        <div className="p-8 rounded-3xl bg-gradient-to-b from-blue-900/20 to-slate-900 border border-blue-500/50 flex flex-col relative overflow-hidden shadow-2xl shadow-blue-900/20 transform md:-translate-y-4">
          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>
          <div className="absolute top-0 right-0 p-4 opacity-30">
            <div className="w-32 h-32 bg-blue-500/20 blur-3xl rounded-full"></div>
          </div>

          <div className="mb-8 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield size={18} className="text-blue-400" />
                Founder Pro
              </h3>
              <span className="px-2 py-1 rounded bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest">
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
          <button
            disabled
            className="w-full py-4 rounded-xl bg-blue-600 opacity-80 cursor-not-allowed text-white font-bold text-center uppercase tracking-widest text-xs border border-transparent"
          >
            Waitlist Full
          </button>
          <p className="text-[10px] text-center mt-3 text-slate-500 uppercase tracking-widest">
            Opening Q2 2026
          </p>
        </div>

        {/* VC / API */}
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/5 flex flex-col relative overflow-hidden group hover:border-white/10 transition-all duration-500 hover:bg-slate-900/60">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Globe size={18} className="text-emerald-400" />
              VC / Enterprise
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white tracking-tight">API</span>
            </div>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed h-10">
              High-throughput API access for funds and platforms.
            </p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            {[
              'Custom API Rate Limits',
              'White-label Reports',
              'Diligence Automation',
              'SLA & dedicated support' // Fixed typo: 'deidcated' -> 'dedicated'
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          <a
            href="mailto:partners@predikt.fi"
            className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-center transition-all uppercase tracking-widest text-xs block"
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