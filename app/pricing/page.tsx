'use client';

import React, { useState } from 'react'
import Link from 'next/link'
import { Check, ArrowRight, Zap, Shield, Globe, Loader2, Mail } from 'lucide-react'

export default function PricingPage() {
  const [waitlistStep, setWaitlistStep] = useState<'initial' | 'input' | 'submitting' | 'success'>('initial');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setWaitlistStep('submitting');
    setError(null);

    try {
      const res = await fetch('/api/public/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setWaitlistStep('success');
      } else {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
        setWaitlistStep('input');
      }
    } catch (err) {
      setError('Connection failed. Try again.');
      setWaitlistStep('input');
    }
  };

  return (
    <div className="min-h-screen text-slate-100 selection:bg-blue-500/30">

      {/* Header */}
      <div className="relative pt-20 pb-10 sm:pt-24 sm:pb-12 px-6 text-center z-10">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest">
          Transparent Business Model
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase italic mb-4">
          Who <span className="text-blue-500">Pays?</span>
        </h1>
        <p className="max-w-3xl mx-auto text-lg text-slate-400 leading-relaxed font-light">
          We don't sell your data. We sell institutional-grade processing power.
          <br className="hidden sm:block" />
          Choose the tier that matches your operational scale.
        </p>
      </div>

      {/* Tiers */}
      <div className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6 relative z-20">

        {/* FREE / SCOUT */}
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/5 flex flex-col relative overflow-hidden group cursor-pointer transition-all duration-300">

          <div className="mb-8 relative z-10">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Zap size={18} className="text-blue-400" />
              Market Scout
            </h2>
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
                <Check className="w-4 h-4 text-slate-500 mt-0.5 shrink-0 transition-colors" />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/studio"
            className="w-full h-14 rounded-md bg-white text-black font-black text-center transition-all duration-300 hover:bg-neutral-100 hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.3)] active:scale-[0.98] uppercase tracking-[0.3em] text-[10px] flex items-center justify-center relative z-10"
          >
            Start Scouting
          </Link>
        </div>

        {/* PRO / FOUNDER */}
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/5 flex flex-col relative overflow-hidden group cursor-pointer transition-all duration-300">
          <div className="mb-8 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield size={18} className="text-blue-400" />
                Founder Pro
              </h2>
              <span className="px-2 py-1 rounded bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-500/50">
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

          <div className="relative z-10">
            {waitlistStep === 'initial' && (
              <button
                onClick={() => setWaitlistStep('input')}
                className="w-full h-14 rounded-md bg-white text-black font-black text-center uppercase tracking-[0.3em] text-[10px] transition-all duration-300 hover:bg-neutral-100 hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.3)] active:scale-[0.98] animate-in fade-in cursor-pointer"
              >
                Notify Me
              </button>
            )}

            {(waitlistStep === 'input' || waitlistStep === 'submitting') && (
              <form onSubmit={handleWaitlistSubmit} className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <input
                  autoFocus
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-[#050505] border border-white/10 rounded-md h-14 px-5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/40 transition-all ring-0 outline-none cursor-text"
                  disabled={waitlistStep === 'submitting'}
                />
                <button
                  type="submit"
                  disabled={waitlistStep === 'submitting'}
                  className="w-full h-14 rounded-md bg-white text-black font-black text-center uppercase tracking-[0.3em] text-[10px] transition-all duration-300 hover:bg-neutral-100 hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.3)] active:scale-[0.98] disabled:opacity-40 flex items-center justify-center border-none outline-none cursor-pointer"
                >
                  {waitlistStep === 'submitting' ? (
                    <Loader2 className="animate-spin text-black" size={16} />
                  ) : (
                    'Confirm Access'
                  )}
                </button>
                {error && <p className="text-[9px] text-red-500 text-center uppercase tracking-[0.2em] animate-in fade-in font-black mt-2">{error}</p>}
              </form>
            )}

            {waitlistStep === 'success' && (
              <div className="relative group p-8 rounded-2xl bg-[#030303] border border-white/5 transition-all duration-500 cursor-pointer">
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-6">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-3">Priority Reserved</h3>
                <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/40 leading-relaxed">
                  We will contact you via email
                  <br />
                  when a slot becomes available.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* VC / INSTITUTIONAL */}
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/5 flex flex-col relative overflow-hidden group cursor-pointer transition-all duration-300">

          <div className="mb-8 relative z-10">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Globe size={18} className="text-emerald-400" />
              Institutional
            </h2>
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
            className="w-full h-14 rounded-md bg-white text-black font-black text-center transition-all duration-300 hover:bg-neutral-100 hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.3)] active:scale-[0.98] uppercase tracking-[0.3em] text-[10px] flex items-center justify-center block relative z-10"
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