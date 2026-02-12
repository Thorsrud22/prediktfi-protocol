'use client';

import React, { useState } from 'react'
import Link from 'next/link'
import { Merriweather } from 'next/font/google';
import { Check, Zap, Shield, Globe, Loader2 } from 'lucide-react'

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700'],
});



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
    <div className="relative min-h-screen overflow-hidden text-slate-100 selection:bg-white/20">

      {/* Header */}
      <div className="relative z-10 px-6 pt-20 pb-14 text-center sm:pt-24 sm:pb-16">
        <div className="mb-4 inline-block rounded-full border border-white/18 bg-white/[0.04] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
          Transparent Business Model
        </div>
        <h1 className={`${merriweather.className} mb-6 text-4xl font-bold tracking-tight text-white sm:mb-8 sm:text-6xl`}>
          Who <span className="text-white/80">Pays?</span>
        </h1>
        <p className="mx-auto max-w-3xl text-lg font-normal leading-[2.15] tracking-[0.01em] text-slate-300 sm:leading-[2.25]">
          <span className="block">We don't sell your data. We sell institutional-grade processing power.</span>
          <span className="mt-4 block sm:mt-5">Choose the tier that matches your operational scale.</span>
        </p>
      </div>

      {/* Tiers */}
      <div className="relative z-20 mx-auto mt-8 grid max-w-6xl gap-6 px-6 pb-20 sm:mt-12 md:grid-cols-3">

        {/* FREE / SCOUT */}
        <div className="relative flex flex-col overflow-hidden rounded-3xl border border-white/18 bg-white/[0.02] p-8 transition-colors duration-200 hover:border-white/26">

          <div className="relative z-10 mb-8">
            <h2 className={`${merriweather.className} mb-2 flex items-center gap-2 text-xl font-bold text-white`}>
              <Zap size={18} className="text-white/55" />
              Market Scout
            </h2>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-white">$0</span>
              <span className="ml-1 text-sm font-medium text-white/55">/ forever</span>
            </div>
            <p className="mt-4 h-10 text-sm leading-relaxed text-slate-400">
              Essential reconnaissance for early trends.
            </p>
          </div>
          <ul className="relative z-10 mb-8 flex-1 space-y-4">
            {[
              '3 AI Evaluations / Day',
              'Basic Due Diligence',
              'Market Sentiment Analysis',
              'Community Access'
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-slate-200">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-white/55 transition-colors" />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/studio"
            className="relative z-10 flex h-14 w-full items-center justify-center rounded-md border border-white/24 bg-transparent text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-white transition-colors duration-200 hover:border-white/34 hover:bg-white/[0.03]"
          >
            Start Scouting
          </Link>
        </div>

        {/* PRO / FOUNDER */}
        <div className="relative flex flex-col overflow-hidden rounded-3xl border border-white/18 bg-white/[0.02] p-8 transition-colors duration-200 hover:border-white/26">
          <div className="relative z-10 mb-8">
            <div className="mb-2 flex items-center justify-between">
              <h2 className={`${merriweather.className} flex items-center gap-2 text-xl font-bold text-white`}>
                <Shield size={18} className="text-white/65" />
                Founder Pro
              </h2>
              <span className={`${merriweather.className} rounded border border-white/24 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold italic uppercase tracking-widest text-white/95`}>
                Recommended
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-white">$49</span>
              <span className="ml-1 text-sm font-medium text-white/55">/ month</span>
            </div>
            <p className="mt-4 h-10 text-sm leading-relaxed text-slate-300">
              For serious builders needing deep forensics and privacy.
            </p>
          </div>
          <ul className="relative z-10 mb-8 flex-1 space-y-4">
            {[
              'Unlimited Evaluations',
              'Deep Contract Forensics',
              'Private Mode (No Public Feed)',
              'Priority GPU Queue',
              'PDF Export for Investors'
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-slate-100">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-white/65" />
                {feature}
              </li>
            ))}
          </ul>

          <div className="relative z-10">
            {waitlistStep === 'initial' && (
              <button
                onClick={() => setWaitlistStep('input')}
                className="h-14 w-full cursor-pointer rounded-md bg-white text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-black transition-colors duration-200 hover:bg-neutral-200 active:bg-neutral-300"
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
                  className="h-14 w-full cursor-text rounded-md border border-white/30 bg-black/35 px-5 text-sm text-white placeholder:text-white/45 ring-0 transition-colors focus:border-white/55 focus:outline-none"
                  disabled={waitlistStep === 'submitting'}
                />
                <button
                  type="submit"
                  disabled={waitlistStep === 'submitting'}
                  className="flex h-14 w-full cursor-pointer items-center justify-center rounded-md border-none bg-white text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-black outline-none transition-colors duration-200 hover:bg-neutral-200 active:bg-neutral-300 disabled:opacity-40"
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
              <div className="relative rounded-2xl border border-white/22 bg-black/25 p-8 transition-colors duration-300">
                <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/22">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-white">Priority Reserved</h3>
                <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/50 leading-relaxed">
                  We will contact you via email
                  <br />
                  when a slot becomes available.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* VC / INSTITUTIONAL */}
        <div className="relative flex flex-col overflow-hidden rounded-3xl border border-white/18 bg-white/[0.02] p-8 transition-colors duration-200 hover:border-white/26">

          <div className="relative z-10 mb-8">
            <h2 className={`${merriweather.className} mb-2 flex items-center gap-2 text-xl font-bold text-white`}>
              <Globe size={18} className="text-white/65" />
              Institutional
            </h2>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-white">API</span>
            </div>
            <p className="mt-4 h-10 text-sm leading-relaxed text-slate-400">
              High-throughput data for funds and platforms.
            </p>
          </div>
          <ul className="relative z-10 mb-8 flex-1 space-y-4">
            {[
              'Custom API Rate Limits',
              'White-label Reports',
              'Diligence Automation',
              'Private Slack Channel'
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-slate-200">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-white/55" />
                {feature}
              </li>
            ))}
          </ul>
          <a
            href="mailto:partners@predikt.fi"
            className="relative z-10 flex h-14 w-full items-center justify-center rounded-md border border-white/24 bg-transparent text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-white transition-colors duration-200 hover:border-white/34 hover:bg-white/[0.03]"
          >
            Contact Sales
          </a>
        </div>

      </div>

      {/* Trust */}
      <div className="mx-auto max-w-4xl border-t border-white/20 px-6 pt-12 pb-16 text-center">
        <h4 className="mb-8 text-xs font-semibold uppercase tracking-widest text-slate-300">
          Trusted by early adopters from
        </h4>
        <div className="flex flex-wrap justify-center gap-8 grayscale transition-all duration-500 hover:grayscale-0 md:gap-16">
          {['Solana', 'Ethereum', 'Base', 'Arbitrum'].map(chain => (
            <span key={chain} className="text-xl font-semibold text-white/72">{chain}</span>
          ))}
        </div>
      </div>

    </div>
  )
}
