/**
 * Telemetry for Signal Adapters
 * Tracks success rates, timeouts, and performance metrics per source
 */

interface TelemetryData {
  success_rate: number;
  timeout_rate: number;
  p95_ms: number;
  last_ok_ts: string | null;
  total_calls: number;
  success_calls: number;
  timeout_calls: number;
  response_times: number[];
}

class Telemetry {
  private data = new Map<string, TelemetryData>();

  start(source: string): { startTime: number } {
    return { startTime: Date.now() };
  }

  end(
    source: string, 
    result: { ok: boolean; timedOut: boolean; elapsedMs: number }
  ): void {
    if (!this.data.has(source)) {
      this.data.set(source, {
        success_rate: 0,
        timeout_rate: 0,
        p95_ms: 0,
        last_ok_ts: null,
        total_calls: 0,
        success_calls: 0,
        timeout_calls: 0,
        response_times: []
      });
    }

    const data = this.data.get(source)!;
    data.total_calls++;
    data.response_times.push(result.elapsedMs);

    if (result.timedOut) {
      data.timeout_calls++;
    } else if (result.ok) {
      data.success_calls++;
      data.last_ok_ts = new Date().toISOString();
    }

    // Calculate rates
    data.success_rate = data.total_calls > 0 ? data.success_calls / data.total_calls : 0;
    data.timeout_rate = data.total_calls > 0 ? data.timeout_calls / data.total_calls : 0;

    // Calculate P95
    if (data.response_times.length > 0) {
      const sorted = [...data.response_times].sort((a, b) => a - b);
      const p95Index = Math.ceil(sorted.length * 0.95) - 1;
      data.p95_ms = sorted[p95Index];
    }

    // Keep only last 100 response times for memory efficiency
    if (data.response_times.length > 100) {
      data.response_times = data.response_times.slice(-100);
    }
  }

  getMetrics(source: string): TelemetryData | null {
    return this.data.get(source) || null;
  }

  getAllMetrics(): Record<string, TelemetryData> {
    const result: Record<string, TelemetryData> = {};
    for (const [source, data] of this.data) {
      result[source] = { ...data };
    }
    return result;
  }

  clear(): void {
    this.data.clear();
  }
}

export const telemetry = new Telemetry();
