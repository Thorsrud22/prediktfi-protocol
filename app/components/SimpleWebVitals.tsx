'use client';

import { useEffect } from 'react';

export default function SimpleWebVitals() {
  useEffect(() => {
    // Only run on client side and with full error protection
    if (typeof window === 'undefined') return;

    // Wrap everything in try-catch to prevent any errors
    try {
      console.log('[Performance] Web vitals component initialized');
      
      // Simple performance timing without external dependencies
      const startTime = Date.now();
      
      const handleLoad = () => {
        try {
          const loadTime = Date.now() - startTime;
          console.log(`[Performance] Load time: ${loadTime}ms`);
        } catch (e) {
          // Silent fail
        }
      };

      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad, { once: true });
      }
      
    } catch (error) {
      // Completely silent - never break the app
    }
  }, []);

  // Always return null - this component renders nothing
  return null;
}