'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ComponentProps, useEffect, useRef } from 'react';

/**
 * InstantLink - Like Xeris website's instant navigation
 * 
 * This component prefetches pages aggressively on hover/mousedown
 * for instant page transitions, similar to React Router's Link behavior
 */
export function InstantLink({ 
  href, 
  prefetch = true,
  children, 
  ...props 
}: ComponentProps<typeof Link>) {
  const router = useRouter();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const prefetchedRef = useRef(false);

  const handlePrefetch = () => {
    if (typeof href === 'string' && !prefetchedRef.current) {
      router.prefetch(href);
      prefetchedRef.current = true;
    }
  };

  useEffect(() => {
    if (!prefetch) return;

    const link = linkRef.current;
    if (!link) return;

    // Prefetch on hover with minimal delay
    const handleMouseEnter = () => {
      setTimeout(handlePrefetch, 50);
    };

    // Prefetch on mousedown for instant feel (before click)
    const handleMouseDown = () => {
      handlePrefetch();
    };

    // Prefetch on touch start for mobile
    const handleTouchStart = () => {
      handlePrefetch();
    };

    link.addEventListener('mouseenter', handleMouseEnter);
    link.addEventListener('mousedown', handleMouseDown);
    link.addEventListener('touchstart', handleTouchStart);

    return () => {
      link.removeEventListener('mouseenter', handleMouseEnter);
      link.removeEventListener('mousedown', handleMouseDown);
      link.removeEventListener('touchstart', handleTouchStart);
    };
  }, [href, prefetch, router]);

  return (
    <Link 
      ref={linkRef} 
      href={href} 
      prefetch={false} // We handle prefetch manually for better control
      {...props}
    >
      {children}
    </Link>
  );
}
