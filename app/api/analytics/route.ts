import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Parse JSON payload (or default to empty if malformed)
    let payload = {};
    try {
      payload = await request.json();
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
