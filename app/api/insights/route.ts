import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { MEMO_PROGRAM_ID } from "../../lib/solana";

// Rate limiting storage (in-memory for simplicity)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = 10 * 1000; // 10 seconds
  const limit = 5; // 5 requests per window

  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset window
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  
  if (current.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  current.count++;
  return { allowed: true, remaining: limit - current.count };
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";
  return ip;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const signature = searchParams.get("sig");

    // Validate signature parameter
    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature parameter" },
        { status: 400 }
      );
    }

    // Rate limiting: 5 calls per 10 seconds per IP + signature combination
    const clientIP = getClientIP(request);
    const rateLimitKey = `${clientIP}:${signature}`;
    const rateLimit = checkRateLimit(rateLimitKey);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": "10",
          }
        }
      );
    }

    // Get cluster and connection
    const cluster = process.env.SOLANA_CLUSTER || "devnet";
    const connection = new Connection(
      cluster === "mainnet-beta" ? clusterApiUrl("mainnet-beta") : clusterApiUrl("devnet"),
      "confirmed"
    );

    // Get transaction info
    const txInfo = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!txInfo) {
      return NextResponse.json(
        { error: "Transaction not found or not confirmed" },
        { status: 409 }
      );
    }

    // Find memo instruction
    let memoInstruction = null;
    let memoData = null;

    for (const instruction of txInfo.transaction.message.compiledInstructions) {
      const programId = txInfo.transaction.message.staticAccountKeys[instruction.programIdIndex];
      
      if (programId.equals(MEMO_PROGRAM_ID)) {
        memoInstruction = instruction;
        memoData = Buffer.from(instruction.data).toString("utf8");
        break;
      }
    }

    if (!memoInstruction || !memoData) {
      return NextResponse.json(
        { error: "No memo instruction found" },
        { status: 422 }
      );
    }

    // Parse memo JSON and validate
    let memo;
    try {
      memo = JSON.parse(memoData);
    } catch {
      return NextResponse.json(
        { error: "Invalid memo JSON format" },
        { status: 422 }
      );
    }

    if (memo.kind !== "insight") {
      return NextResponse.json(
        { error: "Memo does not contain insight data" },
        { status: 422 }
      );
    }

    // Success response
    return NextResponse.json({
      ok: true,
      signature,
      memo,
      slot: txInfo.slot,
    }, {
      headers: {
        "X-RateLimit-Limit": "5",
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        "X-RateLimit-Reset": "10",
      }
    });

  } catch (error) {
    console.error("Insights verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
