import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { MEMO_PROGRAM_ID } from "@solana/spl-memo";

// LEGACY API: This endpoint is from the old prediction markets system.
// New insights use the /api/insights endpoint instead.

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 10 * 1000; // 10 seconds
const RATE_LIMIT_MAX = 5; // 5 calls per window

function getRateLimitKey(ip: string, signature: string): string {
  return `${ip}:${signature}`;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  record.count++;
  return false;
}

function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// simple in-memory dev store for POST endpoint compatibility
const store: {
  bets: Array<{
    wallet: string;
    signature: string;
    marketId: string;
    side: "YES"|"NO";
    amount: number;
    ts: number;
  }>;
} = (globalThis as any).__prediktStore || { bets: [] };
(globalThis as any).__prediktStore = store;

function isValidBase58Signature(sig: string): boolean {
  // Basic validation: length 43-88 chars, base58 pattern
  return /^[1-9A-HJ-NP-Za-km-z]{43,88}$/.test(sig);
}

function createErrorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    // Clean up expired rate limit records
    cleanupRateLimitStore();
    
    // Get signature from query params
    const { searchParams } = new URL(request.url);
    const sig = searchParams.get("sig");
    
    if (!sig) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "Missing signature parameter" },
        { status: 400 }
      );
    }
    
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown";
    
    // Check rate limiting per IP and signature
    const rateLimitKey = getRateLimitKey(ip, sig);
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Too many requests for this signature" },
        { status: 429 }
      );
    }
    
    // Create Solana connection using SOLANA_RPC_URL
    const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");
    
    // Get treasury address
    const treasuryAddress = process.env.SOLANA_TREASURY || process.env.NEXT_PUBLIC_TREASURY;
    if (!treasuryAddress) {
      throw new Error("SOLANA_TREASURY environment variable not set");
    }
    const treasury = new PublicKey(treasuryAddress);
    
    // Get transaction status first
    const statusResponse = await connection.getSignatureStatus(sig, {
      searchTransactionHistory: true
    });
    
    if (!statusResponse.value) {
      return NextResponse.json(
        { error: "VERIFY_FAIL", message: "Transaction not found" },
        { status: 422 }
      );
    }
    
    const status = statusResponse.value;
    
    // Check if transaction is confirmed or finalized
    if (!status.confirmationStatus || 
        (status.confirmationStatus !== "confirmed" && status.confirmationStatus !== "finalized")) {
      return NextResponse.json(
        { error: "TX_NOT_CONFIRMED", message: "Transaction not confirmed or finalized" },
        { status: 409 }
      );
    }
    
    // Get full transaction details
    const transaction = await connection.getTransaction(sig, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0
    });
    
    if (!transaction) {
      return NextResponse.json(
        { error: "VERIFY_FAIL", message: "Transaction details not available" },
        { status: 422 }
      );
    }
    
    // Find memo instruction by matching program ID with MEMO_PROGRAM_ID constant
    let memo = "";
    
    // Handle both legacy and versioned transactions
    const message = transaction.transaction.message;
    let instructions: any[] = [];
    let accountKeys: PublicKey[] = [];
    
    if ('instructions' in message) {
      // Legacy transaction
      instructions = message.instructions;
      accountKeys = message.accountKeys;
    } else {
      // Versioned transaction (v0)
      instructions = message.compiledInstructions || [];
      accountKeys = message.staticAccountKeys || [];
    }
    
    for (const instruction of instructions) {
      if (instruction.programIdIndex !== undefined) {
        const programId = accountKeys[instruction.programIdIndex];
        if (programId && programId.equals(MEMO_PROGRAM_ID)) {
          memo = Buffer.from(instruction.data, 'base64').toString('utf8');
          break;
        }
      }
    }
    
    // Calculate amountLamports by treasury balance difference pre and post
    let amountLamports = 0;
    if (transaction.meta?.preBalances && transaction.meta?.postBalances) {
      // Find treasury account index
      const treasuryIndex = accountKeys.findIndex(
        (key: PublicKey) => key.equals(treasury)
      );
      
      if (treasuryIndex !== -1) {
        const preBalance = transaction.meta.preBalances[treasuryIndex];
        const postBalance = transaction.meta.postBalances[treasuryIndex];
        amountLamports = postBalance - preBalance;
      }
    }
    
    // Return success response with all required fields
    return NextResponse.json({
      ok: true,
      signature: sig,
      amountLamports,
      memo,
      slot: transaction.slot
    });
    
  } catch (error) {
    console.error("Bet verification error:", error);
    return NextResponse.json(
      { error: "VERIFY_FAIL", message: "Failed to verify transaction" },
      { status: 422 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Rate limiting for POST (keep existing functionality)
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  // Simple rate limiting for POST
  const now = Date.now();
  const postRateLimitKey = `POST:${ip}`;
  const postRecord = rateLimitStore.get(postRateLimitKey);
  
  if (postRecord && now < postRecord.resetTime && postRecord.count >= 10) {
    return createErrorResponse("RATE_LIMITED", "Too many requests", 429);
  }
  
  if (!postRecord || now > (postRecord.resetTime || 0)) {
    rateLimitStore.set(postRateLimitKey, { count: 1, resetTime: now + 60000 });
  } else {
    postRecord.count++;
  }

  const body = await req.json();
  const { signature, expectedMemo, wallet } = body as {
    signature: string;
    expectedMemo: { marketId: string; side: "YES"|"NO"; amount: number };
    wallet: string;
  };

  if (!signature || !expectedMemo || !wallet) {
    return createErrorResponse("BAD_REQUEST", "Missing required fields", 400);
  }

  // Validate signature format
  if (!isValidBase58Signature(signature)) {
    return createErrorResponse("BAD_REQUEST", "Invalid signature format", 400);
  }

  const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");
  const treasuryKey = process.env.SOLANA_TREASURY || process.env.NEXT_PUBLIC_TREASURY;

  if (!treasuryKey) {
    return createErrorResponse("CONFIG_ERROR", "Treasury address not configured", 500);
  }

  const treasury = new PublicKey(treasuryKey);

  const tx = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });

  if (!tx || tx.meta?.err) {
    return createErrorResponse("TX_NOT_CONFIRMED", "Transaction not confirmed", 409);
  }

  // Check transfer to TREASURY and memo content
  let hasTransfer = false;
  let memoOk = false;

  // Check memo
  for (const ix of tx.transaction.message.instructions) {
    const prog = "programId" in ix ? (ix as any).programId : (ix as any).programId;
    const programId = (prog?.toString?.() || (ix as any).programId)?.toString?.();
    if (programId === MEMO_PROGRAM_ID.toString()) {
      try {
        const data = Buffer.from((ix as any).data, "base64").toString("utf8");
        const parsed = JSON.parse(data);
        if (
          parsed.marketId === expectedMemo.marketId &&
          parsed.side === expectedMemo.side &&
          Number(parsed.amount) === Number(expectedMemo.amount)
        ) memoOk = true;
      } catch {}
    }
  }

  // Check transfer to treasury
  const pre = tx.meta?.preBalances || [];
  const post = tx.meta?.postBalances || [];
  const acctKeys = tx.transaction.message.accountKeys;
  const treasuryIndex = acctKeys.findIndex((a: any) => a.pubkey?.toBase58?.() === treasury.toBase58());
  if (treasuryIndex >= 0 && pre[treasuryIndex] != null && post[treasuryIndex] != null) {
    hasTransfer = post[treasuryIndex] > pre[treasuryIndex];
  }

  if (!hasTransfer || !memoOk) {
    return createErrorResponse("VERIFY_FAIL", "Transaction verification failed", 422);
  }

  const record = {
    wallet,
    signature,
    marketId: expectedMemo.marketId,
    side: expectedMemo.side,
    amount: Number(expectedMemo.amount),
    ts: Date.now(),
  };
  store.bets.push(record);

  return NextResponse.json({ ok: true, record });
}
