"use client";

import { useEffect } from 'react';

export default function PhantomOverlayRemover() {
  useEffect(() => {
    const removePhantomOverlay = () => {
      // Common selectors for Phantom wallet overlays
      const selectors = [
        'div[id*="phantom"]',
        'div[data-phantom]',
        'iframe[src*="phantom"]',
        '.phantom-overlay',
        '.phantom-widget',
        'div[style*="position: fixed"][style*="right"][style*="top"]',
        // More specific for wallet overlays in top-right
        'div[style*="position: fixed"][style*="z-index: 9999"]',
        'div[style*="position: fixed"][style*="z-index: 10000"]'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // Check if element contains phantom-related content
          const hasPhantomContent = el.innerHTML?.toLowerCase().includes('phantom') ||
                                   el.querySelector('img[alt*="phantom" i]') ||
                                   el.querySelector('img[src*="phantom" i]');
          
          if (hasPhantomContent || selector.includes('phantom')) {
            (el as HTMLElement).style.display = 'none';
          }
        });
      });
    };

    // Run immediately
    removePhantomOverlay();

    // Run after a short delay (in case overlay is injected after initial load)
    const timeout = setTimeout(removePhantomOverlay, 1000);

    // Also run on DOM mutations (if overlay is dynamically added)
    const observer = new MutationObserver(() => {
      removePhantomOverlay();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
}
