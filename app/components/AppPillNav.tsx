'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { InstantLink } from './InstantLink';
import { useSimplifiedWallet } from './wallet/SimplifiedWalletProvider';
import { useIsPro } from '../lib/use-plan';

// Constants
const SCROLL_THRESHOLD = 50;
const WALLET_ADDRESS_DISPLAY_LENGTH = { start: 4, end: 3 };

// Wallet Dropdown Component
function WalletDropdown({
  publicKey,
  isOpen,
  onClose,
  onDisconnect,
}: {
  publicKey: string;
  isOpen: boolean;
  onClose: () => void;
  onDisconnect: () => void;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  }, [publicKey]);

  const handleDisconnect = useCallback(() => {
    onDisconnect();
    onClose();
  }, [onDisconnect, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const shortAddress = useMemo(
    () =>
      `${publicKey.slice(0, WALLET_ADDRESS_DISPLAY_LENGTH.start)}...${publicKey.slice(-WALLET_ADDRESS_DISPLAY_LENGTH.end)}`,
    [publicKey]
  );

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-14 w-64 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden"
      role="menu"
      aria-label="Wallet options"
    >
      <div className="p-4 border-b border-slate-700/50">
        <p className="text-xs text-slate-400 mb-1">Wallet Address</p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-slate-200 font-mono break-all flex-1">{publicKey}</p>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 p-1.5 hover:bg-slate-800 rounded transition-colors"
            title="Copy address"
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className="p-2">
        <button
          onClick={handleDisconnect}
          className="w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition-colors text-left"
          role="menuitem"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}

export default function AppPillNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { publicKey, disconnect } = useSimplifiedWallet();
  const isPro = useIsPro();
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const navListRef = useRef<HTMLUListElement>(null);

  // Scroll detection with throttling
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let frame = -1;
    const handleScroll = () => {
      if (frame === -1) {
        frame = window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
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

      try {
        resizeObserver.observe(list);
      } catch (err) {
        console.error('ResizeObserver error:', err);
      }
    }

    const handleResize = () => window.requestAnimationFrame(updateIndicator);
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [pathname]);

  const navItems = useMemo(
    () => [
      // { href: '/studio', label: 'STUDIO' }, // Disabled for Private Alpha
      // { href: '/feed', label: 'FEED' }, // Legacy
      // { href: '/leaderboard', label: 'LEADERBOARD' }, // Legacy
      // { href: '/my-predictions', label: 'MY PREDICTIONS' }, // Legacy
      // { href: '/account', label: 'ACCOUNT' }, // Disabled for Private Alpha
    ] as Array<{ href: string; label: string }>,
    []
  );

  const shortAddress = useCallback((addr: string) => {
    return `${addr.slice(0, WALLET_ADDRESS_DISPLAY_LENGTH.start)}...${addr.slice(-WALLET_ADDRESS_DISPLAY_LENGTH.end)}`;
  }, []);

  const toggleWalletDropdown = useCallback(() => {
    setIsWalletDropdownOpen((prev) => !prev);
  }, []);

  const closeWalletDropdown = useCallback(() => {
    setIsWalletDropdownOpen(false);
  }, []);

  const handleUpgradeClick = useCallback(() => {
    router.push('/upgrade');
  }, [router]);

  // Logo component
  const Logo = useMemo(
    () => (
      <InstantLink
        href="/"
        className="group flex items-center gap-2.5 rounded-full bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 px-2.5 py-1.5 pr-4 backdrop-blur-xl ring-1 ring-inset ring-white/10 transition-all hover:ring-white/20 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] duration-300"
        aria-label="Predikt home"
      >
        <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 ring-1 ring-white/20 shadow-[0_8px_32px_rgba(59,130,246,0.4)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_12px_40px_rgba(59,130,246,0.6)] group-hover:ring-white/30">
          <Image
            src="/images/predikt-orb.svg"
            alt="Predikt logo"
            width={36}
            height={36}
            className="h-full w-full object-contain p-0.5 drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
            priority
          />
          {/* Subtle rotating glow effect */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/20 via-transparent to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
        </span>
        <span className="font-inter text-base font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
          Predikt
        </span>
      </InstantLink>
    ),
    []
  );

  return (
    <>
      {/* Brand Chip */}
      <div
        className={`fixed top-3 left-4 sm:left-6 z-50 transition-transform duration-300 ${isScrolled ? 'scale-[0.98]' : 'scale-100'
          }`}
      >
        {Logo}
      </div>

      {/* Main Navigation - Hidden for Private Alpha
      <div
        className={`fixed top-3 left-1/2 z-40 -translate-x-1/2 transition-transform duration-300 ${isScrolled ? 'scale-[0.98]' : 'scale-100'
          }`}
      >
        <nav
          className={`rounded-full bg-white/5 backdrop-blur-md ring-1 ring-inset ring-white/10 shadow-lg px-1 py-1 transition-all duration-300 ${isScrolled ? 'backdrop-blur-lg shadow-xl' : ''
            }`}
          aria-label="Main navigation"
        >
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
                    <InstantLink
                      href={item.href}
                      className="relative inline-flex h-10 md:h-11 items-center justify-center rounded-full px-4 text-sm font-semibold leading-none text-white/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 transition-all hover:-translate-y-px hover:shadow-md uppercase tracking-wide"
                      aria-current={active ? 'page' : undefined}
                    >
                      <span className="relative z-10 translate-y-[0.5px]">{item.label}</span>
                    </InstantLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </div>
      */}

      {/* Wallet & Upgrade Actions - Positioned absolutely on the right */}
      <div className="fixed top-4 right-4 z-[100] flex items-center gap-2">
        {/* Wallet button - Hidden for Private Alpha
        {publicKey && (
          <div className="relative">
            <button
              onClick={toggleWalletDropdown}
              className="h-[42px] px-4 bg-white/5 backdrop-blur-md text-slate-200 rounded-full font-medium text-sm hover:bg-white/10 transition-all flex items-center gap-2"
              aria-expanded={isWalletDropdownOpen}
              aria-haspopup="menu"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              {shortAddress(publicKey)}
            </button>

            <WalletDropdown
              publicKey={publicKey}
              isOpen={isWalletDropdownOpen}
              onClose={closeWalletDropdown}
              onDisconnect={disconnect}
            />
          </div>
        )}
        */}

        {/* Upgrade button - only show if not pro */}
        {/* Upgrade button - Disabled for Private Alpha */}
        {/*
        {!isPro && (
          <button
            onClick={handleUpgradeClick}
            className="h-[42px] px-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 rounded-full font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            Upgrade
          </button>
        )}
        */}
      </div>
    </>
  );
}
