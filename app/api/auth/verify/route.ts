import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { consumeNonce } from '../../../lib/nonce';
import { getSessionFromRequest } from '../../../lib/session';
import { cookies } from 'next/headers';

// Helper function to verify Solana signature
async function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    // For now, we'll do a basic validation
    // In production, you'd use tweetnacl or similar to verify the signature
    // This is a simplified version for the MVP
    
    if (!message || !signature || !publicKey) {
      return false;
    }

    // Basic format validation
    if (signature.length !== 128) { // Base58 encoded signature length
      return false;
    }

    // Validate public key format
    try {
      new PublicKey(publicKey);
    } catch {
      return false;
    }

    // For MVP, we'll accept any valid format signature
    // In production, implement proper signature verification
    return true;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { wallet, signature, message } = await request.json();
    
    if (!wallet || !signature || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: wallet, signature, message' 
      }, { status: 400 });
    }

    // Verify signature
    const isValidSignature = await verifySignature(message, signature, wallet);
    if (!isValidSignature) {
      return NextResponse.json({ 
        error: 'Invalid signature' 
      }, { status: 401 });
    }

    // Verify nonce
    const nonce = message.split('Sign this message to authenticate with Predikt: ')[1];
    if (!nonce) {
      return NextResponse.json({ 
        error: 'Invalid message format' 
      }, { status: 400 });
    }

    const isValidNonce = consumeNonce(wallet, nonce);
    if (!isValidNonce) {
      return NextResponse.json({ 
        error: 'Invalid or expired nonce' 
      }, { status: 401 });
    }

    // Set session cookie
    const cookieStore = await cookies();
    const sessionData = {
      wallet,
      authenticated: true,
      timestamp: Date.now()
    };

    cookieStore.set('predikt_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });

    return NextResponse.json({ 
      success: true, 
      wallet: wallet.slice(0, 8) + '...' + wallet.slice(-4)
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json({ 
      error: 'Authentication failed' 
    }, { status: 500 });
  }
}

