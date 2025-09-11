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
        // More specific for wallet overlays in top-right
        'div[style*="position: fixed"][style*="z-index: 9999"]',
        'div[style*="position: fixed"][style*="z-index: 10000"]'
      ];

      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const htmlElement = el as HTMLElement;
            
            // Check if element contains phantom-related content
            const innerHTML = htmlElement.innerHTML || '';
            const hasPhantomContent = innerHTML.toLowerCase().includes('phantom') ||
                                     htmlElement.querySelector('img[alt*="phantom" i]') ||
                                     htmlElement.querySelector('img[src*="phantom" i]');
            
            if (hasPhantomContent || selector.includes('phantom')) {
              htmlElement.style.display = 'none';
            }
          });
        } catch (error) {
          // Ignore errors for unsupported selectors
          console.debug('Selector not supported:', selector);
        }
      });

      // Additional check for elements in top-right corner that might be wallet overlays
      const allFixedElements = document.querySelectorAll('div[style*="position: fixed"]');
      allFixedElements.forEach(el => {
        const htmlElement = el as HTMLElement;
        const style = htmlElement.style;
        
        // Check if element is positioned in top-right corner
        if (style.position === 'fixed' && 
            (style.right || style.top) &&
            (style.zIndex && parseInt(style.zIndex) > 1000)) {
          
          // Check if it contains wallet-related content
          const content = htmlElement.innerHTML?.toLowerCase() || '';
          if (content.includes('phantom') || content.includes('wallet') || 
              htmlElement.querySelector('img')) {
            htmlElement.style.display = 'none';
          }
        }
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