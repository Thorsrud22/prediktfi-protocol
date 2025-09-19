import { Suspense, lazy } from 'react';

// Lazy load the heavy ActionsPage component
const ActionsPageComponent = lazy(() => import('./ActionsPageContent'));

// Loading component for better UX
function ActionsPageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-slate-700 rounded w-64 mb-4 animate-pulse"></div>
          <div className="h-4 bg-slate-700 rounded w-96 animate-pulse"></div>
        </div>
        
        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left panel skeleton */}
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="h-6 bg-slate-700 rounded w-48 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-700 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-700 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-slate-700 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="h-6 bg-slate-700 rounded w-32 mb-4 animate-pulse"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 bg-slate-700 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right panel skeleton */}
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="h-6 bg-slate-700 rounded w-40 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-32 bg-slate-700 rounded animate-pulse"></div>
                <div className="h-10 bg-slate-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function ActionsPage() {
  return (
    <Suspense fallback={<ActionsPageSkeleton />}>
      <ActionsPageComponent />
    </Suspense>
  );
}