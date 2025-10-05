'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const navListRef = useRef<HTMLUListElement>(null);

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
    if (typeof window === 'undefined') return;

    let frame = -1;
    const handleScroll = () => {
      if (frame === -1) {
        frame = window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);
          frame = -1;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frame !== -1) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  // Update animated indicator position when the active link changes
  useEffect(() => {
    const indicator = indicatorRef.current;
    const list = navListRef.current;
    if (!indicator || !list) return;

    const updateIndicator = () => {
      const activeLink = list.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
      if (!activeLink) {
        indicator.style.opacity = '0';
        return;
      }

      const listRect = list.getBoundingClientRect();
      const activeRect = activeLink.getBoundingClientRect();
      const left = activeRect.left - listRect.left;

      indicator.style.transform = `translateX(${left}px)`;
      indicator.style.width = `${activeRect.width}px`;
      indicator.style.opacity = '1';
    };

    updateIndicator();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(updateIndicator);
      });

      resizeObserver.observe(list);
    }

    const handleResize = () => window.requestAnimationFrame(updateIndicator);
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [pathname]);

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
      className="group flex items-center gap-3 rounded-full bg-white/5 px-2.5 py-1.5 pr-4 backdrop-blur-md ring-1 ring-inset ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20"
      aria-label="Predikt home"
    >
      <span className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-900/60 ring-1 ring-white/20 shadow-[0_12px_30px_rgba(59,130,246,0.35)] transition-transform group-hover:scale-105">
        <Image
          src="/images/predikt-orb.svg"
          alt="Predikt logo"
          width={40}
          height={40}
          className="h-full w-full object-contain"
          priority
        />
      </span>
      <span className="text-base font-semibold tracking-tight text-white">Predikt</span>
    </Link>
  );

  return (
    <>
      {/* Main Navigation */}
      <div
        className={`fixed top-3 left-4 sm:left-6 z-50 transition-transform duration-300 ${
          isScrolled ? 'scale-[0.98]' : 'scale-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <Logo />
          
          {/* Pill Nav - Outer wrapper with ring */}
          <div className={`rounded-full bg-white/5 backdrop-blur-md ring-1 ring-inset ring-white/10 shadow-lg px-1 py-1 transition-all duration-300 ${isScrolled ? 'backdrop-blur-lg shadow-xl' : ''}`}>
            {/* Inner wrapper with overflow-hidden to clip animated pill */}
            <div className="rounded-full overflow-hidden">
              <ul
                ref={navListRef}
                className="relative flex items-center gap-1 whitespace-nowrap overflow-x-auto px-1"
              >
                <span
                  ref={indicatorRef}
                  aria-hidden
                  className="pointer-events-none absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-sky-500/25 to-cyan-400/25 shadow-[inset_0_1px_0_rgba(255,255,255,.20)] transition-[transform,width,opacity] duration-300 ease-out"
                  style={{ width: 0, transform: 'translateX(0)', opacity: 0 }}
                />
                {navItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="relative inline-flex h-10 md:h-11 items-center justify-center rounded-full px-4 text-sm font-semibold leading-none text-white/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 transition-all hover:-translate-y-px hover:shadow-md uppercase tracking-wide"
                        aria-current={active ? 'page' : undefined}
                      >
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
