import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type ObserverCallback = (
  list: { getEntries: () => unknown[] },
  observer: { disconnect: () => void },
) => void;

interface MockObserverInstance {
  callback: ObserverCallback;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  entryTypes: string[];
}

const observerInstances: MockObserverInstance[] = [];

class MockPerformanceObserver {
  callback: ObserverCallback;
  observe = vi.fn((options: { entryTypes?: string[] }) => {
    this.entryTypes = options.entryTypes || [];
  });
  disconnect = vi.fn();
  entryTypes: string[] = [];

  constructor(callback: ObserverCallback) {
    this.callback = callback;
    observerInstances.push(this as unknown as MockObserverInstance);
  }
}

function emitObserverEntries(entryType: string, entries: unknown[]) {
  const targetObserver = observerInstances.find(instance => instance.entryTypes.includes(entryType));
  expect(targetObserver).toBeTruthy();

  targetObserver!.callback(
    {
      getEntries: () => entries,
    },
    {
      disconnect: targetObserver!.disconnect,
    },
  );
}

async function loadPerformanceModule() {
  return import('@/app/utils/performance');
}

describe('performance monitor', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    observerInstances.length = 0;
    delete (window as Window & { __prediktPerformanceMonitor?: unknown }).__prediktPerformanceMonitor;
    vi.stubGlobal('PerformanceObserver', MockPerformanceObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (window as Window & { __prediktPerformanceMonitor?: unknown }).__prediktPerformanceMonitor;
  });

  it('uses trackPageLoad metric names in pageLoad report averages', async () => {
    const nowSpy = vi.spyOn(performance, 'now');
    nowSpy.mockReturnValueOnce(100).mockReturnValueOnce(250);

    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    rafSpy.mockImplementation(() => 1);

    const { performanceMonitor, trackPageLoad, getPerformanceReport } = await loadPerformanceModule();
    performanceMonitor.clear();

    const timer = trackPageLoad('Dashboard');
    timer.end('success');

    const report = getPerformanceReport();
    expect(report.averages.pageLoad).toBe(150);
  });

  it('records timer metrics only once even when end is called repeatedly', async () => {
    const { performanceMonitor, startTimer } = await loadPerformanceModule();
    performanceMonitor.clear();

    const timer = startTimer('idempotency-check', 'api-call');
    timer.end('success');
    timer.end('success');

    const metrics = performanceMonitor.getMetrics().filter(metric => metric.name === 'idempotency-check');
    expect(metrics).toHaveLength(1);
  });

  it('accumulates CLS across observer callback batches', async () => {
    const { performanceMonitor, getPerformanceReport } = await loadPerformanceModule();
    performanceMonitor.clear();

    emitObserverEntries('layout-shift', [{ value: 0.1, hadRecentInput: false }]);
    emitObserverEntries('layout-shift', [{ value: 0.2, hadRecentInput: false }]);

    const report = getPerformanceReport();
    expect(report.webVitals.cls).toBeCloseTo(0.3, 5);
  });

  it('trackApiCall preserves rejection and records error status', async () => {
    const { performanceMonitor, trackApiCall } = await loadPerformanceModule();
    performanceMonitor.clear();

    const expectedError = new Error('network down');
    await expect(trackApiCall('/api/test', Promise.reject(expectedError))).rejects.toThrow(
      'network down',
    );

    const apiMetrics = performanceMonitor
      .getMetrics()
      .filter(metric => metric.type === 'api-call' && metric.url === '/api/test');

    expect(apiMetrics).toHaveLength(1);
    expect(apiMetrics[0].status).toBe('error');
  });

  it('disconnects observers on destroy', async () => {
    const { performanceMonitor } = await loadPerformanceModule();
    performanceMonitor.destroy();

    expect(observerInstances.length).toBeGreaterThanOrEqual(3);
    observerInstances.forEach(instance => {
      expect(instance.disconnect).toHaveBeenCalledTimes(1);
    });
  });
});
