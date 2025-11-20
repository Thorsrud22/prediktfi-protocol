/**
 * Security Headers & CSP Configuration
 */

import { NextResponse } from 'next/server';

/**
 * Content Security Policy configuration
 */
export const CSP_POLICY = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Next.js in development
    "'unsafe-eval'",   // Required for Next.js in development
    'https://vercel.live'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components and CSS-in-JS
    'https://fonts.googleapis.com'
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https://*.dicebear.com',
    'https://api.dicebear.com',
    'https://vercel.com',
    'https://*.vercel.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  'connect-src': [
    "'self'",
    'https://api.coingecko.com',
    'https://api.coincap.io',
    'https://vercel.live',
    'wss://ws.coincap.io'
  ],
  'frame-src': [
    "'none'"
  ],
  'object-src': [
    "'none'"
  ],
  'base-uri': [
    "'self'"
  ],
  'form-action': [
    "'self'"
  ],
  'frame-ancestors': [
    "'none'"
  ],
  'upgrade-insecure-requests': []
};

/**
 * Generate CSP header value
 */
export function generateCSP(): string {
  return Object.entries(CSP_POLICY)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': generateCSP(),

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // X-Frame-Options (backup for frame-ancestors)
  'X-Frame-Options': 'DENY',

  // X-Content-Type-Options
  'X-Content-Type-Options': 'nosniff',

  // X-XSS-Protection
  'X-XSS-Protection': '1; mode=block',

  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()'
  ].join(', '),

  // Cross-Origin Policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Only apply HTTPS headers in production
  const isProduction = process.env.NODE_ENV === 'production';

  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    // Skip HTTPS-only headers in development
    if (!isProduction && key === 'Strict-Transport-Security') {
      return;
    }

    response.headers.set(key, value);
  });

  return response;
}

/**
 * Rate limiting and abuse detection
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export class RateLimiter {
  private requests = new Map<string, number[]>();

  constructor(private config: RateLimitConfig) { }

  /**
   * Check if request should be rate limited
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests for this identifier
    const userRequests = this.requests.get(identifier) || [];

    // Filter out old requests
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);

    // Update stored requests
    this.requests.set(identifier, recentRequests);

    // Check if limit exceeded
    return recentRequests.length >= this.config.maxRequests;
  }

  /**
   * Record a request
   */
  recordRequest(identifier: string): void {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    userRequests.push(now);
    this.requests.set(identifier, userRequests);
  }

  /**
   * Get remaining requests for identifier
   */
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);

    return Math.max(0, this.config.maxRequests - recentRequests.length);
  }

  /**
   * Clean up old request records
   */
  cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.config.windowMs * 2; // Keep some extra history

    this.requests.forEach((timestamps, identifier) => {
      const filtered = timestamps.filter(timestamp => timestamp > cutoff);
      if (filtered.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, filtered);
      }
    });
  }
}

/**
 * Global rate limiters
 */
export const rateLimiters = {
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  }),

  admin: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50
  }),

  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5
  })
};

/**
 * Abuse detection and logging
 */
export interface AbuseEvent {
  type: 'rate_limit' | 'invalid_auth' | 'suspicious_request';
  identifier: string;
  endpoint: string;
  timestamp: Date;
  details: Record<string, unknown>;
}

export class AbuseDetector {
  private events: AbuseEvent[] = [];

  /**
   * Log abuse event
   */
  logAbuseEvent(event: Omit<AbuseEvent, 'timestamp'>): void {
    const fullEvent: AbuseEvent = {
      ...event,
      timestamp: new Date()
    };

    this.events.push(fullEvent);

    // Log to console (in production, send to monitoring system)
    console.log(`🚨 Abuse detected: ${event.type} from ${event.identifier} on ${event.endpoint}`, event.details);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events.shift();
    }

    // Check for patterns
    this.detectAbusePatterns(event.identifier);
  }

  /**
   * Detect abuse patterns
   */
  private detectAbusePatterns(identifier: string): void {
    const recentEvents = this.events
      .filter(event => event.identifier === identifier)
      .filter(event => Date.now() - event.timestamp.getTime() < 60 * 60 * 1000); // Last hour

    if (recentEvents.length >= 10) {
      console.log(`🚨 High abuse activity detected from ${identifier}: ${recentEvents.length} events in last hour`);

      // In production, this could trigger automatic blocking or alerts
    }
  }

  /**
   * Get abuse statistics
   */
  getAbuseStats(): {
    totalEvents: number;
    recentEvents: number;
    topAbusers: Array<{ identifier: string; count: number }>;
  } {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentEvents = this.events.filter(event => event.timestamp.getTime() > oneHourAgo);

    // Count events by identifier
    const identifierCounts = new Map<string, number>();
    recentEvents.forEach(event => {
      identifierCounts.set(event.identifier, (identifierCounts.get(event.identifier) || 0) + 1);
    });

    // Get top abusers
    const topAbusers = Array.from(identifierCounts.entries())
      .map(([identifier, count]) => ({ identifier, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: this.events.length,
      recentEvents: recentEvents.length,
      topAbusers
    };
  }
}

// Global abuse detector
export const abuseDetector = new AbuseDetector();

// Cleanup interval for rate limiters
setInterval(() => {
  Object.values(rateLimiters).forEach(limiter => limiter.cleanup());
}, 5 * 60 * 1000); // Every 5 minutes
