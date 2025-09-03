"use client";

export function MarketCardSkeleton() {
  return (
    <div className="bg-[color:var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 animate-pulse">
      {/* Creator info skeleton */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-[color:var(--surface-2)] rounded-full"></div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-4 bg-[color:var(--surface-2)] rounded"></div>
          <div className="w-12 h-5 bg-[color:var(--surface-2)] rounded-full"></div>
        </div>
      </div>

      {/* Title skeleton */}
      <div className="space-y-2 mb-3">
        <div className="w-full h-5 bg-[color:var(--surface-2)] rounded"></div>
        <div className="w-3/4 h-5 bg-[color:var(--surface-2)] rounded"></div>
      </div>

      {/* Chips skeleton */}
      <div className="flex items-center gap-2">
        <div className="w-16 h-6 bg-[color:var(--surface-2)] rounded-full"></div>
        <div className="w-14 h-6 bg-[color:var(--surface-2)] rounded-full"></div>
        <div className="w-18 h-6 bg-[color:var(--surface-2)] rounded-full"></div>
      </div>
    </div>
  );
}
