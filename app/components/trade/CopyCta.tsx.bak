/**
 * Copy CTA Component for A/B Testing
 * Renders different variants based on experiment bucket
 */

'use client';

import { useState } from 'react';

interface CopyCtaProps {
  modelIdHashed: string;
  variant: 'primary_above' | 'inline_below';
  onClick: () => void;
  className?: string;
}

export default function CopyCta({ modelIdHashed, variant, onClick, className = '' }: CopyCtaProps) {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    onClick();
    
    // Reset after a short delay for visual feedback
    setTimeout(() => setIsClicked(false), 200);
  };

  if (variant === 'primary_above') {
    return (
      <div className={`mb-4 ${className}`}>
        <button
          onClick={handleClick}
          disabled={isClicked}
          className={`
            w-full px-6 py-3 rounded-lg font-medium text-white
            transition-all duration-200 transform
            ${isClicked 
              ? 'bg-green-600 scale-95' 
              : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'
            }
            disabled:opacity-70 disabled:cursor-not-allowed
            shadow-lg hover:shadow-xl
          `}
          aria-label="Kopier denne modellen og sett opp trade"
        >
          {isClicked ? '✓ Kopiert!' : '📋 Kopier denne modellen og sett opp trade'}
        </button>
      </div>
    );
  }

  if (variant === 'inline_below') {
    return (
      <div className={`text-center ${className}`}>
        <button
          onClick={handleClick}
          disabled={isClicked}
          className={`
            inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
            transition-all duration-200
            ${isClicked
              ? 'text-green-600 bg-green-50'
              : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            }
            rounded-md border border-current
            disabled:opacity-70 disabled:cursor-not-allowed
          `}
          aria-label="Kopier oppsett"
        >
          {isClicked ? '✓' : '📋'} Kopier oppsett
        </button>
      </div>
    );
  }

  return null;
}
