import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const runtime = 'nodejs';

const prisma = new PrismaClient();

// Handle all HTTP methods gracefully
export async function POST(request: NextRequest) {
  return handleAnalytics(request);
}

export async function GET(request: NextRequest) {
  return handleAnalytics(request);
}

export async function PUT(request: NextRequest) {
  return handleAnalytics(request);
}

export async function PATCH(request: NextRequest) {
  return handleAnalytics(request);
}

export async function DELETE(request: NextRequest) {
  return handleAnalytics(request);
}

async function handleAnalytics(request: NextRequest) {
  try {
    // Parse JSON payload (or default to empty if malformed/GET)
    let payload = {};
    try {
      if (request.method !== 'GET') {
        payload = await request.json();
      }
    } catch {
      // Malformed JSON - continue with empty payload
    }

    // Extract experiment data if present
    const { event, properties, timestamp } = payload as {
      event?: string;
      properties?: Record<string, any>;
      timestamp?: string;
    };

    // Store event in database if it's a tracked event
    if (event && properties) {
      try {
        await prisma.event.create({
          data: {
            type: event,
            meta: JSON.stringify(properties),
            experimentKey: properties.experimentKey || null,
            variant: properties.variant || null,
            insightId: properties.insightId || null,
            userId: properties.userId || null,
            createdAt: timestamp ? new Date(timestamp) : new Date(),
          },
        });
      } catch (dbError) {
        // Log but don't fail - analytics should be resilient
        console.error('Failed to store event in database:', dbError);
      }
    }

    // Log structured analytics event for external consumption
    console.log(JSON.stringify({
      kind: 'analytics',
      ...payload,
      ts: Date.now() // Server timestamp override for consistency
    }));

    // Always return 204 No Content (success, no response body)
    return new NextResponse(null, { status: 204 });
  } catch {
    // Even on error, return 204 - analytics should never fail visibly
    return new NextResponse(null, { status: 204 });
  }
}
