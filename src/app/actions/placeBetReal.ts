"use server";

import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction, clusterApiUrl } from "@solana/web3.js";
import { MEMO_PROGRAM_ID } from "@solana/spl-memo";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function placeBetReal(formData: FormData) {
  try {
    // Extract form data
    const marketId = formData.get("marketId") as string;
    const side = formData.get("side") as "YES" | "NO";
    const amount = parseFloat(formData.get("amount") as string);
    const walletPublicKey = formData.get("walletPublicKey") as string;
    const ref = formData.get("ref") as string || "";
    const creatorId = formData.get("creatorId") as string || "";
    
    if (!marketId || !side || !amount || !walletPublicKey) {
      throw new Error("Missing required parameters");
    }

    // Get cluster from environment or default to devnet
    const cluster = process.env.SOLANA_CLUSTER || "devnet";
    
    // Check consent for mainnet
    if (cluster === "mainnet-beta") {
      const cookieStore = await cookies();
      const consentCookie = cookieStore.get("predikt_consent_v1");
      
      if (!consentCookie || consentCookie.value !== "true") {
        return {
          success: false,
          error: "CONSENT_REQUIRED",
          code: 403,
        };
      }
    }
    const connection = new Connection(
      cluster === "mainnet-beta" ? clusterApiUrl("mainnet-beta") : clusterApiUrl("devnet"),
      "confirmed"
    );

    // Get treasury address from environment (server-side only)
    const treasuryAddress = process.env.SOLANA_TREASURY;
    if (!treasuryAddress) {
      throw new Error("SOLANA_TREASURY environment variable not set");
    }
    
    const treasury = new PublicKey(treasuryAddress);
    const fromPubkey = new PublicKey(walletPublicKey);

    // Create memo data with all required fields
    const memoData: any = {
      marketId,
      side,
      amount,
      ts: Date.now(),
    };
    
    // Only include ref and creatorId if they have values
    if (ref) {
      memoData.ref = ref;
    }
    if (creatorId) {
      memoData.creatorId = creatorId;
    }

    // Convert amount to lamports
    const lamports = Math.round(amount * 1e9);

    // Create transaction with transfer and memo
    const transaction = new Transaction();
    
    // Add transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey: treasury,
        lamports,
      })
    );

    // Add memo instruction
    transaction.add(
      new TransactionInstruction({
        programId: MEMO_PROGRAM_ID,
        keys: [],
        data: Buffer.from(JSON.stringify(memoData), "utf8"),
      })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    // Serialize transaction for client-side signing
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    // Return transaction data and treasury address to client for signing
    return {
      success: true,
      transaction: serializedTransaction.toString("base64"),
      treasuryAddress: treasuryAddress, // Safe to send back since transaction is already built
      memoData: JSON.stringify(memoData),
    };

  } catch (error) {
    console.error("placeBetReal error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function handleBetTransaction(signature: string) {
  // Redirect to portfolio with signature
  redirect(`/me?sig=${signature}`);
}
