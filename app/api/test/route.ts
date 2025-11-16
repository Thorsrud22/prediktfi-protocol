import { NextResponse } from 'next/server';

export async function GET() {
  console.log('📍 Test endpoint called');
  return NextResponse.json({ status: 'ok', message: 'Test endpoint working' });
}

export async function POST(request: Request) {
  console.log('📍 Test POST endpoint called');
  const body = await request.json();
  console.log('📍 Request body:', body);
  return NextResponse.json({ status: 'ok', receivedData: body });
}
