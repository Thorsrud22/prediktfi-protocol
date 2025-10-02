'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useRef, useEffect, useState } from 'react';
import PillNav from './pill-nav/PillNav';
import { useSimplifiedWallet } from './wallet/SimplifiedWalletProvider';
import { useIsPro } from '../lib/use-plan';

export default function AppPillNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { publicKey, disconnect } = useSimplifiedWallet();
  const isPro = useIsPro();
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const walletDropdownRef = useRef<HTMLDivElement>(null);

  // Close wallet dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target as Node)) {
        setIsWalletDropdownOpen(false);
      }
    };

    if (isWalletDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isWalletDropdownOpen]);

  function shortAddress(addr: string) {
    return `${addr.slice(0, 4)}...${addr.slice(-3)}`;
  }

  const navItems = [
    { label: 'Feed', href: '/feed' },
    { label: 'Studio', href: '/studio' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'My Predictions', href: '/my-predictions' },
    { label: 'Account', href: '/account' }
  ];

  // Logo as base64 SVG (N letter)
  const logoSvg = `data:image/svg+xml;base64,${btoa(`
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="8" fill="url(#gradient)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#0f172a" font-family="Arial, sans-serif" font-weight="bold" font-size="20">N</text>
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#60a5fa"/>
          <stop offset="100%" stop-color="#22d3ee"/>
        </linearGradient>
      </defs>
    </svg>
  `)}`;

  return (
    <div className="w-full flex items-center justify-center relative">
      <PillNav
        logo={logoSvg}
        logoAlt="PrediktFi"
        items={navItems}
        activeHref={pathname}
        baseColor="#60a5fa"
        pillColor="#0f172a"
        hoveredPillTextColor="#0f172a"
        pillTextColor="#e2e8f0"
        ease="power2.easeOut"
        initialLoadAnimation={true}
      />

      {/* Wallet & Upgrade Actions - Positioned absolutely on the right */}
      <div className="fixed top-4 right-4 z-[100] flex items-center gap-2">
        {/* Wallet button */}
        {publicKey && (
          <div className="relative" ref={walletDropdownRef}>
            <button
              onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
              className="h-[42px] px-4 bg-slate-900/90 backdrop-blur-lg text-slate-200 rounded-full font-medium text-sm hover:bg-slate-800 transition-all flex items-center gap-2 border border-slate-700/50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              {shortAddress(publicKey)}
            </button>

            {/* Wallet Dropdown */}
            {isWalletDropdownOpen && (
              <div className="absolute right-0 top-14 w-64 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">Wallet Address</p>
                  <p className="text-sm text-slate-200 font-mono break-all">{publicKey}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      disconnect();
                      setIsWalletDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition-colors text-left"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upgrade button - only show if not pro */}
        {!isPro && (
          <button
            onClick={() => router.push('/upgrade')}
            className="h-[42px] px-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 rounded-full font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Upgrade
          </button>
        )}
      </div>
    </div>
  );
}
