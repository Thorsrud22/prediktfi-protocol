'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Step = 'input' | 'loading' | 'success' | 'error';

export default function RedeemPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('input');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setStep('loading');
        setError('');

        try {
            const res = await fetch('/api/invite-codes/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.trim().toUpperCase() }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Invalid invite code');
                setStep('error');
                return;
            }

            setStep('success');
            // Redirect to studio after a brief success message
            setTimeout(() => {
                router.push('/studio');
            }, 1500);
        } catch {
            setError('Something went wrong. Please try again.');
            setStep('error');
        }
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

            {/* Main Content */}
            <div className="relative z-10 flex justify-center px-4 pt-24 pb-12">
                <div className="w-full max-w-md bg-[#0F172A] border border-slate-700 rounded-2xl shadow-2xl p-8">
                    {/* Close Button */}
                    <Link
                        href="/"
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </Link>

                    {step === 'input' && (
                        <>
                            <h1 className="text-2xl font-bold text-white mb-2">Enter Your Invite Code</h1>
                            <p className="text-slate-400 mb-6">
                                Paste the invite code you received to unlock full access.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="XXXX-XXXX"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white text-center text-xl font-mono tracking-widest placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    maxLength={12}
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!code.trim()}
                                    className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-sky-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Unlock Access
                                </button>
                            </form>

                            <p className="text-slate-500 text-sm mt-6 text-center">
                                Don&apos;t have a code?{' '}
                                <Link href="/request-access" className="text-blue-400 hover:text-blue-300">
                                    Request access
                                </Link>
                            </p>
                        </>
                    )}

                    {step === 'loading' && (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-400">Verifying your code...</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Access Granted!</h2>
                            <p className="text-slate-400">Redirecting you to the app...</p>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Invalid Code</h2>
                            <p className="text-slate-400 mb-4">{error}</p>
                            <button
                                onClick={() => { setStep('input'); setError(''); }}
                                className="text-blue-400 hover:text-blue-300"
                            >
                                Try again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
