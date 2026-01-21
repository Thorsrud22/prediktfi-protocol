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
        <div className="relative min-h-screen flex items-center justify-center">
            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] shadow-2xl p-8 relative">
                    {/* Close Button - Inside card */}
                    <Link
                        href="/"
                        className="absolute top-6 right-6 p-1 text-slate-500 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </Link>

                    {step === 'input' && (
                        <>
                            <h1 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">Access Key <span className="text-blue-500">.</span></h1>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] italic border-l-2 border-blue-500 pl-3 mb-8">
                                Institutional Alpha Redemption
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="XXXXXX"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white text-center text-xl font-mono tracking-widest placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    maxLength={32}
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!code.trim()}
                                    className="btn-shimmer w-full py-4 px-6 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-900/40 transition-all duration-300 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:grayscale text-[10px] uppercase tracking-[0.2em] italic"
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
