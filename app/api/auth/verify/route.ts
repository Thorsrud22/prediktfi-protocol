import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { consumeNonce } from '../../../lib/nonce';
import { getSessionFromRequest } from '../../../lib/session';
import { cookies } from 'next/headers';
import * as nacl from 'tweetnacl';

// Helper function to verify Solana signature
async function verifySignature(
  message: string,
  signature: number[],
  publicKey: string
): Promise<boolean> {
  try {
    if (!message || !signature || !publicKey || !Array.isArray(signature)) {
      console.error('Invalid parameters for signature verification');
      return false;
    }

    // Validate public key format
    let pubKey: PublicKey;
    try {
      pubKey = new PublicKey(publicKey);
    } catch {
      console.error('Invalid public key format');
      return false;
    }

    // Convert signature array to Uint8Array
    const signatureBytes = new Uint8Array(signature);
    
    // Convert message to Uint8Array
    const messageBytes = new TextEncoder().encode(message);
    
    // Convert public key to Uint8Array
    const publicKeyBytes = pubKey.toBytes();

    // Verify signature using tweetnacl
    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    console.log('Signature verification result:', isValid);
    return isValid;
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
      console.error('Signature verification failed for wallet:', wallet);
      return NextResponse.json({ 
        error: 'Invalid signature' 
      }, { status: 401 });
    }

    // Verify nonce
    const nonce = message.split('Sign this message to authenticate with Predikt: ')[1];
    if (!nonce) {
      console.error('Invalid message format - could not extract nonce from message:', message);
      return NextResponse.json({ 
        error: 'Invalid message format' 
      }, { status: 400 });
    }

    console.log('Attempting to consume nonce:', nonce, 'for wallet:', wallet);
    const isValidNonce = consumeNonce(wallet, nonce);
    if (!isValidNonce) {
      console.error('Nonce validation failed for wallet:', wallet, 'nonce:', nonce);
      return NextResponse.json({ 
        error: 'Invalid or expired nonce' 
      }, { status: 401 });
    }
    
    console.log('Nonce validated successfully for wallet:', wallet);

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

