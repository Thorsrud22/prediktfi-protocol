'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { cachedFetch } from '@/app/lib/request-cache';

// Only preload data for the NEXT likely page, not everything
const PAGE_PRELOADS: Record<string, string[]> = {
  '/': ['/api/feed?limit=5'], // Home -> likely go to feed
  '/studio': ['/api/studio/templates'], // Studio -> templates
  '/feed': [], // Feed already loads its own data
  '/advisor': [], // Advisor pages load on demand
};

export default function RoutePreloader() {
  const pathname = usePathname();
  const preloadedRef = useRef(new Set<string>());
  const preloadTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timer
    if (preloadTimerRef.current) {
      clearTimeout(preloadTimerRef.current);
    }

    // Preload critical routes in the background after page is interactive
    const preloadRoutes = async () => {
      // Wait for page to be fully interactive (3s delay)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Get routes to preload based on current page
      const routesToPreload = PAGE_PRELOADS[pathname] || [];
      
      // Only preload routes we haven't preloaded yet
      const newRoutes = routesToPreload.filter(route => !preloadedRef.current.has(route));
      
      if (newRoutes.length === 0) return;

      console.log('🚀 Preloading routes:', newRoutes);
      
      // Preload one at a time with delays
      for (const route of newRoutes) {
        try {
          // Use the cached fetch for better deduplication
          await cachedFetch(route, {
            headers: { 
              'X-Preload': 'true' // Mark as preload request
            }
          }, {
            staleTime: 120000, // 2 minute cache for preloaded data
            dedupe: true,
          });
          
          preloadedRef.current.add(route);
          console.log(`✅ Preloaded: ${route}`);
        } catch (error) {
          // Silently fail - preloading is optional
          console.debug(`Preload failed for ${route}`);
        }
        
        // Delay between preloads to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
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

  // Preload page chunks when hovering over navigation links
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
        
        // Don't start preloading immediately - wait 300ms
        if (!hoverTimers.has(path)) {
          const timer = setTimeout(() => {
            // Preload the page data if it's in our preload map
            const routes = PAGE_PRELOADS[path];
            if (routes && routes.length > 0) {
              routes.forEach(route => {
                if (!preloadedRef.current.has(route)) {
                  cachedFetch(route, {}, { staleTime: 120000, dedupe: true })
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
          }, 300);
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
  }, []);

  return null; // This component renders nothing
}

export { RoutePreloader };