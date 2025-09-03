import { NextRequest, NextResponse } from 'next/server';

const VALID_BETA_CODE = 'PREDIKT_BETA';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json({
        ok: false,
        code: 'INVALID_CODE',
        message: 'Invalid or missing beta code'
      }, { status: 400 });
    }
    
    if (code.trim().toUpperCase() !== VALID_BETA_CODE) {
      return NextResponse.json({
        ok: false,
        code: 'INVALID_CODE', 
        message: 'Invalid beta code'
      }, { status: 400 });
    }
    
    // Set pro plan cookie
    const response = NextResponse.json({
      ok: true,
      plan: 'pro',
      message: 'Beta code redeemed successfully'
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
    console.error('Redeem error:', error);
    return NextResponse.json({
      ok: false,
      code: 'REDEEM_ERROR',
      message: 'Failed to redeem beta code'
    }, { status: 500 });
  }
}
