"use client";

import Link from "next/link";
import FastLink from "./FastLink";
import { SITE } from "../config/site";
import { useEffect, useRef, useState, useCallback, memo, useMemo, lazy, Suspense } from "react";
import { usePathname } from "next/navigation";
import { useIsPro } from "../lib/use-plan";
import { isFeatureEnabled } from "../lib/flags";
import { useInstantRouter } from "./InstantRouter";

// Lazy load the wallet component since it's heavy
const SimplifiedConnectButton = lazy(() => import("./wallet/SimplifiedConnectButton"));

// Extract constants to prevent recreating on each render
const SCROLL_THRESHOLD = 10;
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex="0"]';

// Memoized mobile menu component to prevent unnecessary re-renders
const MobileMenu = memo(function MobileMenu({ 
  open, 
  onClose, 
  pathname, 
  isPro, 
  isInsightPage,
  panelRef
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  isPro: boolean;
  isInsightPage: boolean;
  panelRef: React.RefObject<HTMLDivElement | null>;
}) {
  const navigationItems = useMemo(() => [
    { href: "/feed", label: "Feed", primary: true },
    { href: "/studio", label: "Studio", primary: true },
    { href: "/leaderboard", label: "Leaderboard", primary: true },
    { href: "/my-predictions", label: "My Predictions", primary: true },
    { href: "/account", label: "Account", primary: false, showPro: true },
    ...(isPro ? [{ href: "/account/billing", label: "Billing", primary: false }] : []),
  ], [isPro]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] sm:hidden" aria-hidden={false}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="absolute right-0 top-0 h-full w-[78%] max-w-[320px] translate-x-0 rounded-l-xl border-l border-slate-700 bg-slate-900/95 backdrop-blur-md p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="font-semibold text-slate-100">Menu</div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-700 bg-slate-800/70 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            aria-label="Close navigation menu"
          >
            <span aria-hidden>✕</span>
          </button>
        </div>
        <nav className="flex flex-col gap-3">
          {/* Primary navigation */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Main</div>
            {navigationItems.filter(item => item.primary).map(item => (
              <FastLink
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                  pathname === item.href 
                    ? 'text-white bg-blue-500/20' 
                    : 'text-slate-100 hover:bg-slate-800/70'
                }`}
                onClick={onClose}
              >
                {item.label}
              </FastLink>
            ))}
          </div>
          
          {/* Wallet Authentication */}
          <div className="space-y-2 mb-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Wallet</div>
            <div className="w-full">
              <Suspense fallback={
                <button className="w-full px-4 py-2 bg-slate-700 rounded-lg animate-pulse">
                  <div className="h-5 bg-slate-600 rounded w-24 mx-auto"></div>
                </button>
              }>
                <SimplifiedConnectButton />
              </Suspense>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">More</div>
            {navigationItems.filter(item => !item.primary).map(item => (
              <FastLink
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 flex items-center gap-2 ${
                  pathname === item.href 
                    ? 'text-white bg-blue-500/20' 
                    : 'text-slate-300 hover:bg-slate-800/70'
                }`}
                onClick={onClose}
              >
                {item.label}
                {item.showPro && isPro && (
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-[#FF6B35] to-[#F7931E] px-1.5 py-0.5 text-[10px] font-medium text-white">
                    PRO
                  </span>
                )}
              </FastLink>
            ))}
          </div>
          <Link
            href="/studio"
            className={`mt-2 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all hover:translate-y-[-1px] focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
              isInsightPage 
                ? "bg-gradient-to-r from-blue-500 to-teal-600 text-white shadow-lg" 
                : "border border-slate-600 bg-transparent text-slate-100/80 opacity-80 hover:opacity-100"
            }`}
            onClick={onClose}
          >
            Open Studio
          </Link>
        </nav>
      </div>
    </div>
  );
});

// Memoized navigation link component
const NavLink = memo(function NavLink({ 
  href, 
  children, 
  pathname, 
  className = "",
  ...props 
}: {
  href: string;
  children: React.ReactNode;
  pathname: string;
  className?: string;
  [key: string]: any;
}) {
  const isActive = pathname === href;
  const { instantNavigate, preloadOnHover, isTransitioning } = useInstantRouter();
  
  return (
    <a
      href={href}
      onClick={(e) => instantNavigate(href, e)}
      onMouseEnter={() => preloadOnHover(href)}
      className={`flex h-14 items-center px-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
        isActive 
          ? 'text-white bg-blue-500/20 rounded-lg' 
          : 'text-blue-100 hover:text-white hover:bg-blue-500/10 rounded-lg'
      } ${isTransitioning ? 'opacity-70' : ''} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
});

// Account dropdown menu component
const AccountDropdown = memo(function AccountDropdown({ 
  pathname, 
  isPro 
}: {
  pathname: string;
  isPro: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { instantNavigate, preloadOnHover } = useInstantRouter();
  
  const isAccountPage = pathname.startsWith('/account') || pathname === '/my-predictions';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => {
          preloadOnHover('/account');
          preloadOnHover('/my-predictions');
        }}
        className={`flex h-14 items-center px-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
          isAccountPage
            ? 'text-white bg-blue-500/20 rounded-lg' 
            : 'text-blue-100 hover:text-white hover:bg-blue-500/10 rounded-lg'
        }`}
      >
        Account
        {isPro && (
          <span className="ml-1.5 inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-teal-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            PRO
          </span>
        )}
        <svg 
          className={`ml-1 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-700 bg-slate-900/95 backdrop-blur-md shadow-xl z-50">
          <div className="py-1">
            <a
              href="/my-predictions"
              onClick={(e) => {
                instantNavigate('/my-predictions', e);
                setIsOpen(false);
              }}
              className={`block px-4 py-2 text-sm transition-colors ${
                pathname === '/my-predictions'
                  ? 'text-white bg-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              My Predictions
            </a>
            {isPro && (
              <a
                href="/account/billing"
                onClick={(e) => {
                  instantNavigate('/account/billing', e);
                  setIsOpen(false);
                }}
                className={`block px-4 py-2 text-sm transition-colors ${
                  pathname === '/account/billing'
                    ? 'text-white bg-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Billing
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isPro = useIsPro();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<Element | null>(null);

  // Add InstantRouter for faster navigation
  const { instantNavigate, preloadOnHover, isTransitioning } = useInstantRouter();

  // Memoize derived values
  const isInsightPage = useMemo(() => pathname.startsWith('/i/'), [pathname]);
  const showAdvisor = useMemo(() => isFeatureEnabled('ADVISOR'), []);
  const showActions = useMemo(() => isFeatureEnabled('ACTIONS'), []);

  const closeMenu = useCallback(() => setOpen(false), []);
  const openMenu = useCallback(() => setOpen(true), []);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll state with throttled updates
  useEffect(() => {
    let ticking = false;
    
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const shouldScroll = window.scrollY > SCROLL_THRESHOLD;
          setScrolled(shouldScroll);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, []);

  // Enhanced focus management and keyboard navigation
  useEffect(() => {
    if (!open) return;
    
    lastFocusedRef.current = document.activeElement ?? null;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    if (panel) {
      const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      focusables[0]?.focus();

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          closeMenu();
          return;
        }
        
        if (e.key === "Tab" && focusables.length > 0) {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("keydown", onKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [open, closeMenu]);

  // Restore focus when menu closes
  useEffect(() => {
    if (!open && lastFocusedRef.current instanceof HTMLElement) {
      lastFocusedRef.current.focus();
      lastFocusedRef.current = null;
    }
  }, [open]);

  return (
    <nav className={`sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md transition-all ${
      scrolled ? 'border-b border-blue-700/40' : 'border-b border-transparent'
    }`}>
      <div className="mx-auto max-w-7xl px-4 flex h-14 items-center justify-between">
        <Link
          href="/"
          className="flex items-center hover:opacity-90 transition-all duration-200 hover:scale-105"
          aria-label={SITE.name}
        >
          {/* Logo Text */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-200 via-teal-200 to-cyan-200 bg-clip-text text-transparent leading-tight">
              Predikt
            </span>
          </div>
        </Link>

        {/* Desktop nav - Optimized with memoized components */}
        <div className="hidden items-center gap-6 sm:flex">
          <a
            href="/feed"
            onClick={(e) => instantNavigate('/feed', e)}
            onMouseEnter={() => preloadOnHover('/feed')}
            className={`flex h-14 items-center px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
              pathname === '/feed' 
                ? 'text-white bg-blue-500/20 rounded-lg' 
                : 'text-blue-100 hover:text-white hover:bg-blue-500/10 rounded-lg'
            } ${isTransitioning ? 'opacity-70' : ''}`}
          >
            Feed
          </a>
          
          <a
            href="/studio"
            onClick={(e) => instantNavigate('/studio', e)}
            onMouseEnter={() => preloadOnHover('/studio')}
            className={`flex h-14 items-center px-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
              pathname === '/studio' 
                ? 'text-white bg-blue-500/20 rounded-lg' 
                : 'text-blue-100 hover:text-white hover:bg-blue-500/10 rounded-lg'
            } ${isTransitioning ? 'opacity-70' : ''}`}
          >
            Studio
          </a>
          
          <a
            href="/leaderboard"
            onClick={(e) => instantNavigate('/leaderboard', e)}
            onMouseEnter={() => preloadOnHover('/leaderboard')}
            className={`flex h-14 items-center px-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
              pathname === '/leaderboard' 
                ? 'text-white bg-blue-500/20 rounded-lg' 
                : 'text-blue-100 hover:text-white hover:bg-blue-500/10 rounded-lg'
            } ${isTransitioning ? 'opacity-70' : ''}`}
          >
            Leaderboard
          </a>
          
          <a
            href="/my-predictions"
            onClick={(e) => instantNavigate('/my-predictions', e)}
            onMouseEnter={() => preloadOnHover('/my-predictions')}
            className={`flex h-14 items-center px-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
              pathname === '/my-predictions' 
                ? 'text-white bg-blue-500/20 rounded-lg' 
                : 'text-blue-100 hover:text-white hover:bg-blue-500/10 rounded-lg'
            } ${isTransitioning ? 'opacity-70' : ''}`}
          >
            My Predictions
          </a>
          
          <a
            href="/account"
            onClick={(e) => instantNavigate('/account', e)}
            onMouseEnter={() => preloadOnHover('/account')}
            className={`flex h-14 items-center px-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
              pathname.startsWith('/account')
                ? 'text-white bg-blue-500/20 rounded-lg' 
                : 'text-blue-100 hover:text-white hover:bg-blue-500/10 rounded-lg'
            } ${isTransitioning ? 'opacity-70' : ''}`}
          >
            Account
            {isPro && (
              <span className="ml-1.5 inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-teal-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                PRO
              </span>
            )}
          </a>
        </div>
        
        {/* Right side - Optimized with conditional rendering */}
        <div className="flex items-center gap-3">
          {mounted && (
            <Suspense fallback={
              <button className="px-4 py-2 bg-slate-700 rounded-lg animate-pulse">
                <div className="h-5 bg-slate-600 rounded w-20"></div>
              </button>
            }>
              <SimplifiedConnectButton />
            </Suspense>
          )}
          {mounted && !isPro && (
            <Link
              href="/pay"
              className="hidden sm:inline-flex h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-all focus-visible:ring-2 focus-visible:ring-emerald-400/50"
            >
              Upgrade
            </Link>
          )}
          <Link
            href="/studio"
            className={`inline-flex h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
              isInsightPage 
                ? "bg-gradient-to-r from-blue-500 to-teal-600 text-white shadow-lg hover:shadow-xl" 
                : "border border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800"
            }`}
          >
            <span className="hidden sm:inline">Open Studio</span>
            <span className="sm:hidden">Studio</span>
          </Link>
          <button
            type="button"
            className="sm:hidden inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-700 bg-slate-900/70 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 hover:bg-slate-800/70 transition-colors"
            aria-label="Open navigation menu"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={openMenu}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Optimized mobile menu */}
      <MobileMenu
        open={open}
        onClose={closeMenu}
        pathname={pathname}
        isPro={isPro}
        isInsightPage={isInsightPage}
        panelRef={panelRef}
      />
    </nav>
  );
}
