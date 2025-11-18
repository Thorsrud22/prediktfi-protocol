'use client';

interface PageLoaderProps {
  pageName?: string;
  description?: string;
}

export default function PageLoader({
  pageName = 'Loading',
  description = 'Preparing your experience...'
}: PageLoaderProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-6">
        {/* Logo/Brand */}
        <div className="mb-8">
          <div className="text-4xl font-bold bg-gradient-to-r from-blue-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
            PrediktFi
          </div>
        </div>

        {/* Simple loading indicator */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Page name */}
        <h1 className="text-2xl font-semibold text-white">
          Loading {pageName}
        </h1>

        {/* Description */}
        <p className="text-blue-200/80 text-lg">
          {description}
        </p>

        {/* Simple progress dots */}
        <div className="flex justify-center space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}