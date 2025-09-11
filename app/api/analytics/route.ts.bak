import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

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
