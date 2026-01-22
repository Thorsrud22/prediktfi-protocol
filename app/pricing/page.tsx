'use client'
import React from 'react'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">

      {/* Header */}
      <div className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 px-6 text-center z-10">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest">
          Early Access Phase
        </div>
        <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter uppercase italic mb-6">
          Institutional <span className="text-blue-500">Intelligence</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-slate-400 leading-relaxed font-light">
          Predikt is currently in public beta. We are stress-testing our risk models with a select group of early adopters.
        </p>
      </div>

      {/* Tiers */}
      <div className="max-w-5xl mx-auto px-6 pb-32 grid md:grid-cols-2 gap-8 relative z-10">

        {/* Beta Tier */}
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 flex flex-col relative overflow-hidden group hover:border-blue-500/30 transition-colors duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-800 to-slate-700"></div>
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-2">Public Beta</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white tracking-tight">$0</span>
              <span className="text-sm text-slate-500 font-medium">/ month</span>
            </div>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed">
              Full access to the core evaluation engine during the beta period.
            </p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            {[
              '3 AI Evaluations per day',
              'Basic Risk Modeling',
              'DexScreener Integration',
              'Public Community Access'
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/studio"
            className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-center transition-all uppercase tracking-widest text-xs"
          >
            Launch App
          </Link>
        </div>

        {/* Pro Tier (Waitlist) */}
        <div className="p-8 rounded-3xl bg-gradient-to-b from-blue-900/20 to-slate-900 border border-blue-500/30 flex flex-col relative overflow-hidden shadow-2xl shadow-blue-900/10">
          <div className="absolute top-0 right-0 p-4 opacity-50">
            <div className="w-24 h-24 bg-blue-500/20 blur-3xl rounded-full"></div>
          </div>

          <div className="mb-8 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white">Institutional Pro</h3>
              <span className="px-2 py-1 rounded bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest">Waitlist</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white tracking-tight">TBD</span>
            </div>
            <p className="text-sm text-blue-200/60 mt-4 leading-relaxed">
              Advanced signals, real-time alerts, and unlimited compute for professional analysts.
            </p>
          </div>
          <ul className="space-y-4 mb-8 flex-1 relative z-10">
            {[
              'Unlimited Evaluations',
              'Deep Contract Forensics',
              'Priority GPU Queue',
              'API Access',
              'Private Report Mode'
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-slate-200">
                <Check className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          <a
            href="https://x.com/PrediktFi"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-center transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
          >
            Request Access <ArrowRight className="w-4 h-4" />
          </a>
        </div>

      </div>

      {/* Footer Note */}
      <div className="text-center pb-20 px-6">
        <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">
          Built for the <span className="text-slate-400">Solarpunk</span> Future
        </p>
      </div>

    </div>
  )
}