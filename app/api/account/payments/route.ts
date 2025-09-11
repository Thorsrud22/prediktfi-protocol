import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '../../../lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    
    if (!session.authenticated || !session.wallet) {
      return NextResponse.json([]);
    }

    // For now, return empty array
    // In production, you'd fetch from the database based on session.wallet
    return NextResponse.json([]);
  } catch (error) {
    console.error('Payments fetch error:', error);
    return NextResponse.json([]);
  }
}
