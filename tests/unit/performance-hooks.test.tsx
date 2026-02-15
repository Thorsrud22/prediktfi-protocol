import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, renderHook, waitFor } from '@testing-library/react';

async function loadPerformanceModule() {
  return import('@/app/utils/performance');
}

describe('performance hooks', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete (window as Window & { __prediktPerformanceMonitor?: unknown }).__prediktPerformanceMonitor;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (window as Window & { __prediktPerformanceMonitor?: unknown }).__prediktPerformanceMonitor;
  });

  it('usePerformanceTracking records one component metric after mount and does not duplicate on unmount', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callback(16);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    const { performanceMonitor, usePerformanceTracking } = await loadPerformanceModule();
    performanceMonitor.clear();

    const { unmount } = renderHook(() => usePerformanceTracking('HookComponent'));

    await waitFor(() => {
      expect(performanceMonitor.getMetricsByType('component-render')).toHaveLength(1);
    });

    unmount();
    expect(performanceMonitor.getMetricsByType('component-render')).toHaveLength(1);
  });

  it('withPerformanceTracking renders wrapped component and records render metric', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callback(16);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    const { performanceMonitor, withPerformanceTracking } = await loadPerformanceModule();
    performanceMonitor.clear();

    function PlainComponent() {
      return <div>Tracked Body</div>;
    }

    const TrackedComponent = withPerformanceTracking(PlainComponent, 'TrackedComponent');
    const { getByText } = render(<TrackedComponent />);

    expect(getByText('Tracked Body')).toBeInTheDocument();
    await waitFor(() => {
      expect(performanceMonitor.getMetricsByType('component-render')).toHaveLength(1);
    });
  });
});
