export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="bg-slate-800 rounded-2xl p-6 md:p-8 mb-8 animate-pulse">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Left side - Avatar and info */}
            <div className="flex items-center space-x-4 md:space-x-6">
              {/* Avatar skeleton */}
              <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-700 rounded-full"></div>
              
              {/* Creator info skeleton */}
              <div>
                <div className="h-8 bg-slate-700 rounded w-32 mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-24 mb-2"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-slate-700 rounded w-16"></div>
                  <div className="h-6 bg-slate-700 rounded w-20"></div>
                </div>
              </div>
            </div>
            
            {/* Right side - Score and actions */}
            <div className="text-center md:text-right">
              <div className="h-12 bg-slate-700 rounded w-24 mb-2 mx-auto md:mx-0"></div>
              <div className="h-4 bg-slate-700 rounded w-16 mb-1 mx-auto md:mx-0"></div>
              <div className="h-4 bg-slate-700 rounded w-28 mb-4 mx-auto md:mx-0"></div>
              
              {/* Action buttons skeleton */}
              <div className="flex gap-2 justify-center md:justify-end">
                <div className="h-10 bg-slate-700 rounded w-28"></div>
                <div className="h-10 bg-slate-700 rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4 md:p-6 animate-pulse">
              <div className="h-8 bg-slate-700 rounded w-16 mb-2"></div>
              <div className="h-4 bg-slate-700 rounded w-20"></div>
            </div>
          ))}
        </div>

        {/* Score History Skeleton */}
        <div className="bg-slate-800 rounded-xl p-4 md:p-6 mb-8 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-slate-700 rounded w-32"></div>
            <div className="h-8 bg-slate-700 rounded w-24"></div>
          </div>
          <div className="h-16 bg-slate-700 rounded mb-3"></div>
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-700 rounded w-20"></div>
            <div className="h-4 bg-slate-700 rounded w-24"></div>
          </div>
        </div>

        {/* Recent Insights Skeleton */}
        <div className="bg-slate-800 rounded-2xl p-6 animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-slate-700 rounded w-36"></div>
            <div className="h-4 bg-slate-700 rounded w-16"></div>
          </div>
          
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-slate-700 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="h-5 bg-slate-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 bg-slate-700 rounded w-16"></div>
                    <div className="h-6 bg-slate-700 rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
