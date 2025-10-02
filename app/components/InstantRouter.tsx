'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

// Preload and cache page content
const pageCache = new Map<string, any>();
const preloadPromises = new Map<string, Promise<any>>();

const CRITICAL_ROUTES = ['/studio', '/advisor', '/advisor/actions', '/feed'];

async function preloadRoute(route: string) {
  try {
    console.log(`🚀 Preloading route: ${route}`);
    
    // Use Next.js 15 compatible prefetching
    // Just mark as preloaded for now - the actual prefetch happens via Link hover
    pageCache.set(route, true);
    console.log(`✅ Route marked for prefetch: ${route}`);
    
    return true;
  } catch (error) {
    console.warn(`❌ Failed to preload ${route}:`, error);
    return false;
  }
}



export function useInstantRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Preload critical routes immediately on page load
  useEffect(() => {
    const preloadCriticalRoutes = async () => {
      const routesToPreload = CRITICAL_ROUTES.filter(route => route !== pathname);
      console.log(`🚀 Preloading routes:`, routesToPreload);
      
      // Wait a bit for initial page to settle
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      for (const route of routesToPreload) {
        if (!preloadPromises.has(route)) {
          const promise = preloadRoute(route);
          preloadPromises.set(route, promise);
        }
      }
    };

    preloadCriticalRoutes();
  }, [pathname]);

  // Instant navigation function
  const instantNavigate = useCallback((href: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
    }

    console.log(`🔄 Instant navigating to: ${href}`);
    setIsTransitioning(true);
    
    // Navigate immediately
    router.push(href);
    
    // Reset transition state quickly
    setTimeout(() => {
      setIsTransitioning(false);
    }, 150);
  }, [router]);

  // Preload on hover
  const preloadOnHover = useCallback((href: string) => {
    if (!preloadPromises.has(href) && !pageCache.has(href)) {
      console.log(`👆 Hover preload triggered: ${href}`);
      const promise = preloadRoute(href);
      preloadPromises.set(href, promise);
    }
  }, []);

  return { 
    instantNavigate, 
    preloadOnHover, 
    isTransitioning 
  };
}

export default function InstantRouter() {
  return null;
}