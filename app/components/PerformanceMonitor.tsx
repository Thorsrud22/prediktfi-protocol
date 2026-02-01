'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  navigationStart: number;
  loadComplete: number;
}

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        setMetrics(prev => ({
          ...prev,
          navigationStart: navigation.startTime,
          loadComplete: navigation.loadEventEnd - navigation.startTime,
        }));
      }

      // Web Vitals using PerformanceObserver
      if ('PerformanceObserver' in window) {
        // First Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            setMetrics(prev => ({ ...prev, firstContentfulPaint: fcpEntry.startTime }));
          }
        }).observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          setMetrics(prev => ({ ...prev, largestContentfulPaint: lastEntry.startTime }));
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          setMetrics(prev => ({ ...prev, cumulativeLayoutShift: clsValue }));
        }).observe({ entryTypes: ['layout-shift'] });

        // First Input Delay
        new PerformanceObserver((list) => {
          const firstEntry = list.getEntries()[0];
          setMetrics(prev => ({ ...prev, firstInputDelay: (firstEntry as any).processingStart - firstEntry.startTime }));
        }).observe({ entryTypes: ['first-input'] });
      }
    };

    // Run after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  return metrics;
}

interface PerformanceMonitorProps {
  pageName?: string;
}

export default function PerformanceMonitor({ pageName = 'Unknown' }: PerformanceMonitorProps) {
  const metrics = usePerformanceMetrics();
  const [showDetails, setShowDetails] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  const getScoreColor = (value: number, thresholds: { good: number; needs: number }) => {
    if (value <= thresholds.good) return 'text-green-400';
    if (value <= thresholds.needs) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed bottom-20 left-4 sm:bottom-4 sm:right-16 z-50">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="bg-slate-800/90 backdrop-blur-sm border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-700/90 transition-colors"
      >
        ⚡ Performance
      </button>

      {showDetails && (
        <div className="absolute bottom-12 right-0 bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg p-4 min-w-80 text-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-600">
            <h3 className="font-semibold text-white">Performance Metrics</h3>
            <span className="text-slate-400">{pageName}</span>
          </div>

          <div className="space-y-2">
            {metrics.firstContentfulPaint && (
              <div className="flex justify-between">
                <span className="text-slate-300">First Contentful Paint:</span>
                <span className={getScoreColor(metrics.firstContentfulPaint, { good: 1800, needs: 3000 })}>
                  {Math.round(metrics.firstContentfulPaint)}ms
                </span>
              </div>
            )}

            {metrics.largestContentfulPaint && (
              <div className="flex justify-between">
                <span className="text-slate-300">Largest Contentful Paint:</span>
                <span className={getScoreColor(metrics.largestContentfulPaint, { good: 2500, needs: 4000 })}>
                  {Math.round(metrics.largestContentfulPaint)}ms
                </span>
              </div>
            )}

            {metrics.cumulativeLayoutShift !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-300">Cumulative Layout Shift:</span>
                <span className={getScoreColor(metrics.cumulativeLayoutShift * 1000, { good: 100, needs: 250 })}>
                  {metrics.cumulativeLayoutShift.toFixed(3)}
                </span>
              </div>
            )}

            {metrics.firstInputDelay && (
              <div className="flex justify-between">
                <span className="text-slate-300">First Input Delay:</span>
                <span className={getScoreColor(metrics.firstInputDelay, { good: 100, needs: 300 })}>
                  {Math.round(metrics.firstInputDelay)}ms
                </span>
              </div>
            )}

            {metrics.loadComplete && (
              <div className="flex justify-between">
                <span className="text-slate-300">Total Load Time:</span>
                <span className={getScoreColor(metrics.loadComplete, { good: 3000, needs: 5000 })}>
                  {Math.round(metrics.loadComplete)}ms
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-600 text-xs text-slate-400">
            <div className="flex space-x-4">
              <span>🟢 Good</span>
              <span>🟡 Needs Improvement</span>
              <span>🔴 Poor</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}