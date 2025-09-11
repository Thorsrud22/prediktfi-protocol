import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '../../../lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    
    if (!session.authenticated || !session.wallet) {
      return NextResponse.json({ 
        plan: 'free',
        expiresAt: null 
      });
    }

    // For now, return free plan
    // In production, you'd check the database for the user's plan
    return NextResponse.json({
      plan: 'free',
      expiresAt: null
    });
  } catch (error) {
    console.error('Plan fetch error:', error);
    return NextResponse.json({ 
      plan: 'free',
      expiresAt: null 
    });
  }
}
