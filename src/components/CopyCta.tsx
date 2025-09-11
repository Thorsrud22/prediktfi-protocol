/**
 * Copy CTA Component with A/B Testing
 * 
 * Renders different CTA variants based on A/B test assignment
 */

'use client';

import { useState, useEffect } from 'react';
import { getCurrentCTAExperiment, CTAVariant } from '@/lib/ab/ctaBucket';
import { useToast } from '../../app/components/ToastProvider';

interface CopyCtaProps {
  insightId: string;
  onCopy?: (variant: CTAVariant) => void;
  className?: string;
}

interface ExperimentData {
  experimentKey: string;
  variant: CTAVariant;
} | null;

export default function CopyCta({ insightId, onCopy, className = '' }: CopyCtaProps) {
  const [experiment, setExperiment] = useState<ExperimentData>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    // Get experiment assignment
    const exp = getCurrentCTAExperiment();
    setExperiment(exp);
    setIsLoading(false);

    // Track view event
    if (exp) {
      trackEvent('cta_view', {
        experimentKey: exp.experimentKey,
        variant: exp.variant,
        insightId,
      });
    }
  }, [insightId]);

  const handleCopy = async (variant: CTAVariant) => {
    try {
      // Track copy click event
      trackEvent('model_copy_clicked', {
        experimentKey: experiment?.experimentKey,
        variant,
        insightId,
      });

      // Call parent handler
      onCopy?.(variant);

      // Copy to clipboard
      await navigator.clipboard.writeText(`Insight: ${insightId}`);
      
      // Show toast feedback
      addToast({
        title: "Copied. Open Actions to sign",
        description: "Insight copied to clipboard",
        variant: "success",
        duration: 4000,
        actionLabel: "Open Actions",
        onAction: () => {
          // Navigate to actions page
          window.open('/advisor/actions', '_blank');
        }
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded px-3 py-2 ${className}`}>
        <div className="h-4 w-20 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (!experiment) {
    // Fallback to variant A if experiment is not active
    return (
      <button
        onClick={() => handleCopy('A')}
        className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors ${className}`}
      >
        Kopier til trade
      </button>
    );
  }

  // Render based on variant
  if (experiment.variant === 'A') {
    return (
      <button
        onClick={() => handleCopy('A')}
        className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors ${className}`}
      >
        Kopier til trade
      </button>
    );
  } else {
    // Variant B: Inline copy button
    return (
      <button
        onClick={() => handleCopy('B')}
        className={`text-blue-600 hover:text-blue-800 underline text-sm ${className}`}
      >
        Kopier
      </button>
    );
  }
}

/**
 * Track analytics event
 */
function trackEvent(eventName: string, properties: Record<string, any>) {
  if (typeof window === 'undefined') return;

  // Send to analytics
  fetch('/api/analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event: eventName,
      properties,
      timestamp: new Date().toISOString(),
    }),
  }).catch(error => {
    console.error('Failed to track event:', error);
  });
}

/**
 * Track intent creation from copy
 */
export function trackIntentCreatedFromCopy(insightId: string, variant: CTAVariant) {
  trackEvent('intent_created_from_copy', {
    experimentKey: 'cta_copy_v1',
    variant,
    insightId,
  });
}

/**
 * Track intent execution from copy
 */
export function trackIntentExecutedFromCopy(insightId: string, variant: CTAVariant) {
  trackEvent('intent_executed_from_copy', {
    experimentKey: 'cta_copy_v1',
    variant,
    insightId,
  });
}
