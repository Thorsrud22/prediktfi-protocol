/**
 * Analytics Events API
 * POST /api/analytics/events
 * 
 * Handles view→copy→sign funnel tracking with debouncing and idempotency
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { 
  validateAnalyticsEvent,
  storeAnalyticsEvent,
  getSessionDebounceStatus,
  ANALYTICS_EVENT_TYPES
} from '../../../../src/server/analytics/events';

// Rate limiting: max 60 events per minute per session
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(sessionId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const limit = rateLimitMap.get(sessionId);
  
  if (!limit || now > limit.resetTime) {
    // Reset or create new limit
    rateLimitMap.set(sessionId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }
  
  if (limit.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((limit.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  limit.count++;
  return { allowed: true };
}

function getSessionId(request: NextRequest): string {
  // Try to get session ID from cookie
  const sessionCookie = request.cookies.get('analytics-session');
  if (sessionCookie?.value) {
    return sessionCookie.value;
  }
  
  // Generate new session ID
  const sessionId = crypto.randomUUID();
  return sessionId;
}

export async function POST(request: NextRequest) {
  try {
    // Get session ID
    const sessionId = getSessionId(request);
    
    // Check rate limiting
    const rateLimit = checkRateLimit(sessionId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimit.retryAfter?.toString() || '60'
          }
        }
      );
    }
    
    // Parse and validate event payload
    const body = await request.json();
    const validation = validateAnalyticsEvent(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    const event = validation.event!;
    
    // Check debouncing for view events
    if (event.type === ANALYTICS_EVENT_TYPES.MODEL_METRICS_VIEW || 
        event.type === ANALYTICS_EVENT_TYPES.LEAGUE_VIEW) {
      
      const modelId = 'modelId' in event ? event.modelId : undefined;
      const debounceStatus = await getSessionDebounceStatus(sessionId, event.type, modelId);
      
      if (debounceStatus.shouldSkip) {
        return NextResponse.json(
          { message: 'Event debounced', lastEventTime: debounceStatus.lastEventTime },
          { status: 204 }
        );
      }
    }
    
    // Get request metadata
    const userAgent = request.headers.get('user-agent');
    const referer = request.headers.get('referer');
    
    // Store event
    const result = await storeAnalyticsEvent(event, sessionId, userAgent, referer);
    
    if (!result.success) {
      if (result.reason === 'duplicate') {
        return NextResponse.json(
          { message: 'Event already recorded' },
          { status: 204 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to store event' },
        { status: 500 }
      );
    }
    
    // Create response with session cookie
    const response = NextResponse.json(
      { message: 'Event recorded successfully' },
      { status: 204 }
    );
    
    // Set session cookie (30 days)
    response.cookies.set('analytics-session', sessionId, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return response;
    
  } catch (error) {
    console.error('Analytics events API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
