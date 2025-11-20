'use client';

import React from 'react';

/**
 * Performance monitoring utilities for tracking page loads and API calls
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  type: 'page-load' | 'api-call' | 'component-render';
  url?: string;
  status?: 'success' | 'error' | 'timeout';
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100; // Keep last 100 metrics
  private readonly slowThreshold = 1000; // 1 second threshold for "slow"

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeWebVitals();
    }
  }

  private initializeWebVitals() {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: 'LCP',
              duration: entry.startTime,
              timestamp: Date.now(),
              type: 'page-load',
              metadata: { value: entry.startTime },
            });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: 'FID',
              duration: (entry as PerformanceEntry & { processingStart?: number }).processingStart ? ((entry as PerformanceEntry & { processingStart: number }).processingStart - entry.startTime) : 0,
              timestamp: Date.now(),
              type: 'page-load',
              metadata: { value: (entry as PerformanceEntry & { processingStart?: number }).processingStart ? ((entry as PerformanceEntry & { processingStart: number }).processingStart - entry.startTime) : 0 },
            });
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver(list => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
              clsValue += (entry as PerformanceEntry & { value?: number }).value || 0;
            }
          }
          if (clsValue > 0) {
            this.recordMetric({
              name: 'CLS',
              duration: clsValue,
              timestamp: Date.now(),
              type: 'page-load',
              metadata: { value: clsValue },
            });
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Performance monitoring setup failed:', error);
      }
    }
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && metric.duration > this.slowThreshold) {
      console.warn(`🐌 Slow ${metric.type}: ${metric.name} took ${metric.duration}ms`, metric);
    }
  }

  startTimer(
    name: string,
    type: PerformanceMetric['type'] = 'component-render',
    metadata?: Record<string, unknown>,
  ) {
    const startTime = performance.now();

    return {
      end: (status: PerformanceMetric['status'] = 'success', url?: string) => {
        const duration = performance.now() - startTime;
        this.recordMetric({
          name,
          duration,
          timestamp: Date.now(),
          type,
          status,
          url,
          metadata,
        });
        return duration;
      },
    };
  }

  trackApiCall<T>(
    url: string,
    fetchPromise: Promise<T>,
    metadata?: Record<string, unknown>,
  ): Promise<T> {
    const timer = this.startTimer(`API: ${url}`, 'api-call', metadata);

    return fetchPromise
      .then(result => {
        timer.end('success', url);
        return result;
      })
      .catch(error => {
        timer.end('error', url);
        throw error;
      });
  }

  trackPageLoad(pageName: string) {
    const timer = this.startTimer(`Page: ${pageName}`, 'page-load');

    // Track when page is fully loaded
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        timer.end('success');
      } else {
        window.addEventListener('load', () => timer.end('success'), { once: true });
      }
    }

    return timer;
  }

  getMetrics() {
    return [...this.metrics];
  }

  getSlowMetrics(threshold = this.slowThreshold) {
    return this.metrics.filter(metric => metric.duration > threshold);
  }

  getMetricsByType(type: PerformanceMetric['type']) {
    return this.metrics.filter(metric => metric.type === type);
  }

  getAverageByName(name: string) {
    const relevant = this.metrics.filter(metric => metric.name === name);
    if (relevant.length === 0) return 0;

    const total = relevant.reduce((sum, metric) => sum + metric.duration, 0);
    return total / relevant.length;
  }

  getPerformanceReport() {
    const now = Date.now();
    const last5Minutes = this.metrics.filter(metric => now - metric.timestamp < 5 * 60 * 1000);

    const report = {
      totalMetrics: this.metrics.length,
      recentMetrics: last5Minutes.length,
      slowOperations: this.getSlowMetrics().length,
      averages: {
        pageLoad: this.getAverageByName('Page Load'),
        apiCalls:
          this.getMetricsByType('api-call').reduce((sum, m) => sum + m.duration, 0) /
          Math.max(1, this.getMetricsByType('api-call').length),
        componentRender:
          this.getMetricsByType('component-render').reduce((sum, m) => sum + m.duration, 0) /
          Math.max(1, this.getMetricsByType('component-render').length),
      },
      webVitals: {
        lcp: this.getAverageByName('LCP'),
        fid: this.getAverageByName('FID'),
        cls: this.getAverageByName('CLS'),
      },
    };

    return report;
  }

  clear() {
    this.metrics = [];
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for easy use
export function trackPageLoad(pageName: string) {
  return performanceMonitor.trackPageLoad(pageName);
}

export function trackApiCall<T>(
  url: string,
  fetchPromise: Promise<T>,
  metadata?: Record<string, unknown>,
) {
  return performanceMonitor.trackApiCall(url, fetchPromise, metadata);
}

export function startTimer(
  name: string,
  type: PerformanceMetric['type'] = 'component-render',
  metadata?: Record<string, unknown>,
) {
  return performanceMonitor.startTimer(name, type, metadata);
}

export function getPerformanceReport() {
  return performanceMonitor.getPerformanceReport();
}

// React hook for component performance tracking
export function usePerformanceTracking(componentName: string, _dependencies: unknown[] = []) {
  if (typeof window !== 'undefined') {
    const timer = performanceMonitor.startTimer(`Render: ${componentName}`, 'component-render');

    // Track render time
    setTimeout(() => {
      timer.end('success');
    }, 0);
  }
}

// HOC for automatic performance tracking
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string,
): React.ComponentType<P> {
  const displayName =
    componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const TrackedComponent: React.FC<P> = (props: P) => {
    usePerformanceTracking(displayName);
    return React.createElement(WrappedComponent, props);
  };

  TrackedComponent.displayName = `withPerformanceTracking(${displayName})`;
  return TrackedComponent;
}
