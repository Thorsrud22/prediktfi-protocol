"use client";

import Link from "next/link";
import { SITE } from "../config/site";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isMarketPage = pathname.startsWith('/market/');
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
    <nav className={`sticky top-0 z-50 bg-transparent backdrop-blur-md transition-colors ${
      scrolled ? 'border-b border-white/5' : 'border-b border-transparent'
    }`}>
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="logo-text"
          aria-label={SITE.name}
        >
          {SITE.name}
        </Link>
        {/* Desktop nav */}
        <div className="hidden items-center gap-6 sm:flex">
          <Link
            href="/markets"
            className="min-h-11 text-sm text-[color:var(--muted)] hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
          >
            Markets
          </Link>
          <a
            href="https://github.com/Thorsrud22/prediktfi-protocol#readme"
            className="min-h-11 text-sm text-[color:var(--muted)] hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
            target="_blank" rel="noreferrer noopener"
          >
            Docs
          </a>
          <a
            href="https://github.com/Thorsrud22/prediktfi-protocol"
            target="_blank"
            rel="noreferrer noopener"
            className="min-h-11 text-sm text-[color:var(--muted)] hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
            aria-label="Open GitHub in a new tab"
          >
            GitHub
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all hover:translate-y-[-1px] focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/60 ${
              isMarketPage 
                ? "bg-[color:var(--accent)] text-black shadow-token" 
                : "border border-[color:var(--border)] bg-transparent text-[color:var(--text)]/80 opacity-80 hover:opacity-100"
            }`}
          >
            Launch App
          </Link>
          {/* Mobile hamburger */}
          <button
            type="button"
            className="sm:hidden inline-flex h-11 w-11 items-center justify-center rounded-md border border-[var(--border)] bg-[color:var(--surface)]/70 text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/60"
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
            className="absolute right-0 top-0 h-full w-[78%] max-w-[320px] translate-x-0 rounded-l-[var(--radius)] border-l border-[var(--border)] bg-[color:var(--bg-soft)] p-5 shadow-[var(--shadow)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="font-semibold text-[color:var(--text)]">Menu</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[var(--border)] bg-[color:var(--surface)]/70 text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/60"
              >
                <span aria-hidden>✕</span>
                <span className="sr-only">Close</span>
              </button>
            </div>
            <nav className="flex flex-col gap-3">
              <Link
                href="/markets"
                className="rounded-md px-2 py-2 text-[color:var(--text)] hover:bg-[color:var(--surface)]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
                onClick={() => setOpen(false)}
                tabIndex={0}
              >
                Markets
              </Link>
              <a
                href="https://github.com/Thorsrud22/prediktfi-protocol#readme"
                className="rounded-md px-2 py-2 text-[color:var(--text)] hover:bg-[color:var(--surface)]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
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
                className="rounded-md px-2 py-2 text-[color:var(--text)] hover:bg-[color:var(--surface)]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
                tabIndex={0}
                onClick={() => setOpen(false)}
              >
                GitHub
              </a>
              <Link
                href="/"
                className={`mt-2 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all hover:translate-y-[-1px] focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/60 ${
                  isMarketPage 
                    ? "bg-[color:var(--accent)] text-black shadow-token" 
                    : "border border-[color:var(--border)] bg-transparent text-[color:var(--text)]/80 opacity-80 hover:opacity-100"
                }`}
                onClick={() => setOpen(false)}
                tabIndex={0}
              >
                Launch App
              </Link>
            </nav>
          </div>
        </div>
      )}
    </nav>
  );
}
