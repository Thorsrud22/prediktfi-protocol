'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cachedFetch } from '@/app/lib/request-cache';

// Aggressive preloading - preload ALL likely pages
const PAGE_PRELOADS: Record<string, string[]> = {
  '/': ['/api/feed?limit=10'], // Home -> likely go to feed
  '/studio': ['/api/studio/templates', '/api/profile'], // Studio -> templates
  '/feed': ['/api/insights/trending'], // Feed -> trending insights
  '/advisor': ['/api/advisor/history'], // Advisor pages load history
  '/leaderboard': ['/api/leaderboard?limit=20'], // Leaderboard -> top 20
};

export default function RoutePreloader() {
  const pathname = usePathname();
  const router = useRouter();
  const preloadedRef = useRef(new Set<string>());
  const preloadedPagesRef = useRef(new Set<string>());
  const preloadTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timer
    if (preloadTimerRef.current) {
      clearTimeout(preloadTimerRef.current);
    }

    // Preload critical routes in the background IMMEDIATELY
    const preloadRoutes = async () => {
      // Reduced wait time - start preloading after only 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get routes to preload based on current page
      const routesToPreload = PAGE_PRELOADS[pathname] || [];
      
      // Only preload routes we haven't preloaded yet
      const newRoutes = routesToPreload.filter(route => !preloadedRef.current.has(route));
      
      if (newRoutes.length === 0) return;

      console.log('🚀 Aggressively preloading routes:', newRoutes);
      
      // Preload ALL routes in parallel for maximum speed
      const preloadPromises = newRoutes.map(async route => {
        try {
          // Use the cached fetch for better deduplication
          await cachedFetch(route, {
            headers: { 
              'X-Preload': 'true' // Mark as preload request
            }
          }, {
            staleTime: 300000, // 5 minute cache for preloaded data
            dedupe: true,
          });
          
          preloadedRef.current.add(route);
          console.log(`✅ Preloaded: ${route}`);
        } catch (error) {
          // Silently fail - preloading is optional
          console.debug(`Preload failed for ${route}`);
        }
      });

      // Wait for all preloads to complete
      await Promise.all(preloadPromises);
    };

    preloadTimerRef.current = setTimeout(() => {
      preloadRoutes();
    }, 0);

    return () => {
      if (preloadTimerRef.current) {
        clearTimeout(preloadTimerRef.current);
      }
    };
  }, [pathname]);

  // Aggressive prefetching: Preload pages INSTANTLY on hover
  useEffect(() => {
    const hoverTimers = new Map<string, NodeJS.Timeout>();

    const handleMouseEnter = (event: MouseEvent) => {
      const target = event.target;
      let link: HTMLAnchorElement | null = null;

      if (target instanceof HTMLElement) {
        link = target.closest('a[href]') as HTMLAnchorElement | null;
      }

      if (link && link.href.startsWith(window.location.origin)) {
        const path = new URL(link.href).pathname;
        
        // Instant prefetch - NO delay! Like Xeris
        if (!hoverTimers.has(path) && !preloadedPagesRef.current.has(path)) {
          const timer = setTimeout(() => {
            // Prefetch the Next.js page chunk immediately
            router.prefetch(path);
            preloadedPagesRef.current.add(path);
            
            // Preload the page data if it's in our preload map
            const routes = PAGE_PRELOADS[path];
            if (routes && routes.length > 0) {
              routes.forEach(route => {
                if (!preloadedRef.current.has(route)) {
                  cachedFetch(route, {}, { staleTime: 300000, dedupe: true })
                    .then(() => {
                      preloadedRef.current.add(route);
                    })
                    .catch(() => {
                      // Ignore preload errors
                    });
                }
              });
            }
            hoverTimers.delete(path);
          }, 50); // Minimal 50ms delay - instant feel!
          hoverTimers.set(path, timer);
        }
      }
    };

    const handleMouseLeave = (event: MouseEvent) => {
      const target = event.target;
      let link: HTMLAnchorElement | null = null;

      if (target instanceof HTMLElement) {
        link = target.closest('a[href]') as HTMLAnchorElement | null;
      }

      if (link && link.href.startsWith(window.location.origin)) {
        const path = new URL(link.href).pathname;
        const timer = hoverTimers.get(path);
        if (timer) {
          clearTimeout(timer);
          hoverTimers.delete(path);
        }
      }
    };

    // Add hover listeners to navigation links
    document.addEventListener('mouseenter', handleMouseEnter, { capture: true });
    document.addEventListener('mouseleave', handleMouseLeave, { capture: true });
    
    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, { capture: true });
      document.removeEventListener('mouseleave', handleMouseLeave, { capture: true });
      // Clear all pending timers
      hoverTimers.forEach(timer => clearTimeout(timer));
    };
  }, [router]);

  // Prefetch critical pages on mount (similar to SPA behavior)
  useEffect(() => {
    const criticalPages = ['/feed', '/studio', '/advisor', '/leaderboard'];
    
    // Prefetch critical pages after 2 seconds
    const prefetchTimer = setTimeout(() => {
      criticalPages.forEach(page => {
        if (!preloadedPagesRef.current.has(page)) {
          router.prefetch(page);
          preloadedPagesRef.current.add(page);
        }
      });
      console.log('✅ Prefetched critical pages:', criticalPages);
    }, 2000);

    return () => clearTimeout(prefetchTimer);
  }, [router]);

  return null; // This component renders nothing
}

export { RoutePreloader };