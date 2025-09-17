'use client';

import React, { useState, useEffect } from 'react';
import { getPerformanceReport, performanceMonitor } from '../../utils/performance';

interface PerformanceReportData {
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

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [report, setReport] = useState<PerformanceReportData | null>(null);
  const [updateKey, setUpdateKey] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const updateReport = () => {
      setReport(getPerformanceReport());
    };

    updateReport();
    const interval = setInterval(updateReport, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isVisible, updateKey]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    setUpdateKey(prev => prev + 1);
  };

  const clearMetrics = () => {
    performanceMonitor.clear();
    setReport(null);
    setUpdateKey(prev => prev + 1);
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.poor) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={toggleVisibility}
        className="mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
        title="Performance Monitor"
      >
        📊 Perf
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-sm text-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800">Performance Monitor</h3>
            <button
              onClick={clearMetrics}
              className="text-red-600 hover:text-red-800 text-xs"
              title="Clear metrics"
            >
              🗑️
            </button>
          </div>

          {report ? (
            <div className="space-y-3">
              {/* Overview */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Overview</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Total Metrics: {report.totalMetrics}</div>
                  <div>Recent (5m): {report.recentMetrics}</div>
                  <div className={report.slowOperations > 0 ? 'text-red-600' : 'text-green-600'}>
                    Slow Ops: {report.slowOperations}
                  </div>
                </div>
              </div>

              {/* Averages */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Average Times</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Page Load:</span>
                    <span
                      className={getPerformanceColor(report.averages.pageLoad, {
                        good: 1000,
                        poor: 3000,
                      })}
                    >
                      {formatTime(report.averages.pageLoad)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>API Calls:</span>
                    <span
                      className={getPerformanceColor(report.averages.apiCalls, {
                        good: 500,
                        poor: 1500,
                      })}
                    >
                      {formatTime(report.averages.apiCalls)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Renders:</span>
                    <span
                      className={getPerformanceColor(report.averages.componentRender, {
                        good: 16,
                        poor: 100,
                      })}
                    >
                      {formatTime(report.averages.componentRender)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Web Vitals */}
              {(report.webVitals.lcp > 0 ||
                report.webVitals.fid > 0 ||
                report.webVitals.cls > 0) && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Web Vitals</h4>
                  <div className="space-y-1">
                    {report.webVitals.lcp > 0 && (
                      <div className="flex justify-between">
                        <span>LCP:</span>
                        <span
                          className={getPerformanceColor(report.webVitals.lcp, {
                            good: 2500,
                            poor: 4000,
                          })}
                        >
                          {formatTime(report.webVitals.lcp)}
                        </span>
                      </div>
                    )}
                    {report.webVitals.fid > 0 && (
                      <div className="flex justify-between">
                        <span>FID:</span>
                        <span
                          className={getPerformanceColor(report.webVitals.fid, {
                            good: 100,
                            poor: 300,
                          })}
                        >
                          {formatTime(report.webVitals.fid)}
                        </span>
                      </div>
                    )}
                    {report.webVitals.cls > 0 && (
                      <div className="flex justify-between">
                        <span>CLS:</span>
                        <span
                          className={getPerformanceColor(report.webVitals.cls * 1000, {
                            good: 100,
                            poor: 250,
                          })}
                        >
                          {report.webVitals.cls.toFixed(3)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-3">Updates every 2s</div>
            </div>
          ) : (
            <div className="text-gray-600">No metrics collected yet</div>
          )}
        </div>
      )}
    </div>
  );
}
