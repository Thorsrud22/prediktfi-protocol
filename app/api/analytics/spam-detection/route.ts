/**
 * Spam Detection Analytics API
 * GET /api/analytics/spam-detection - Get spam detection metrics and patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createHmac } from 'crypto';

const prisma = new PrismaClient();

export interface SpamDetectionMetrics {
  totalViolations: number;
  violationsByType: {
    burst: number;
    similar: number;
    rateLimit: number;
    notional: number;
  };
  topOffenders: Array<{
    walletId: string;
    violationCount: number;
    lastViolation: string;
    types: string[];
  }>;
  recentPatterns: Array<{
    timestamp: string;
    type: string;
    walletId: string;
    description: string;
  }>;
  timeRange: {
    start: string;
    end: string;
  };
}

/**
 * Verify HMAC signature for analytics endpoint
 */
function verifyHMACSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for HMAC signature
    const signature = request.headers.get('x-ops-signature');
    const opsSecret = process.env.OPS_SECRET;
    
    if (!opsSecret) {
      console.error('OPS_SECRET not configured');
      return NextResponse.json(
        { error: 'Operations secret not configured' },
        { status: 500 }
      );
    }
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-ops-signature header' },
        { status: 401 }
      );
    }
    
    // Get request body for signature verification (empty for GET)
    const body = '';
    
    if (!verifyHMACSignature(body, signature, opsSecret)) {
      console.error('Invalid HMAC signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const daysParam = url.searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 7;
    
    if (days < 1 || days > 30) {
      return NextResponse.json(
        { error: 'days parameter must be between 1 and 30' },
        { status: 400 }
      );
    }
    
    // Calculate time range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get anti-gaming violations
    const violations = await prisma.event.findMany({
      where: {
        type: 'anti_gaming_violation',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Process violations
    const totalViolations = violations.length;
    const violationsByType = {
      burst: 0,
      similar: 0,
      rateLimit: 0,
      notional: 0
    };
    
    const walletViolations = new Map<string, {
      count: number;
      lastViolation: Date;
      types: Set<string>;
    }>();
    
    const recentPatterns: Array<{
      timestamp: string;
      type: string;
      walletId: string;
      description: string;
    }> = [];
    
    for (const violation of violations) {
      try {
        const meta = JSON.parse(violation.meta || '{}');
        const violationType = meta.violation || 'unknown';
        
        // Categorize violation type
        if (violationType.includes('Burst pattern')) {
          violationsByType.burst++;
        } else if (violationType.includes('Spam pattern')) {
          violationsByType.similar++;
        } else if (violationType.includes('limit exceeded')) {
          violationsByType.rateLimit++;
        } else if (violationType.includes('notional')) {
          violationsByType.notional++;
        }
        
        // Track per wallet
        if (violation.userId) {
          const existing = walletViolations.get(violation.userId) || {
            count: 0,
            lastViolation: violation.createdAt,
            types: new Set<string>()
          };
          
          existing.count++;
          existing.lastViolation = violation.createdAt > existing.lastViolation ? 
            violation.createdAt : existing.lastViolation;
          existing.types.add(violationType);
          
          walletViolations.set(violation.userId, existing);
        }
        
        // Add to recent patterns
        recentPatterns.push({
          timestamp: violation.createdAt.toISOString(),
          type: violationType,
          walletId: violation.userId || 'unknown',
          description: violationType
        });
        
      } catch (error) {
        console.warn('Failed to parse violation meta:', error);
      }
    }
    
    // Get top offenders
    const topOffenders = Array.from(walletViolations.entries())
      .map(([walletId, data]) => ({
        walletId,
        violationCount: data.count,
        lastViolation: data.lastViolation.toISOString(),
        types: Array.from(data.types)
      }))
      .sort((a, b) => b.violationCount - a.violationCount)
      .slice(0, 10);
    
    const metrics: SpamDetectionMetrics = {
      totalViolations,
      violationsByType,
      topOffenders,
      recentPatterns: recentPatterns.slice(0, 20), // Last 20 patterns
      timeRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    };
    
    console.log(`📊 Spam detection metrics: ${totalViolations} violations in last ${days} days`);
    
    return NextResponse.json(metrics, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Spam detection analytics error:', error);
    
    return NextResponse.json(
      { 
        error: `Spam detection analytics failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timeRange: {
          start: new Date().toISOString(),
          end: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Spam detection analytics health check failed:', error);
    return new NextResponse(null, { status: 503 });
  }
}
