'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useSimplifiedWallet } from './wallet/SimplifiedWalletProvider';
import { useIsPro } from '../lib/use-plan';

export default function AppPillNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { publicKey, disconnect } = useSimplifiedWallet();
  const isPro = useIsPro();
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const walletDropdownRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

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

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function shortAddress(addr: string) {
    return `${addr.slice(0, 4)}...${addr.slice(-3)}`;
  }

  const navItems = [
    { href: '/feed', label: 'FEED' },
    { href: '/studio', label: 'STUDIO' },
    { href: '/leaderboard', label: 'LEADERBOARD' },
    { href: '/my-predictions', label: 'MY PREDICTIONS' },
    { href: '/account', label: 'ACCOUNT' }
  ];

  // Logo component
  const Logo = () => (
    <Link
      href="/feed"
      className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center font-bold text-slate-900 text-lg hover:scale-105 transition-transform"
    >
      N
    </Link>
  );

  return (
    <>
      {/* Main Navigation */}
      <div className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${isScrolled ? 'scale-95' : 'scale-100'}`}>
        <div className="flex items-center gap-3">
          <Logo />
          
          {/* Pill Nav - Outer wrapper with ring */}
          <div className={`rounded-full bg-white/5 backdrop-blur-md ring-1 ring-inset ring-white/10 shadow-lg px-1 py-1 transition-all duration-300 ${isScrolled ? 'backdrop-blur-lg shadow-xl' : ''}`}>
            {/* Inner wrapper with overflow-hidden to clip animated pill */}
            <div className="rounded-full overflow-hidden">
              <ul className="flex items-center gap-1 whitespace-nowrap overflow-x-auto px-1">
                {navItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="relative inline-flex h-10 md:h-11 items-center justify-center rounded-full px-4 text-sm font-semibold leading-none text-white/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 transition-all hover:-translate-y-px hover:shadow-md uppercase tracking-wide"
                        aria-current={active ? 'page' : undefined}
                      >
                        {active && (
                          <motion.span
                            layoutId="active-pill"
                            className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-sky-500/25 to-cyan-400/25 shadow-[inset_0_1px_0_rgba(255,255,255,.20)]"
                            transition={
                              reduce
                                ? { duration: 0 }
                                : { type: 'spring', stiffness: 500, damping: 38, mass: 0.4 }
                            }
                          />
                        )}
                        <span className="relative z-10 translate-y-[0.5px]">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet & Upgrade Actions - Positioned absolutely on the right */}
      <div className="fixed top-4 right-4 z-[100] flex items-center gap-2">
        {/* Wallet button */}
        {publicKey && (
          <div className="relative" ref={walletDropdownRef}>
            <button
              onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
              className="h-[42px] px-4 bg-white/5 backdrop-blur-md text-slate-200 rounded-full font-medium text-sm hover:bg-white/10 transition-all flex items-center gap-2 ring-1 ring-inset ring-white/10"
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
    </>
  );
}
