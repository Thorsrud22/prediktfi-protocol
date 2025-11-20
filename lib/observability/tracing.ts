/**
 * OpenTelemetry Tracing & Observability
 */

import { trace, context, SpanStatusCode, SpanKind, Span } from '@opentelemetry/api';

export interface TraceContext {
  traceId: string;
  spanId: string;
  baggage?: Record<string, string>;
}

export interface SpanAttributes {
  [key: string]: string | number | boolean;
}

/**
 * Create and manage distributed traces
 */
export class TracingService {
  private tracer = trace.getTracer('prediktfi-protocol', '1.0.0');

  /**
   * Start a new span with automatic error handling
   */
  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: SpanAttributes,
    kind: SpanKind = SpanKind.INTERNAL
  ): Promise<T> {
    const span = this.tracer.startSpan(name, {
      kind,
      attributes: {
        'service.name': 'prediktfi-protocol',
        'service.version': '1.0.0',
        ...attributes
      }
    });

    const startTime = Date.now();

    try {
      const result = await context.with(trace.setSpan(context.active(), span), () => fn(span));

      span.setStatus({ code: SpanStatusCode.OK });
      span.setAttributes({
        'operation.success': true,
        'operation.duration_ms': Date.now() - startTime
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: errorMessage
      });
      span.setAttributes({
        'operation.success': false,
        'operation.error': errorMessage,
        'operation.duration_ms': Date.now() - startTime
      });

      throw error;

    } finally {
      span.end();
    }
  }

  /**
   * Trace API requests with automatic SLO recording
   */
  async traceAPIRequest<T>(
    method: string,
    endpoint: string,
    fn: () => Promise<T>,
    userId?: string
  ): Promise<T> {
    return this.withSpan(
      `${method} ${endpoint}`,
      async (span) => {
        const startTime = Date.now();

        try {
          const result = await fn();
          const duration = Date.now() - startTime;

          // Record SLO metrics
          const { sloMonitor } = await import('./slo');
          sloMonitor.recordLatency('api', duration);
          sloMonitor.recordRequest('api', false);

          span.setAttributes({
            'http.status_code': 200,
            'http.response_time_ms': duration
          });

          return result;

        } catch (error) {
          const duration = Date.now() - startTime;

          // Record error for SLO
          const { sloMonitor } = await import('./slo');
          sloMonitor.recordRequest('api', true);

          const statusCode = (error as { status?: number })?.status || 500;
          span.setAttributes({
            'http.status_code': statusCode,
            'http.response_time_ms': duration
          });

          throw error;
        }
      },
      {
        'http.method': method,
        'http.route': endpoint,
        'user.id': userId || 'anonymous'
      },
      SpanKind.SERVER
    );
  }

  /**
   * Trace resolver operations
   */
  async traceResolver<T>(
    resolverKind: string,
    insightId: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.withSpan(
      `resolver.${resolverKind.toLowerCase()}`,
      fn,
      {
        'resolver.kind': resolverKind,
        'resolver.insight_id': insightId,
        'resolver.source': 'primary'
      }
    );
  }

  /**
   * Trace external API calls
   */
  async traceExternalCall<T>(
    service: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.withSpan(
      `external.${service}.${operation}`,
      fn,
      {
        'external.service': service,
        'external.operation': operation
      },
      SpanKind.CLIENT
    );
  }

  /**
   * Trace database operations
   */
  async traceDatabase<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.withSpan(
      `db.${operation}`,
      fn,
      {
        'db.operation': operation,
        'db.table': table,
        'db.system': 'sqlite'
      }
    );
  }

  /**
   * Add baggage to current trace context
   */
  setBaggage(key: string, value: string): void {
    // Implementation would depend on OpenTelemetry setup
    console.log(`Setting baggage: ${key}=${value}`);
  }

  /**
   * Get current trace context
   */
  getCurrentTraceContext(): TraceContext | null {
    const activeSpan = trace.getActiveSpan();
    if (!activeSpan) return null;

    const spanContext = activeSpan.spanContext();
    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId
    };
  }
}

// Global tracing service
export const tracing = new TracingService();

/**
 * Middleware for automatic API tracing
 */
export function withTracing<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  name: string,
  attributes?: SpanAttributes
) {
  return async (...args: T): Promise<R> => {
    return tracing.withSpan(name, () => fn(...args), attributes);
  };
}

/**
 * Decorator for tracing class methods
 */
export function Trace(name?: string, attributes?: SpanAttributes) {
  return function (target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const traceName = name || `${(target as { constructor: { name: string } }).constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: unknown[]) {
      return tracing.withSpan(
        traceName,
        () => method.apply(this, args),
        attributes
      );
    };

    return descriptor;
  };
}
