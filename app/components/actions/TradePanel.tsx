/**
 * Lazy-loaded Trade Panel component for better performance
 */

import { Suspense, lazy } from 'react';

// Lazy load the heavy TradePanel component
const TradePanelComponent = lazy(() => import('./TradePanelContent'));

interface TradePanelProps {
  walletId: string;
  templateData?: any;
  onClose: () => void;
  onIntentCreated?: (intentId: string) => void;
}

// Loading skeleton for TradePanel
function TradePanelSkeleton() {
  return (
    <div className="bg-slate-800 rounded-lg p-6 max-w-2xl mx-auto">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-slate-700 rounded w-32 animate-pulse"></div>
        <div className="w-6 h-6 bg-slate-700 rounded animate-pulse"></div>
      </div>
      
      {/* Form sections skeleton */}
      <div className="space-y-6">
        {/* Asset selection skeleton */}
        <div>
          <div className="h-4 bg-slate-700 rounded w-24 mb-3 animate-pulse"></div>
          <div className="h-12 bg-slate-700 rounded animate-pulse"></div>
        </div>
        
        {/* Direction skeleton */}
        <div>
          <div className="h-4 bg-slate-700 rounded w-20 mb-3 animate-pulse"></div>
          <div className="flex gap-3">
            <div className="h-12 bg-slate-700 rounded flex-1 animate-pulse"></div>
            <div className="h-12 bg-slate-700 rounded flex-1 animate-pulse"></div>
          </div>
        </div>
        
        {/* Probability skeleton */}
        <div>
          <div className="h-4 bg-slate-700 rounded w-28 mb-3 animate-pulse"></div>
          <div className="h-12 bg-slate-700 rounded animate-pulse"></div>
        </div>
        
        {/* Confidence skeleton */}
        <div>
          <div className="h-4 bg-slate-700 rounded w-24 mb-3 animate-pulse"></div>
          <div className="h-12 bg-slate-700 rounded animate-pulse"></div>
        </div>
        
        {/* Thesis skeleton */}
        <div>
          <div className="h-4 bg-slate-700 rounded w-32 mb-3 animate-pulse"></div>
          <div className="h-24 bg-slate-700 rounded animate-pulse"></div>
        </div>
        
        {/* Actions skeleton */}
        <div className="flex gap-3 pt-4">
          <div className="h-12 bg-slate-700 rounded flex-1 animate-pulse"></div>
          <div className="h-12 bg-slate-700 rounded flex-1 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

// Main TradePanel component with Suspense
export default function TradePanel(props: TradePanelProps) {
  return (
    <Suspense fallback={<TradePanelSkeleton />}>
      <TradePanelComponent 
        {...props} 
        onIntentCreated={props.onIntentCreated || (() => {})} 
      />
    </Suspense>
  );
}