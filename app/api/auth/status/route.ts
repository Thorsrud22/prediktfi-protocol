import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '../../../lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    
    return NextResponse.json({
      authenticated: session.authenticated,
      wallet: session.wallet ? session.wallet.slice(0, 8) + '...' + session.wallet.slice(-4) : null
    });
  } catch (error) {
    console.error('Auth status error:', error);
    return NextResponse.json({ 
      authenticated: false, 
      wallet: null 
    });
  }
}
