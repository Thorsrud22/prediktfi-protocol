'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type Step = 'questions' | 'loading' | 'success';

export default function RequestAccessPage() {
    const [step, setStep] = useState<Step>('questions');
    const [formData, setFormData] = useState({
        focus: [] as string[],
        twitterHandle: '',
        walletAddress: '',
        communities: '',
        email: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('loading');

        try {
            await fetch('/api/access-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            await new Promise(resolve => setTimeout(resolve, 800));
            setStep('success');
        } catch (error) {
            console.error('Application failed', error);
            setStep('success');
        }
    };

    const toggleFocus = (value: string) => {
        setFormData(prev => ({
            ...prev,
            focus: prev.focus.includes(value)
                ? prev.focus.filter(f => f !== value)
                : [...prev.focus, value]
        }));
    };

    return (
        <div className="relative min-h-screen">

            {/* Brand Pill - Fixed Top Left */}
            <div className="fixed top-3 left-4 sm:left-6 z-50">
                <Link
                    href="/"
                    className="group flex items-center gap-2.5 rounded-full bg-slate-900/90 px-2.5 py-1.5 pr-4 ring-1 ring-inset ring-white/10 transition-all hover:ring-white/20 duration-300"
                    aria-label="Predikt home"
                >
                    <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-white/20 transition-all duration-300 group-hover:scale-110 group-hover:ring-white/30">
                        <Image
                            src="/images/predikt-orb.svg"
                            alt="Predikt logo"
                            width={36}
                            height={36}
                            className="h-full w-full object-contain p-0.5 drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
                            priority
                        />
                    </span>
                    <span className="font-inter text-base font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
                        Predikt
                    </span>
                </Link>
            </div>

            {/* Form Content */}
            <div className="relative z-10 flex justify-center px-4 pt-20 pb-12">
                <div className="w-full max-w-sm bg-[#0F172A] border border-slate-700 rounded-2xl shadow-2xl relative">
                    {/* Close Button */}
                    <Link
                        href="/"
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors z-50"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </Link>

                    <div className="p-8">
                        {step === 'success' ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Application Received</h3>
                                <p className="text-slate-400">
                                    You&apos;ve been added to our priority queue. <br />
                                    We&apos;ll email you at <span className="text-white font-medium">{formData.email}</span> if you&apos;re selected for the alpha.
                                </p>
                                <Link
                                    href="/"
                                    className="mt-8 inline-block px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-medium transition-colors"
                                >
                                    Back to Home
                                </Link>
                            </div>
                        ) : step === 'loading' ? (
                            <div className="text-center py-16">
                                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                                <p className="text-slate-400 animate-pulse">Processing application...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white">Request Early Access</h3>
                                    <p className="text-slate-400 text-sm">Help us tailor your experience.</p>
                                </div>

                                {/* Focus Areas */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-300">Primary Interests (Select all that apply)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['DeFi Protocols', 'AI Agents', 'Emerging Assets', 'Yield Strategies'].map((f) => (
                                            <button
                                                key={f}
                                                type="button"
                                                onClick={() => toggleFocus(f)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${formData.focus.includes(f)
                                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                                    }`}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Twitter / X Handle */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-300">Twitter / X Handle <span className="text-red-400">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">@</span>
                                        <input
                                            type="text"
                                            required
                                            placeholder="crypto_wizard"
                                            value={formData.twitterHandle}
                                            onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Wallet Address */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-300">
                                        Solana Wallet Address <span className="text-slate-500 font-normal ml-1">(Optional but recommended)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter your public key..."
                                        value={formData.walletAddress}
                                        onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                    />
                                </div>

                                {/* Communities */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-300">What crypto communities are you active in?</label>
                                    <textarea
                                        rows={2}
                                        placeholder="e.g. Superteam, Mad Lads, MonkeDAO..."
                                        value={formData.communities}
                                        onChange={(e) => setFormData({ ...formData, communities: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-300">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
                                >
                                    Submit Application
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
