"use client";

import Link from "next/link";
import FastLink from "./FastLink";
import { SITE } from "../config/site";
import { useEffect, useRef, useState, useCallback, memo, useMemo, lazy, Suspense } from "react";
import { usePathname } from "next/navigation";
import { useIsPro } from "../lib/use-plan";
import { isFeatureEnabled } from "../lib/flags";
import { useInstantRouter } from "./InstantRouter";
import { useOnboarding } from "../hooks/useOnboarding";

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
  panelRef,
  onShowHelp
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  isPro: boolean;
  isInsightPage: boolean;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onShowHelp: () => void;
}) {
  const navigationItems = useMemo(() => [
    { href: "/feed", label: "Feed", primary: true },
    { href: "/studio", label: "Studio", primary: true },
    { href: "/leaderboard", label: "Leaderboard", primary: true },
    { href: "/my-predictions", label: "My Predictions", primary: true },
    ...(isFeatureEnabled('ADVISOR') ? [{ href: "/advisor", label: "Advisor", primary: false }] : []),
    ...(isFeatureEnabled('ACTIONS') ? [{ href: "/advisor/actions", label: "Actions", primary: false }] : []),
    { href: "/pricing", label: "Pricing", primary: false },
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
            <button
              onClick={() => {
                onShowHelp();
                onClose();
              }}
              className="rounded-md px-3 py-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 flex items-center gap-2 text-slate-300 hover:bg-slate-800/70 w-full text-left"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Help & Tutorial
            </button>
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

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isPro = useIsPro();
  const { resetOnboarding } = useOnboarding();
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
          
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-600">
            {showAdvisor && (
              <NavLink href="/advisor" pathname={pathname}>
                Advisor
              </NavLink>
            )}
            {showActions && (
              <NavLink href="/advisor/actions" pathname={pathname}>
                Actions
              </NavLink>
            )}
            <NavLink href="/pricing" pathname={pathname}>
              Pricing
            </NavLink>
            <NavLink href="/account" pathname={pathname} className="gap-1.5">
              Account
              {isPro && (
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-teal-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  PRO
                </span>
              )}
            </NavLink>
            {mounted && isPro && (
              <NavLink href="/account/billing" pathname={pathname}>
                Billing
              </NavLink>
            )}
            <NavLink href="/my-predictions" pathname={pathname}>
              My Predictions
            </NavLink>
            <button
              onClick={resetOnboarding}
              className="flex h-14 items-center px-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 text-blue-100 hover:text-white hover:bg-blue-500/10 rounded-lg group relative"
              aria-label="Show help tutorial"
              title="Replay onboarding tutorial"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="ml-1 hidden lg:inline">Help</span>
            </button>
          </div>
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
        onShowHelp={resetOnboarding}
      />
    </nav>
  );
}
