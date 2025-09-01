import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER || "devnet";
const ENDPOINT =
  CLUSTER === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com";
const TREASURY = new PublicKey(process.env.NEXT_PUBLIC_TREASURY!);
const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

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
  const body = await req.json();
  const { signature, expectedMemo, wallet } = body as {
    signature: string;
    expectedMemo: { marketId: string; side: "YES"|"NO"; amount: number };
    wallet: string;
  };

  if (!signature || !expectedMemo || !wallet) {
    return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
  }

  const connection = new Connection(ENDPOINT, "confirmed");
  const tx = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });

  if (!tx || tx.meta?.err) {
    return NextResponse.json({ ok: false, error: "TX_NOT_CONFIRMED" }, { status: 400 });
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
    return NextResponse.json({ ok: false, error: "VERIFY_FAIL" }, { status: 400 });
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
  const items = wallet ? store.bets.filter(b => b.wallet === wallet) : store.bets;
  return NextResponse.json({ ok: true, items });
}
