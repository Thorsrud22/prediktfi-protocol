import { NextRequest, NextResponse } from 'next/server';
import { ulid } from 'ulid';
import { storeNonce, cleanupExpiredNonces } from '../../../lib/nonce';

export async function POST(request: NextRequest) {
  try {
    const { wallet } = await request.json();
    
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Generate nonce
    const nonce = ulid();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store nonce
    storeNonce(wallet, nonce, expiresAt);

    // Clean up expired nonces
    cleanupExpiredNonces();

    return NextResponse.json({ nonce });
  } catch (error) {
    console.error('Nonce generation error:', error);
    return NextResponse.json({ error: 'Failed to generate nonce' }, { status: 500 });
  }
}
