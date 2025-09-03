"use server";

import { Connection, PublicKey, Transaction, clusterApiUrl } from "@solana/web3.js";
import { MEMO_PROGRAM_ID, createInsightMemoInstruction } from "../solana";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

interface InsightPayload {
  kind: "insight";
  topic: string;
  question: string;
  horizon: string;
  prob: number;
  drivers: string[];
  rationale: string;
  model: string;
  scenarioId: string;
  ref?: string;
  creatorId?: string;
  ts: string;
}

export async function logInsightReal(formData: FormData) {
  try {
    // Extract form data
    const topic = formData.get("topic") as string;
    const question = formData.get("question") as string;
    const horizon = formData.get("horizon") as string;
    const prob = parseFloat(formData.get("prob") as string);
    const drivers = JSON.parse(formData.get("drivers") as string);
    const rationale = formData.get("rationale") as string;
    const model = formData.get("model") as string;
    const scenarioId = formData.get("scenarioId") as string;
    const walletPublicKey = formData.get("walletPublicKey") as string;
    const ref = formData.get("ref") as string || undefined;
    const creatorId = formData.get("creatorId") as string || undefined;
    
    if (!topic || !question || !horizon || isNaN(prob) || !drivers || !rationale || !model || !scenarioId || !walletPublicKey) {
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

    const fromPubkey = new PublicKey(walletPublicKey);

    // Create insight payload with server timestamp
    const payload: InsightPayload = {
      kind: "insight",
      topic,
      question,
      horizon,
      prob,
      drivers,
      rationale,
      model,
      scenarioId,
      ts: new Date().toISOString(), // ISO string from server
    };
    
    // Only include ref and creatorId if they have values
    if (ref) {
      payload.ref = ref;
    }
    if (creatorId) {
      payload.creatorId = creatorId;
    }

    // Create transaction with only memo instruction (no lamport transfer)
    const transaction = new Transaction();
    
    // Add memo instruction
    const memoData = Buffer.from(JSON.stringify(payload), "utf8");
    transaction.add(createInsightMemoInstruction(memoData));

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    // Serialize transaction for client-side signing
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    // Return transaction data to client for signing
    return {
      success: true,
      transaction: serializedTransaction.toString("base64"),
      payload: JSON.stringify(payload),
    };

  } catch (error) {
    console.error("logInsightReal error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function handleInsightTransaction(signature: string) {
  // Redirect to portfolio with signature
  redirect(`/me?sig=${signature}`);
}
