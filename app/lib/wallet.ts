import { NextRequest } from 'next/server';

/**
 * Get wallet identifier from request headers or cookies
 */
export function getWalletIdentifier(request: NextRequest): string | null {
  // Try headers first (set by middleware)
  const headerWalletId = request.headers.get('x-wallet-id');
  if (headerWalletId) {
    return headerWalletId;
  }

  // Try cookies
  const cookieWalletId = request.cookies.get('wallet_id')?.value;
  if (cookieWalletId) {
    return cookieWalletId;
  }

  // Try URL search params
  const url = new URL(request.url);
  const paramWalletId = url.searchParams.get('wallet');
  if (paramWalletId) {
    return paramWalletId;
  }

  return null;
}

/**
 * Get wallet identifier from client-side (browser)
 */
export function getWalletIdentifierClient(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Try to get from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const paramWalletId = urlParams.get('wallet');
  if (paramWalletId) {
    return paramWalletId;
  }

  // Try to get from localStorage
  const storedWalletId = localStorage.getItem('wallet_id');
  if (storedWalletId) {
    return storedWalletId;
  }

  return null;
}

/**
 * Set wallet identifier in client-side storage
 */
export function setWalletIdentifierClient(walletId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem('wallet_id', walletId);
}

/**
 * Clear wallet identifier from client-side storage
 */
export function clearWalletIdentifierClient(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('wallet_id');
}
