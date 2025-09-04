import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // This endpoint will be caught by middleware if geofence rules apply
  const body = await request.json();
  
  return NextResponse.json({ 
    success: true, 
    message: 'API call successful',
    timestamp: new Date().toISOString(),
    test: body.test 
  });
}
