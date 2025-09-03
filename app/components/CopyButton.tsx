'use client';

import { useState } from 'react';

interface CopyButtonProps {
  label: string;
  value: string;
  onCopied?: () => void;
}

export function CopyButton({ label, value, onCopied }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const handleCopy = async () => {
    // Prevent double-firing on rapid clicks
    if (isClicking || copied) return;
    
    setIsClicking(true);
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied?.();
      
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    } finally {
      setIsClicking(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        disabled={isClicking || copied}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed"
        aria-label={`Kopier ${label}`}
      >
        {copied ? 'Kopiert!' : `Kopier ${label}`}
      </button>
      
      {/* Screen reader announcement */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {copied && `${label} kopiert til utklippstavle`}
      </div>
    </div>
  );
}
