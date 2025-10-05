// E8.1 Insights Pipeline - Node.js Runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { MEMO_PROGRAM_ID } from '../../lib/solana';
import { InsightRequestSchema } from './_schemas';
import { checkAuthAndQuota } from './_auth';
import { insightsCache } from './_cache';
import { runPipeline } from './_pipeline';
import { checkAntiGaming, logAntiGamingViolation, getAntiGamingStatus } from '../../lib/anti-gaming';

const INSIGHTS_RATE_LIMIT_WINDOW = 60 * 1000;
const INSIGHTS_RATE_LIMIT_MAX = 5;

const insightsRateLimitStore = new Map<string, { count: number; resetTime: number }>();

function cleanupInsightsRateLimits() {
  const now = Date.now();
  for (const [key, value] of insightsRateLimitStore.entries()) {
    if (now > value.resetTime) {
      insightsRateLimitStore.delete(key);
    }
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Step 1: Parse and validate request body
    const body = await request.json();
    const validation = InsightRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }
    
    const insightRequest = validation.data;
    
    // Step 2: Check authentication and quota
    const authResult = checkAuthAndQuota(request);
    
    if (!authResult.allowed) {
      return NextResponse.json(
        {
          error: authResult.error,
          plan: authResult.plan,
          resetTime: authResult.resetTime,
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Plan': authResult.plan,
            'X-RateLimit-Remaining': authResult.remaining?.toString() || '0',
            'Retry-After': authResult.resetTime ? Math.ceil((authResult.resetTime - Date.now()) / 1000).toString() : '60',
          }
        }
      );
    }
    
    // Step 3: Check anti-gaming measures
    const walletId = request.headers.get('x-wallet-id') || 
                    request.cookies.get('wallet_id')?.value ||
                    request.nextUrl.searchParams.get('wallet');
    
    if (walletId) {
      const antiGamingCheck = await checkAntiGaming({
        walletId,
        question: insightRequest.question,
        probability: 0.5, // Default probability for anti-gaming check
        category: insightRequest.category,
        timestamp: new Date()
      });
      
      if (!antiGamingCheck.allowed) {
        // Log the violation
        await logAntiGamingViolation(walletId, antiGamingCheck.reason || 'Unknown violation', {
          walletId,
          question: insightRequest.question,
          probability: 0.5, // Default probability for logging
          category: insightRequest.category,
          timestamp: new Date()
        });
        
        return NextResponse.json(
          {
            error: 'Anti-gaming violation',
            message: antiGamingCheck.reason,
            cooldownUntil: antiGamingCheck.cooldownUntil?.toISOString(),
            violations: antiGamingCheck.violations
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Plan': authResult.plan,
              'Retry-After': antiGamingCheck.cooldownUntil ? 
                Math.ceil((antiGamingCheck.cooldownUntil.getTime() - Date.now()) / 1000).toString() : '60',
            }
          }
        );
      }
    }
    
    // Step 4: Check cache first
    const cachedResult = insightsCache.get(insightRequest);
    if (cachedResult) {
      return NextResponse.json(
        { ...cachedResult, cached: true },
        {
          headers: {
            'X-Cache': 'HIT',
            'X-RateLimit-Plan': authResult.plan,
            'X-RateLimit-Remaining': authResult.remaining?.toString() || 'unlimited',
          }
        }
      );
    }
    
    // Step 5: Run the insight pipeline
    const result = await runPipeline(insightRequest);
    
    // Step 6: Cache the result
    insightsCache.set(insightRequest, result);
    
    // Step 7: Return response
    return NextResponse.json(result, {
      headers: {
        'X-Cache': 'MISS',
        'X-RateLimit-Plan': authResult.plan,
        'X-RateLimit-Remaining': authResult.remaining?.toString() || 'unlimited',
        'X-Processing-Time': `${Date.now() - startTime}ms`,
      }
    });
    
  } catch (error) {
    console.error('Insights API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Unable to process insight request at this time'
      },
      { 
        status: 500,
        headers: {
          'X-Processing-Time': `${Date.now() - startTime}ms`,
        }
      }
    );
  }
}

// Keep the old GET endpoint for backward compatibility (Solana verification)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const signature = url.searchParams.get('sig');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature parameter' }, { status: 400 });
  }

  cleanupInsightsRateLimits();

  const clientIp = getClientIp(request);
  const rateLimitKey = `${clientIp}:${signature}`;
  const rateLimitStatus = insightsRateLimitStore.get(rateLimitKey);
  const now = Date.now();

  if (!rateLimitStatus || now > rateLimitStatus.resetTime) {
    insightsRateLimitStore.set(rateLimitKey, {
      count: 1,
      resetTime: now + INSIGHTS_RATE_LIMIT_WINDOW
    });
  } else if (rateLimitStatus.count >= INSIGHTS_RATE_LIMIT_MAX) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  } else {
    rateLimitStatus.count += 1;
    insightsRateLimitStore.set(rateLimitKey, rateLimitStatus);
  }

  try {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    const transaction = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 422 });
    }

    const message: any = transaction.transaction?.message ?? {};
    const accountKeys = message.staticAccountKeys || message.accountKeys || [];
    const instructions = message.compiledInstructions || message.instructions || [];

    const memoInstruction = instructions.find((instruction: any) => {
      const programId = resolveProgramId(instruction, accountKeys);
      return programId === MEMO_PROGRAM_ID.toBase58();
    });

    if (!memoInstruction) {
      return NextResponse.json({ error: 'No memo instruction found' }, { status: 422 });
    }

    const memoRaw = decodeInstructionData(memoInstruction.data);

    if (!memoRaw) {
      return NextResponse.json({ error: 'Invalid memo format' }, { status: 422 });
    }

    let memoJson: any;
    try {
      memoJson = JSON.parse(memoRaw);
    } catch {
      return NextResponse.json({ error: 'Invalid memo format' }, { status: 422 });
    }

    if (memoJson?.kind !== 'insight') {
      return NextResponse.json({ error: 'Memo does not contain insight data' }, { status: 422 });
    }

    return NextResponse.json({
      ok: true,
      signature,
      memo: memoJson,
      slot: transaction.slot
    });
  } catch (error) {
    console.error('Insight verification error:', error);
    return NextResponse.json({ error: 'Failed to verify transaction' }, { status: 422 });
  }
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function resolveProgramId(instruction: any, accountKeys: any[]): string | null {
  if (!instruction) {
    return null;
  }

  if (typeof instruction.programId === 'string') {
    return instruction.programId;
  }

  if (instruction.programId?.toBase58) {
    return instruction.programId.toBase58();
  }

  if (typeof instruction.programIdIndex === 'number') {
    const programAccount = accountKeys[instruction.programIdIndex];
    if (typeof programAccount === 'string') {
      return programAccount;
    }
    if (programAccount?.toBase58) {
      return programAccount.toBase58();
    }
    if (programAccount?.pubkey?.toBase58) {
      return programAccount.pubkey.toBase58();
    }
  }

  return null;
}

function decodeInstructionData(data: unknown): string | null {
  if (typeof data === 'string') {
    try {
      return Buffer.from(data, 'base64').toString('utf8');
    } catch {
      return data;
    }
  }

  if (data instanceof Uint8Array) {
    return Buffer.from(data).toString('utf8');
  }

  if (Array.isArray(data)) {
    return Buffer.from(data).toString('utf8');
  }

  if (typeof data === 'object' && data !== null) {
    if (Buffer.isBuffer(data)) {
      return data.toString('utf8');
    }
    if ('data' in data && Array.isArray((data as any).data)) {
      return Buffer.from((data as any).data).toString('utf8');
    }
  }

  return null;
}
