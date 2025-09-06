import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { PublicKey } from '@solana/web3.js';

export interface SessionData {
  valid: boolean;
  userId?: string;
  walletAddress?: string;
  email?: string;
  plan?: 'free' | 'pro';
}

/**
 * Validate session from request (both wallet and email auth)
 */
export async function validateSession(request: NextRequest): Promise<SessionData> {
  // Check for wallet signature in Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const walletSession = await validateWalletSession(authHeader.substring(7));
    if (walletSession.valid) {
      return walletSession;
    }
  }
  
  // Check for email session in cookie
  const sessionCookie = request.cookies.get('session')?.value;
  if (sessionCookie) {
    const emailSession = await validateEmailSession(sessionCookie);
    if (emailSession.valid) {
      return emailSession;
    }
  }
  
  return { valid: false };
}

/**
 * Validate wallet signature session
 */
async function validateWalletSession(signature: string): Promise<SessionData> {
  try {
    // In a real implementation, we would:
    // 1. Verify the signature against a known message
    // 2. Extract the public key from the signature
    // 3. Look up the user by wallet address
    
    // For V1, we'll use a simplified approach
    // This is a placeholder that assumes the signature is valid
    if (signature && signature.length > 10) {
      // Extract wallet address from signature (simplified)
      // In reality, you'd verify the signature properly
      const walletAddress = signature.substring(0, 44); // Base58 public key length
      
      return {
        valid: true,
        userId: `wallet-${walletAddress}`,
        walletAddress,
        plan: 'free'
      };
    }
    
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

/**
 * Validate email session from JWT cookie
 */
async function validateEmailSession(sessionToken: string): Promise<SessionData> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }
    
    const decoded = jwt.verify(sessionToken, secret) as any;
    
    if (decoded.userId && decoded.email) {
      return {
        valid: true,
        userId: decoded.userId,
        email: decoded.email,
        plan: decoded.plan || 'free'
      };
    }
    
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

/**
 * Create JWT session token for email users
 */
export function createSessionToken(userId: string, email: string, plan: 'free' | 'pro' = 'free'): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  
  return jwt.sign(
    { userId, email, plan },
    secret,
    { expiresIn: '30d' }
  );
}

/**
 * Verify wallet signature (placeholder implementation)
 */
export function verifyWalletSignature(
  publicKey: string,
  signature: string,
  message: string
): boolean {
  try {
    // In a real implementation, use @solana/web3.js to verify
    // For V1, we'll return true for valid-looking inputs
    return (
      publicKey.length === 44 && // Base58 public key
      signature.length > 50 &&   // Signature
      message.length > 0         // Message
    );
  } catch {
    return false;
  }
}

/**
 * Create wallet authentication message
 */
export function createWalletAuthMessage(nonce: string): string {
  return `Sign this message to authenticate with Predikt: ${nonce}`;
}

/**
 * Generate cryptographically secure nonce
 */
export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for Node.js
  const { randomBytes } = require('crypto');
  return randomBytes(16).toString('hex');
}
