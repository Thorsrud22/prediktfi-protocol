"use client";

import Link from "next/link";
import FastLink from "./FastLink";
import { SITE } from "../config/site";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useIsPro } from "../lib/use-plan";
import { isFeatureEnabled } from "../lib/flags";
import { useWalletAuth } from "../lib/useWalletAuth";
import HeaderConnectButton from "./HeaderConnectButton";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isInsightPage = pathname.startsWith('/i/');
  const isPro = useIsPro();
  const { isAuthenticated, wallet, connectAndAuthenticate, signOut, isLoading } = useWalletAuth();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<Element | null>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll state for navbar border with debouncing
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    // Use passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close on ESC and trap focus within the panel when open
  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = document.activeElement ?? null;

    const panel = panelRef.current;
    if (panel) {
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex="0"]'
      );
      // Focus first focusable
      focusables[0]?.focus();

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          setOpen(false);
          return;
        }
        if (e.key === "Tab" && focusables.length > 0) {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }
  }, [open]);

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
        {/* Desktop nav - Primary navigation */}
        <div className="hidden items-center gap-6 sm:flex">
          {/* Primary navigation - Feed as hero */}
          <FastLink
            href="/feed"
            className={`flex h-14 items-center px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
              pathname === '/feed' 
                ? 'text-white bg-blue-500/20 rounded-lg' 
                : 'text-blue-100 hover:text-white hover:bg-blue-500/10 rounded-lg'
            }`}
          >
            Feed
          </FastLink>
          
          {/* Core functionality */}
          <FastLink
            href="/studio"
            className={`flex h-14 items-center px-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
              pathname === '/studio' 
                ? 'text-white bg-blue-500/20 rounded-lg' 
                : 'text-blue-100 hover:text-white hover:bg-blue-500/10 rounded-lg'
            }`}
          >
            Studio
          </FastLink>
          
          {/* Secondary navigation - grouped */}
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-600">
            {isFeatureEnabled('ADVISOR') && (
              <FastLink
                href="/advisor"
                className={`flex h-14 items-center px-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
                  pathname === '/advisor' 
                    ? 'text-white bg-blue-500/20 rounded-lg' 
                    : 'text-blue-200 hover:text-white hover:bg-blue-500/10 rounded-lg'
                }`}
              >
                Advisor
              </FastLink>
            )}
            {isFeatureEnabled('ACTIONS') && (
              <FastLink
                href="/advisor/actions"
                className={`flex h-14 items-center px-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
                  pathname === '/advisor/actions' 
                    ? 'text-white bg-blue-500/20 rounded-lg' 
                    : 'text-blue-200 hover:text-white hover:bg-blue-500/10 rounded-lg'
                }`}
              >
                Actions
              </FastLink>
            )}
            <FastLink
              href="/pricing"
              className={`flex h-14 items-center px-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
                pathname === '/pricing' 
                  ? 'text-white bg-blue-500/20 rounded-lg' 
                  : 'text-blue-200 hover:text-white hover:bg-blue-500/10 rounded-lg'
              }`}
            >
              Pricing
            </FastLink>
            <FastLink
              href="/account"
              className={`flex h-14 items-center gap-1.5 px-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
                pathname === '/account' 
                  ? 'text-white bg-blue-500/20 rounded-lg' 
                  : 'text-blue-200 hover:text-white hover:bg-blue-500/10 rounded-lg'
              }`}
            >
              Account
              {isPro && (
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-teal-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  PRO
                </span>
              )}
            </FastLink>
            {mounted && isPro && (
              <FastLink
                href="/account/billing"
                className={`flex h-14 items-center px-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
                  pathname === '/account/billing' 
                    ? 'text-white bg-blue-500/20 rounded-lg' 
                    : 'text-blue-200 hover:text-white hover:bg-blue-500/10 rounded-lg'
                }`}
              >
                Billing
              </FastLink>
            )}
          </div>
        </div>
        
        {/* Right side - Wallet auth, Upgrade and Studio buttons */}
        <div className="flex items-center gap-3">
          {mounted && <HeaderConnectButton />}
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
          {/* Mobile hamburger */}
          <button
            type="button"
            className="sm:hidden inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-700 bg-slate-900/70 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 hover:bg-slate-800/70 transition-colors"
            aria-label="Open navigation menu"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
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

      {/* Mobile sheet / drawer */}
      {open && (
        <div className="fixed inset-0 z-[60] sm:hidden" aria-hidden={!open}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
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
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-700 bg-slate-800/70 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
              >
                <span aria-hidden>✕</span>
                <span className="sr-only">Close</span>
              </button>
            </div>
            <nav className="flex flex-col gap-3">
              {/* Primary navigation */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Main</div>
                <FastLink
                  href="/feed"
                  className={`rounded-md px-3 py-2 font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                    pathname === '/feed' 
                      ? 'text-white bg-blue-500/20' 
                      : 'text-slate-100 hover:bg-slate-800/70'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  Feed
                </FastLink>
                <FastLink
                  href="/studio"
                  className={`rounded-md px-3 py-2 font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                    pathname === '/studio' 
                      ? 'text-white bg-blue-500/20' 
                      : 'text-slate-100 hover:bg-slate-800/70'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  Studio
                </FastLink>
              </div>
              
              {/* Secondary navigation */}
              {/* Wallet Authentication */}
              <div className="space-y-2 mb-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Wallet</div>
                <div className="w-full">
                  <div className="w-full">
                    <HeaderConnectButton />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">More</div>
                {isFeatureEnabled('ADVISOR') && (
                  <FastLink
                    href="/advisor"
                    className={`rounded-md px-3 py-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                      pathname === '/advisor' 
                        ? 'text-white bg-blue-500/20' 
                        : 'text-slate-300 hover:bg-slate-800/70'
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    Advisor
                  </FastLink>
                )}
                {isFeatureEnabled('ACTIONS') && (
                  <FastLink
                    href="/advisor/actions"
                    className={`rounded-md px-3 py-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                      pathname === '/advisor/actions' 
                        ? 'text-white bg-blue-500/20' 
                        : 'text-slate-300 hover:bg-slate-800/70'
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    Actions
                  </FastLink>
                )}
                <FastLink
                  href="/pricing"
                  className={`rounded-md px-3 py-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                    pathname === '/pricing' 
                      ? 'text-white bg-blue-500/20' 
                      : 'text-slate-300 hover:bg-slate-800/70'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  Pricing
                </FastLink>
                <FastLink
                  href="/account"
                  className={`rounded-md px-3 py-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 flex items-center gap-2 ${
                    pathname === '/account' 
                      ? 'text-white bg-blue-500/20' 
                      : 'text-slate-300 hover:bg-slate-800/70'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  Account
                  {isPro && (
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-[#FF6B35] to-[#F7931E] px-1.5 py-0.5 text-[10px] font-medium text-white">
                      PRO
                    </span>
                  )}
                </FastLink>
                {mounted && isPro && (
                  <FastLink
                    href="/account/billing"
                    className={`rounded-md px-3 py-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                      pathname === '/account/billing' 
                        ? 'text-white bg-blue-500/20' 
                        : 'text-slate-300 hover:bg-slate-800/70'
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    Billing
                  </FastLink>
                )}
              </div>
              <Link
                href="/studio"
                className={`mt-2 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all hover:translate-y-[-1px] focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                  isInsightPage 
                    ? "bg-gradient-to-r from-blue-500 to-teal-600 text-white shadow-lg" 
                    : "border border-slate-600 bg-transparent text-slate-100/80 opacity-80 hover:opacity-100"
                }`}
                onClick={() => setOpen(false)}
                tabIndex={0}
              >
                Open Studio
              </Link>
            </nav>
          </div>
        </div>
      )}
    </nav>
  );
}
