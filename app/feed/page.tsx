import { Suspense, lazy } from 'react';

// Lazy load the heavy FeedPage component
const FeedPageComponent = lazy(() => import('./FeedPageContent'));

// Loading skeleton for feed page
function FeedPageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-10 bg-slate-700 rounded w-48 mb-4 animate-pulse"></div>
          <div className="h-5 bg-slate-700 rounded w-72 animate-pulse"></div>
        </div>

        {/* Filters skeleton */}
        <div className="flex gap-4 mb-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 bg-slate-700 rounded w-20 animate-pulse"></div>
          ))}
        </div>

        {/* Feed items skeleton */}
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-slate-800 rounded-lg p-6">
              {/* Item header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-slate-700 rounded animate-pulse"></div>
                <div className="h-5 bg-slate-700 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-slate-700 rounded w-32 animate-pulse"></div>
              </div>

              {/* Item content */}
              <div className="space-y-3">
                <div className="h-6 bg-slate-700 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-slate-700 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-700 rounded w-4/5 animate-pulse"></div>
              </div>

              {/* Item stats */}
              <div className="flex gap-6 mt-4">
                <div className="h-4 bg-slate-700 rounded w-16 animate-pulse"></div>
                <div className="h-4 bg-slate-700 rounded w-20 animate-pulse"></div>
                <div className="h-4 bg-slate-700 rounded w-18 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function FeedPage() {
  return (
    <Suspense fallback={<FeedPageSkeleton />}>
      <FeedPageComponent />
    </Suspense>
  );
}
