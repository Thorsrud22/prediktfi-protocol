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

// Wallet Dropdown and associated logic removed as account management moved to /account page

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
    () => {
      const items = [
        { href: '/studio', label: 'Evaluate' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/account', label: 'Account' },
      ];

      return items;
    },
    [publicKey]
  );

  const shortAddress = useCallback((addr: string) => {
    return `${addr.slice(0, WALLET_ADDRESS_DISPLAY_LENGTH.start)}...${addr.slice(-WALLET_ADDRESS_DISPLAY_LENGTH.end)}`;
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



  return (
    <>


      {/* Main Navigation - Hidden on mobile to prevent overlap */}
      <div
        className={`hidden sm:block fixed top-3 left-1/2 z-40 -translate-x-1/2 transition-transform duration-300 ${isScrolled ? 'scale-[0.98]' : 'scale-100'
          }`}
      >
        {/* Pill Nav - Outer wrapper with ring */}
        <nav
          className="rounded-full bg-slate-900/95 ring-1 ring-inset ring-white/10 shadow-lg px-1 py-1 transition-all duration-300"
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
                      className={`relative inline-flex h-10 md:h-11 items-center justify-center rounded-full px-4 text-sm font-semibold leading-none focusing-outline-none focus-visible:ring-2 focus-visible:ring-white/20 transition-all hover:-translate-y-px hover:shadow-md uppercase tracking-wide ${active ? 'text-white' : 'text-white/80 hover:text-white'}`}
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
        {/* User Account Button - Only show if connected */}
        {/* User Account Button - Always show */}
        <div className="relative">
          <InstantLink
            href="/account"
            className={`h-10 sm:h-12 w-10 sm:w-12 flex items-center justify-center rounded-full transition-all ${publicKey
              ? 'bg-white/5 text-slate-200 hover:bg-white/10 ring-1 ring-inset ring-white/10'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 ring-1 ring-inset ring-white/5'
              }`}
            aria-label="Account Dashboard"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </InstantLink>
        </div>

        {/* Upgrade button removed - Pro waitlist available at /request-access */}
      </div>

      {/* Mobile Bottom Navigation - Only visible on mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700/50 safe-area-pb">
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
                {item.href === '/pricing' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
