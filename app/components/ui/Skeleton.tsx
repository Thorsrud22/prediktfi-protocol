'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
  children?: React.ReactNode;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  children
}: SkeletonProps) {

  const baseClasses = "relative overflow-hidden bg-slate-800/50 animate-pulse";

  const variantClasses = {
    rectangular: "rounded-lg",
    circular: "rounded-full",
    text: "rounded-md"
  };

  const style = {
    width: width,
    height: height,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    >
      {/* Optional: Shimmer effect overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
      {children}
    </div>
  );
}

// Support default export for legacy imports if any
export default Skeleton;

export function SkeletonText({ lines = 1, className = '', ...props }: SkeletonProps & { lines?: number }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height="1em"
          width={i === lines - 1 && lines > 1 ? '70%' : '100%'}
          {...props}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/10 ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <Skeleton variant="circular" width={32} height={32} />
        <div className="flex-1">
          <Skeleton height={16} width={96} className="mb-2" />
          <Skeleton height={12} width={64} />
        </div>
        <Skeleton height={24} width={64} className="rounded-full" />
      </div>

      <Skeleton height={16} width="75%" className="mb-2" />
      <Skeleton height={16} width="50%" className="mb-4" />

      <div className="flex gap-2 mb-4">
        <Skeleton height={24} width={80} className="rounded-full" />
        <Skeleton height={24} width={64} className="rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Skeleton height={12} width={48} className="mb-1" />
          <Skeleton height={16} width={64} />
        </div>
        <div>
          <Skeleton height={12} width={64} className="mb-1" />
          <Skeleton height={16} width={80} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonActivityItem({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-start space-x-3 ${className}`}>
      <Skeleton variant="rectangular" width={24} height={24} className="rounded" />
      <div className="flex-1 min-w-0">
        <Skeleton height={16} width={192} className="mb-2" />
        <Skeleton height={12} width={128} className="mb-1" />
        <Skeleton height={12} width={80} />
      </div>
    </div>
  );
}

export function SkeletonCreatorItem({ className = '' }: { className?: string }) {
  return (
    <div className={`p-3 bg-white/5 rounded-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton variant="circular" width={32} height={32} />
          <div>
            <Skeleton height={16} width={96} className="mb-2" />
            <div className="flex items-center space-x-3">
              <Skeleton height={12} width={48} />
              <Skeleton height={12} width={48} />
              <Skeleton height={12} width={48} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
