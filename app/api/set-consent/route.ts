import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { consent } = body;
    
    if (consent !== true) {
      return NextResponse.json(
        { error: 'Invalid consent value' },
        { status: 400 }
      );
    }
    
    const response = NextResponse.json({ success: true });
    
    // Set httpOnly cookie with 365 days expiration
    response.cookies.set('predikt_consent_v1', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 365 * 24 * 60 * 60, // 365 days in seconds
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Error setting consent cookie:', error);
    return NextResponse.json(
      { error: 'Failed to set consent' },
      { status: 500 }
    );
  }
}
