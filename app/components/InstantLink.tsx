'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ComponentProps, useCallback } from 'react';

/**
 * InstantLink - Adds intent-based prefetch on top of Next.js Link.
 *
 * Next.js Link already handles viewport-based prefetching by default.
 * This component supplements that with prefetch on interaction intent
 * (hover, mousedown, touchstart) for snappier transitions.
 */
export function InstantLink({
  href,
  prefetch,
  children,
  onMouseEnter,
  onMouseDown,
  onTouchStart,
  ...props
}: ComponentProps<typeof Link>) {
  const router = useRouter();

  const prefetchOnIntent = useCallback(() => {
    // Respect explicit prefetch disabling by consumers.
    if (prefetch === false) return;

    // router.prefetch expects a string href.
    if (typeof href === 'string') {
      router.prefetch(href);
    }
  }, [href, prefetch, router]);

  return (
    <Link
      href={href}
      prefetch={prefetch}
      onMouseEnter={(event) => {
        prefetchOnIntent();
        onMouseEnter?.(event);
      }}
      onMouseDown={(event) => {
        prefetchOnIntent();
        onMouseDown?.(event);
      }}
      onTouchStart={(event) => {
        prefetchOnIntent();
        onTouchStart?.(event);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
