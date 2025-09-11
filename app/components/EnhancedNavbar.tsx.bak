"use client";

import Link from "next/link";
import { SITE } from "../config/site";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Button from "./ui/Button";
import ThemeToggle from "./ui/ThemeToggle";
import Badge from "./ui/Badge";

export default function EnhancedNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const pathname = usePathname();

  // Handle scroll state for navbar border
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mock wallet connection status - replace with actual wallet logic
  useEffect(() => {
    // Check if wallet is connected from localStorage or wallet provider
    const checkWallet = () => {
      // This would be replaced with actual wallet connection check
      setWalletConnected(localStorage.getItem('wallet-connected') === 'true');
    };
    checkWallet();
  }, []);

  const handleWalletConnect = () => {
    // This would be replaced with actual wallet connection logic
    if (walletConnected) {
      localStorage.setItem('wallet-connected', 'false');
      setWalletConnected(false);
    } else {
      localStorage.setItem('wallet-connected', 'true');
      setWalletConnected(true);
    }
  };

  const navigation = [
    { name: "Studio", href: "/studio" },
    { name: "Feed", href: "/feed" },
    { name: "Markets", href: "/markets" },
  ];

  return (
    <nav 
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled 
          ? 'bg-[color:var(--bg)]/95 backdrop-blur-md border-b border-[var(--border)]' 
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-3 hover:scale-105 transition-all duration-200"
          >
          {/* Logo Text */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-200 via-teal-200 to-cyan-200 bg-clip-text text-transparent leading-tight">
              Predikt
            </span>
          </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors duration-200 hover:text-[color:var(--text)] ${
                  pathname === item.href
                    ? 'text-[color:var(--text)]'
                    : 'text-[color:var(--muted)]'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <Badge variant="success" size="sm" className="hidden sm:flex">
              <span className="mr-1">●</span>
              Live
            </Badge>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Wallet connection */}
            <Button
              variant={walletConnected ? "secondary" : "primary"}
              size="sm"
              onClick={handleWalletConnect}
              className="relative"
            >
              {walletConnected ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Connected
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Connect Wallet
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
