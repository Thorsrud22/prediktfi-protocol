"use client";

import Link from "next/link";
import FastLink from "./FastLink";
import { SITE } from "../config/site";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useIsPro } from "../lib/use-plan";
import { isFeatureEnabled } from "../lib/flags";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isInsightPage = pathname.startsWith('/i/');
  const isPro = useIsPro();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<Element | null>(null);

  // Handle scroll state for navbar border
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
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
    <nav className={`sticky top-0 z-50 bg-[#0B1426]/90 backdrop-blur-md transition-all ${
      scrolled ? 'border-b border-blue-800/40' : 'border-b border-transparent'
    }`}>
      <div className="mx-auto max-w-7xl px-4 flex h-14 items-center justify-between">
        <Link
          href="/"
          className="flex items-center hover:opacity-90 transition-all duration-200 hover:scale-105"
          aria-label={SITE.name}
        >
          {/* Logo Text */}
          <div className="flex flex-col items-start">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-200 via-purple-200 to-indigo-200 bg-clip-text text-transparent">
              Predikt
            </span>
            <span className="text-xs text-blue-300/70 font-medium tracking-wider uppercase -ml-px">
              AI STUDIO
            </span>
          </div>
        </Link>
        {/* Desktop nav */}
        <div className="hidden items-center gap-4 sm:flex">
          <FastLink
            href="/studio"
            className="flex h-14 items-center px-3 text-sm font-semibold text-blue-100 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 transition-colors"
          >
            Studio
          </FastLink>
          {isFeatureEnabled('ADVISOR') && (
            <FastLink
              href="/advisor"
              className="flex h-14 items-center px-3 text-sm font-semibold text-blue-100 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 transition-colors"
            >
              Advisor
            </FastLink>
          )}
          <FastLink
            href="/feed"
            className="flex h-14 items-center px-3 text-sm font-medium text-blue-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 transition-colors"
          >
            Feed
          </FastLink>
          <FastLink
            href="/pricing"
            className="flex h-14 items-center px-3 text-sm font-medium text-blue-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 transition-colors"
          >
            Pricing
          </FastLink>
          <FastLink
            href="/account"
            className="flex h-14 items-center gap-1.5 px-3 text-sm font-medium text-blue-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 transition-colors"
          >
            Account
            {isPro && (
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                PRO
              </span>
            )}
          </FastLink>
          <a
            href="https://github.com/Thorsrud22/prediktfi-protocol#readme"
            className="flex h-14 items-center px-3 text-sm font-medium text-blue-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 transition-colors"
            target="_blank" 
            rel="noreferrer noopener"
          >
            Docs
          </a>
          <a
            href="https://github.com/Thorsrud22/prediktfi-protocol"
            target="_blank"
            rel="noreferrer noopener"
            className="flex h-14 items-center px-3 text-sm font-medium text-blue-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 transition-colors"
            aria-label="Open GitHub in a new tab"
          >
            GitHub
          </a>
        </div>
        
        {/* Right side - Upgrade and Studio buttons */}
        <div className="flex items-center gap-3">
          {!isPro && (
            <Link
              href="/pricing"
              className="hidden sm:inline-flex h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-all focus-visible:ring-2 focus-visible:ring-emerald-400/50"
            >
              Upgrade
            </Link>
          )}
          <Link
            href="/studio"
            className={`inline-flex h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
              isInsightPage 
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl" 
                : "border border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800"
            }`}
          >
            <span className="hidden sm:inline">Open Studio</span>
            <span className="sm:hidden">Studio</span>
          </Link>
          {/* Mobile hamburger */}
          <button
            type="button"
            className="sm:hidden inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-700 bg-slate-900/70 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            aria-label="Open navigation menu"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <span
              aria-hidden
              className="block h-0.5 w-5 bg-current shadow-[0_6px_currentColor,0_-6px_currentColor]"
            />
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
              <FastLink
                href="/studio"
                className="rounded-md px-2 py-2 font-semibold text-slate-100 hover:bg-slate-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-colors"
                onClick={() => setOpen(false)}
              >
                Studio
              </FastLink>
              {isFeatureEnabled('ADVISOR') && (
                <FastLink
                  href="/advisor"
                  className="rounded-md px-2 py-2 font-semibold text-slate-100 hover:bg-slate-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  Advisor
                </FastLink>
              )}
              <FastLink
                href="/feed"
                className="rounded-md px-2 py-2 font-medium text-slate-300 hover:bg-slate-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-colors"
                onClick={() => setOpen(false)}
              >
                Feed
              </FastLink>
              <FastLink
                href="/pricing"
                className="rounded-md px-2 py-2 font-medium text-slate-300 hover:bg-slate-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-colors"
                onClick={() => setOpen(false)}
              >
                Pricing
              </FastLink>
              <FastLink
                href="/account"
                className="rounded-md px-2 py-2 font-medium text-slate-300 hover:bg-slate-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-colors flex items-center gap-2"
                onClick={() => setOpen(false)}
              >
                Account
                {isPro && (
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-[#FF6B35] to-[#F7931E] px-1.5 py-0.5 text-[10px] font-medium text-white">
                    PRO
                  </span>
                )}
              </FastLink>
              <a
                href="https://github.com/Thorsrud22/prediktfi-protocol#readme"
                className="rounded-md px-2 py-2 text-slate-300 hover:bg-slate-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                onClick={() => setOpen(false)}
                tabIndex={0}
                target="_blank" rel="noreferrer noopener"
              >
                Docs
              </a>
              <a
                href="https://github.com/Thorsrud22/prediktfi-protocol"
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-md px-2 py-2 text-slate-300 hover:bg-slate-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                tabIndex={0}
                onClick={() => setOpen(false)}
              >
                GitHub
              </a>
              <Link
                href="/studio"
                className={`mt-2 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all hover:translate-y-[-1px] focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                  isInsightPage 
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg" 
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
