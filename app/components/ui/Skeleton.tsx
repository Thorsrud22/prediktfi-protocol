'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function Skeleton({ className = '', children }: SkeletonProps) {
  return <div className={`animate-pulse bg-slate-600/30 rounded ${className}`}>{children}</div>;
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/10 ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />

      <div className="flex gap-2 mb-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Skeleton className="h-3 w-12 mb-1" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div>
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonActivityItem({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-start space-x-3 ${className}`}>
      <Skeleton className="w-6 h-6 rounded" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-48 mb-2" />
        <Skeleton className="h-3 w-32 mb-1" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function SkeletonCreatorItem({ className = '' }: { className?: string }) {
  return (
    <div className={`p-3 bg-white/5 rounded-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <div className="flex items-center space-x-3">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
