'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Performance monitoring utilities for tracking page loads and API calls
 */

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  type: 'page-load' | 'api-call' | 'component-render';
  url?: string;
  status?: 'success' | 'error' | 'timeout';
  metadata?: Record<string, unknown>;
}

export interface PerformanceReport {
  totalMetrics: number;
  recentMetrics: number;
  slowOperations: number;
  averages: {
    pageLoad: number;
    apiCalls: number;
    componentRender: number;
  };
  webVitals: {
    lcp: number;
    fid: number;
    cls: number;
  };
}

interface PerformanceEventTimingEntry extends PerformanceEntry {
  processingStart: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface PerformanceTimer {
  end: (status?: PerformanceMetric['status'], url?: string) => number;
}

const PAGE_LOAD_METRIC_PREFIX = 'Page Load: ';

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100; // Keep last 100 metrics
  private readonly slowThreshold = 1000; // 1 second threshold for "slow"
  private readonly observers: PerformanceObserver[] = [];
  private clsValue = 0;
  private isDestroyed = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeWebVitals();
    }
  }

  private initializeWebVitals() {
    if (this.observers.length > 0) {
      return;
    }

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
        this.observers.push(lcpObserver);

        // First Input Delay
        const fidObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            const eventTimingEntry = entry as PerformanceEventTimingEntry;
            const fidValue =
              typeof eventTimingEntry.processingStart === 'number'
                ? eventTimingEntry.processingStart - entry.startTime
                : 0;

            this.recordMetric({
              name: 'FID',
              duration: fidValue,
              timestamp: Date.now(),
              type: 'page-load',
              metadata: { value: fidValue },
            });
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            const layoutShiftEntry = entry as LayoutShiftEntry;
            if (!layoutShiftEntry.hadRecentInput) {
              this.clsValue += layoutShiftEntry.value || 0;
            }
          }

          if (this.clsValue > 0) {
            this.recordMetric({
              name: 'CLS',
              duration: this.clsValue,
              timestamp: Date.now(),
              type: 'page-load',
              metadata: { value: this.clsValue },
            });
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('Performance monitoring setup failed:', error);
      }
    }
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.length = 0;
    this.isDestroyed = true;
  }

  recordMetric(metric: PerformanceMetric) {
    if (this.isDestroyed) {
      return;
    }

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.splice(0, this.metrics.length - this.maxMetrics);
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
  ): PerformanceTimer {
    const startTime = performance.now();
    let ended = false;

    return {
      end: (status: PerformanceMetric['status'] = 'success', url?: string) => {
        if (ended || this.isDestroyed) {
          return 0;
        }

        ended = true;
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
    const timer = this.startTimer(`${PAGE_LOAD_METRIC_PREFIX}${pageName}`, 'page-load');

    // Track when page is fully loaded or, for SPA transitions, on next paint frame.
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        window.requestAnimationFrame(() => {
          timer.end('success');
        });
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

  private getLatestByName(name: string) {
    for (let i = this.metrics.length - 1; i >= 0; i -= 1) {
      if (this.metrics[i].name === name) {
        return this.metrics[i].duration;
      }
    }
    return 0;
  }

  private getAverageDurationByType(type: PerformanceMetric['type']) {
    const metricsByType = this.getMetricsByType(type);
    if (metricsByType.length === 0) {
      return 0;
    }

    const total = metricsByType.reduce((sum, metric) => sum + metric.duration, 0);
    return total / metricsByType.length;
  }

  private getPageLoadAverage() {
    const pageLoadMetrics = this.metrics.filter(metric =>
      metric.name.startsWith(PAGE_LOAD_METRIC_PREFIX),
    );

    if (pageLoadMetrics.length === 0) {
      return 0;
    }

    const total = pageLoadMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / pageLoadMetrics.length;
  }

  getPerformanceReport(): PerformanceReport {
    const now = Date.now();
    const last5Minutes = this.metrics.filter(metric => now - metric.timestamp < 5 * 60 * 1000);

    const report: PerformanceReport = {
      totalMetrics: this.metrics.length,
      recentMetrics: last5Minutes.length,
      slowOperations: this.getSlowMetrics().length,
      averages: {
        pageLoad: this.getPageLoadAverage(),
        apiCalls: this.getAverageDurationByType('api-call'),
        componentRender: this.getAverageDurationByType('component-render'),
      },
      webVitals: {
        lcp: this.getLatestByName('LCP'),
        fid: this.getLatestByName('FID'),
        cls: this.getLatestByName('CLS'),
      },
    };

    return report;
  }

  clear() {
    this.metrics = [];
  }
}

declare global {
  interface Window {
    __prediktPerformanceMonitor?: PerformanceMonitor;
  }
}

function createPerformanceMonitor(): PerformanceMonitor {
  if (typeof window === 'undefined') {
    return new PerformanceMonitor();
  }

  if (!window.__prediktPerformanceMonitor) {
    const monitor = new PerformanceMonitor();
    window.__prediktPerformanceMonitor = monitor;
    window.addEventListener('beforeunload', () => monitor.destroy(), { once: true });
  }

  return window.__prediktPerformanceMonitor;
}

// Global instance
export const performanceMonitor = createPerformanceMonitor();

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
export function usePerformanceTracking(componentName: string, dependencies: unknown[] = []) {
  const timerRef = useRef<PerformanceTimer | null>(null);

  useEffect(() => {
    const timer = performanceMonitor.startTimer(`Render: ${componentName}`, 'component-render');
    timerRef.current = timer;

    const frameId = window.requestAnimationFrame(() => {
      timer.end('success');
      if (timerRef.current === timer) {
        timerRef.current = null;
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      timerRef.current?.end('timeout');
      timerRef.current = null;
    };
  }, [componentName, ...dependencies]);
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
