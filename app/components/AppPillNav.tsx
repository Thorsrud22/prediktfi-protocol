'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { InstantLink } from './InstantLink';
// import { useSimplifiedWallet } from './wallet/SimplifiedWalletProvider';
import { useIsPro } from '../lib/use-plan';

// Constants
const SCROLL_THRESHOLD = 50;
const WALLET_ADDRESS_DISPLAY_LENGTH = { start: 4, end: 3 };

export default function AppPillNav() {
  const pathname = usePathname();
  const router = useRouter();

  // const { publicKey, disconnect } = useSimplifiedWallet();
  const publicKey = null; // Mock for build safety
  const disconnect = async () => { }; // Mock for build safety

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

      {/* Main Navigation - Hidden for Private Alpha */}
      {/* Note: Original navigation code commented out here */}

      {/* Wallet & Upgrade Actions - Positioned absolutely on the right */}
      <div className="fixed top-4 right-4 z-[100] flex items-center gap-2">
        {/* Wallet button - Hidden for Private Alpha */}

        {/* Upgrade button - Disabled for Private Alpha */}
      </div>
    </>
  );
}
