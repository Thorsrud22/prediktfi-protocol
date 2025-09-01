import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER || "devnet";
const ENDPOINT =
  CLUSTER === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com";
const TREASURY = new PublicKey(process.env.NEXT_PUBLIC_TREASURY!);
const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

// Simple rate limiting for development/devnet
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX = 10; // requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(ip) || [];
  
  // Remove old requests outside window
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX) {
    return true;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return false;
}

function isValidBase58Signature(sig: string): boolean {
  // Basic validation: length 43-88 chars, base58 pattern
  return /^[1-9A-HJ-NP-Za-km-z]{43,88}$/.test(sig);
}

function createErrorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

// simple in-memory dev store
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

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (isRateLimited(ip)) {
    return createErrorResponse("RATE_LIMITED", "Too many requests", 429);
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

  const connection = new Connection(ENDPOINT, "confirmed");
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
    const prog = "programId" in ix ? (ix as any).programId : (ix as any).programId; // compatibility
    const programId = (prog?.toString?.() || (ix as any).programId)?.toString?.();
    if (programId === MEMO_PROGRAM_ID) {
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

  // Check transfer to treasury (parsed)
  const pre = tx.meta?.preBalances || [];
  const post = tx.meta?.postBalances || [];
  const acctKeys = tx.transaction.message.accountKeys;
  const treasuryIndex = acctKeys.findIndex((a: any) => a.pubkey?.toBase58?.() === TREASURY.toBase58());
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  const sig = searchParams.get("sig");
  
  // If sig param is provided, do verification
  if (sig) {
    // Validate signature format
    if (!isValidBase58Signature(sig)) {
      return createErrorResponse("BAD_REQUEST", "Invalid signature format", 400);
    }

    const connection = new Connection(ENDPOINT, "confirmed");
    
    try {
      const tx = await connection.getParsedTransaction(sig, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx || tx.meta?.err) {
        return createErrorResponse("TX_NOT_CONFIRMED", "Transaction not confirmed", 409);
      }

      // Extract memo and transfer data
      let memo: any = null;
      let amountLamports = 0;

      // Check memo
      for (const ix of tx.transaction.message.instructions) {
        const prog = "programId" in ix ? (ix as any).programId : (ix as any).programId;
        const programId = (prog?.toString?.() || (ix as any).programId)?.toString?.();
        if (programId === MEMO_PROGRAM_ID) {
          try {
            const data = Buffer.from((ix as any).data, "base64").toString("utf8");
            memo = JSON.parse(data);
          } catch {}
        }
      }

      // Check transfer to treasury
      const pre = tx.meta?.preBalances || [];
      const post = tx.meta?.postBalances || [];
      const acctKeys = tx.transaction.message.accountKeys;
      const treasuryIndex = acctKeys.findIndex((a: any) => a.pubkey?.toBase58?.() === TREASURY.toBase58());
      if (treasuryIndex >= 0 && pre[treasuryIndex] != null && post[treasuryIndex] != null) {
        amountLamports = post[treasuryIndex] - pre[treasuryIndex];
      }

      return NextResponse.json({ 
        ok: true, 
        memo, 
        amountLamports, 
        slot: tx.slot, 
        signature: sig 
      });
    } catch (error) {
      return createErrorResponse("VERIFY_FAIL", "Transaction verification failed", 422);
    }
  }
  
  // Otherwise, return stored bets
  const items = wallet ? store.bets.filter(b => b.wallet === wallet) : store.bets;
  return NextResponse.json({ ok: true, items });
}
