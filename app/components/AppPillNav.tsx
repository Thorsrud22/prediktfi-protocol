'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { InstantLink } from './InstantLink';
import { useSimplifiedWallet } from './wallet/SimplifiedWalletProvider';
import { useIsPro } from '../lib/use-plan';
import { useToast } from './ToastProvider';

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
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Use mousedown/touchstart to trigger before potential click handlers
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
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
      className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-20 sm:top-14 sm:w-64 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden z-[1000]"
      role="menu"
      aria-label="Wallet options"
    >
      <div className="p-4 border-b border-slate-700/50">
        <p className="text-xs text-slate-400 mb-1">Wallet Address</p>
        <div className="flex items-center justify-between gap-2">
          {/* Show truncated on mobile, full on desktop */}
          <p className="text-sm text-slate-200 font-mono sm:hidden">{`${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`}</p>
          <p className="text-sm text-slate-200 font-mono break-all flex-1 hidden sm:block">{publicKey}</p>
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
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDisconnect();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDisconnect();
          }}
          className="w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition-colors text-left font-semibold active:bg-slate-700/50"
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
  const { publicKey, disconnect, connect } = useSimplifiedWallet();
  const isPro = useIsPro();
  const { addToast } = useToast();
  // Animation state: 'hidden' | 'visible' | 'fading'
  const [tooltipState, setTooltipState] = useState<'hidden' | 'visible' | 'fading'>('hidden');
  // Timer ref to handle cleanup if clicked rapidly
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      { href: '/studio', label: 'Studio' },
      // { href: '/feed', label: 'FEED' }, // Legacy
      // { href: '/leaderboard', label: 'LEADERBOARD' }, // Legacy
      // { href: '/my-predictions', label: 'MY PREDICTIONS' }, // Legacy
      { href: '/account', label: 'Account' },
    ],
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
    // Clear existing timer if any
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);

    setTooltipState('visible');

    // 1. Wait 3.5s then start fading out
    tooltipTimerRef.current = setTimeout(() => {
      setTooltipState('fading');

      // 2. Wait 500ms for fade out animation to finish, then hide
      tooltipTimerRef.current = setTimeout(() => {
        setTooltipState('hidden');
      }, 500);
    }, 3500);
  }, []);

  // Logo component
  const Logo = useMemo(
    () => (
      <InstantLink
        href="/"
        className="group flex items-center gap-2.5 rounded-full bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 px-2.5 py-1.5 pr-4 backdrop-blur-xl ring-1 ring-inset ring-white/10 transition-all hover:ring-white/20 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] duration-300"
        aria-label="Predikt home"
      >
        <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/20 shadow-[0_8px_32px_rgba(59,130,246,0.4)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_12px_40px_rgba(59,130,246,0.6)] group-hover:ring-white/30 overflow-hidden">
          <Image
            src="/images/logo.png"
            alt="Predikt logo"
            width={40}
            height={40}
            className="absolute inset-0 h-full w-full object-cover scale-[1.3]"
            priority
          />
          {/* Subtle rotating glow effect */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/20 via-transparent to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
        </span>
        <span className="font-inter text-base font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)] hidden sm:inline-block">
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

      {/* Main Navigation - Hidden on mobile to prevent overlap */}
      <div
        className={`hidden sm:block fixed top-3 left-1/2 z-40 -translate-x-1/2 transition-transform duration-300 ${isScrolled ? 'scale-[0.98]' : 'scale-100'
          }`}
      >
        {/* Pill Nav - Outer wrapper with ring */}
        <nav
          className={`rounded-full bg-white/5 backdrop-blur-md ring-1 ring-inset ring-white/10 shadow-lg px-1 py-1 transition-all duration-300 ${isScrolled ? 'backdrop-blur-lg shadow-xl' : ''
            }`}
          aria-label="Main navigation"
        >
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

      {/* Wallet & Upgrade Actions - Positioned absolutely on the right */}
      <div className="fixed top-3 right-4 sm:right-6 z-[100] flex items-center gap-2">
        {/* Wallet button - Connected state */}
        {publicKey && (
          <div className="relative">
            <button
              onClick={toggleWalletDropdown}
              className="h-10 sm:h-12 px-3 sm:px-4 bg-white/5 backdrop-blur-md text-slate-200 rounded-full font-medium text-sm hover:bg-white/10 transition-all flex items-center gap-2"
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
              <span className="hidden sm:inline">{shortAddress(publicKey)}</span>
            </button>

            <WalletDropdown
              publicKey={publicKey}
              isOpen={isWalletDropdownOpen}
              onClose={closeWalletDropdown}
              onDisconnect={disconnect}
            />
          </div>
        )}

        {/* Connect Wallet button - Disconnected state */}
        {!publicKey && (
          <button
            onClick={connect}
            className="h-10 sm:h-12 px-3 sm:px-4 bg-white/5 backdrop-blur-md text-slate-200 rounded-full font-medium text-sm hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <span className="hidden sm:inline">Connect</span>
          </button>
        )}

        {/* Upgrade button - only show if not pro */}
        {!isPro && (
          <div className="relative">
            <button
              onClick={handleUpgradeClick}
              className="h-10 sm:h-12 px-3 sm:px-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 rounded-full font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              <span className="hidden sm:inline">Upgrade</span>
            </button>
            {/* Local Coming Soon Tooltip */}
            {tooltipState !== 'hidden' && (
              <div
                className={`fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-20 sm:top-full sm:mt-3 sm:w-64 p-3 bg-slate-800 text-white text-sm rounded-xl shadow-xl border border-slate-700 z-[1000]
                  animate-tooltip-enter
                  ${tooltipState === 'fading' ? 'animate-tooltip-exit' : ''}
                `}              >
                <div className="font-bold mb-1 text-sky-400">Coming Soon</div>
                <div className="text-slate-300 text-xs leading-relaxed">
                  Predikt Pro is currently being rolled out to select users.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation - Only visible on mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700/50 safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <InstantLink
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1.5 px-4 py-2 transition-all ${active ? 'text-sky-400 opacity-100' : 'text-slate-300 opacity-60 hover:opacity-100'}`}
                aria-current={active ? 'page' : undefined}
              >
                {item.href === '/studio' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                {item.href === '/account' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{item.label}</span>
              </InstantLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
