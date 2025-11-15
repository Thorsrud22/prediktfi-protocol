/**
 * Circuit Breaker Pattern for External Service Calls
 */

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  expectedErrors?: string[];
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

export class CircuitBreakerError extends Error {
  constructor(message: string, public readonly stats: CircuitBreakerStats) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Circuit Breaker implementation with configurable policies
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;
  
  constructor(
    private name: string,
    private config: CircuitBreakerConfig = {
      failureThreshold: 3,
      recoveryTimeout: 30000, // 30 seconds
      monitoringPeriod: 60000  // 1 minute
    }
  ) {}
  
  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        console.log(`Circuit breaker ${this.name}: Attempting reset (HALF_OPEN)`);
      } else {
        throw new CircuitBreakerError(
          `Circuit breaker ${this.name} is OPEN. Next attempt at ${this.nextAttemptTime?.toISOString()}`,
          this.getStats()
        );
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
      
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }
  
  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failures = 0;
    this.successes++;
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      console.log(`Circuit breaker ${this.name}: Reset to CLOSED state`);
    }
  }
  
  /**
   * Handle failed execution
   */
  private onFailure(error: unknown): void {
    this.failures++;
    this.lastFailureTime = new Date();
    
    // Check if this is an expected error that shouldn't count towards circuit breaking
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isExpectedError = this.config.expectedErrors?.some(expected => 
      errorMessage.includes(expected)
    );
    
    if (isExpectedError) {
      console.log(`Circuit breaker ${this.name}: Expected error, not counting towards threshold`);
      return;
    }
    
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout);
      
      console.log(`Circuit breaker ${this.name}: OPENED due to ${this.failures} failures. Recovery at ${this.nextAttemptTime.toISOString()}`);
      
      // Log to observability system
      this.logCircuitBreakerEvent('OPENED', {
        failures: this.failures,
        lastError: errorMessage
      });
    }
  }
  
  /**
   * Check if circuit should attempt reset
   */
  private shouldAttemptReset(): boolean {
    return this.nextAttemptTime ? new Date() >= this.nextAttemptTime : false;
  }
  
  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }
  
  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
    
    console.log(`Circuit breaker ${this.name}: Manually reset`);
  }
  
  /**
   * Log circuit breaker events for observability
   */
  private logCircuitBreakerEvent(event: string, metadata: Record<string, any>): void {
    // Integration with tracing system
    import('../observability/tracing').then(({ tracing }) => {
      tracing.withSpan(
        `circuit_breaker.${event.toLowerCase()}`,
        async () => {
          console.log(`Circuit breaker event: ${event}`, metadata);
        },
        {
          'circuit_breaker.name': this.name,
          'circuit_breaker.event': event,
          'circuit_breaker.failures': this.failures,
          'circuit_breaker.state': this.state
        }
      );
    });
  }
}

/**
 * Retry with exponential backoff
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export class RetryableError extends Error {
  constructor(message: string, public readonly attempt: number, public readonly maxAttempts: number) {
    super(message);
    this.name = 'RetryableError';
  }
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  }
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === config.maxAttempts) {
        throw new RetryableError(
          `Failed after ${config.maxAttempts} attempts: ${lastError.message}`,
          attempt,
          config.maxAttempts
        );
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      );
      
      console.log(`Retry attempt ${attempt}/${config.maxAttempts} failed: ${lastError.message}. Retrying in ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Global circuit breakers for common services
 */
export const circuitBreakers = {
  priceAPI: new CircuitBreaker('price-api', {
    failureThreshold: 3,
    recoveryTimeout: 30000,
    monitoringPeriod: 60000,
    expectedErrors: ['rate limit', 'quota exceeded']
  }),
  
  urlResolver: new CircuitBreaker('url-resolver', {
    failureThreshold: 5,
    recoveryTimeout: 15000,
    monitoringPeriod: 60000,
    expectedErrors: ['timeout', 'connection refused']
  }),
  
  database: new CircuitBreaker('database', {
    failureThreshold: 2,
    recoveryTimeout: 5000,
    monitoringPeriod: 30000
  })
};

/**
 * Decorator for automatic circuit breaker protection
 */
export function WithCircuitBreaker(breakerName: keyof typeof circuitBreakers) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const breaker = circuitBreakers[breakerName];
      return breaker.execute(() => method.apply(this, args));
    };
    
    return descriptor;
  };
}
