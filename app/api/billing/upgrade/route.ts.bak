import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Set httpOnly cookie for pro plan
    const response = NextResponse.json({ 
      ok: true, 
      plan: 'pro',
      message: 'Upgraded to Pro plan successfully'
    });
    
    response.cookies.set('predikt_plan', 'pro', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Upgrade error:', error);
    return NextResponse.json({ 
      ok: false, 
      code: 'UPGRADE_ERROR',
      message: 'Failed to upgrade plan'
    }, { status: 500 });
  }
}
