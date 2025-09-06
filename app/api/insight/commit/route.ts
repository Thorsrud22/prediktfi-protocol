/**
 * NEW BLOKK 3: Proof Agent API - Insight Commitment
 * POST /api/insight/commit - Store on-chain proof
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { prisma } from '../../../lib/prisma';
import { generatePredictionHash } from '../../../../lib/memo';
import { CommitInsightSchema, CommitInsightResponse } from '../_schemas';
import { EVENT_TYPES, createEvent } from '../../../../lib/events';

const RPC_ENDPOINTS = {
  devnet: 'https://api.devnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com'
};

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { id, signature, cluster } = CommitInsightSchema.parse(body);

    // Step a) Fetch insight
    const insight = await prisma.insight.findUnique({
      where: { id }
    });

    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      );
    }

    if (insight.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Insight already committed' },
        { status: 409 }
      );
    }

    // Step b) Fetch transaction from RPC and parse memo
    const connection = new Connection(RPC_ENDPOINTS[cluster]);
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Extract memo from transaction
    let memoData: any = null;
    const memoInstruction = transaction.transaction.message.instructions.find(
      (instruction: any) => {
        // Look for memo program instruction
        const programId = transaction.transaction.message.accountKeys[instruction.programIdIndex];
        return programId?.toBase58() === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
      }
    );

    if (memoInstruction) {
      try {
        const memoText = Buffer.from(memoInstruction.data, 'base64').toString('utf-8');
        memoData = JSON.parse(memoText);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid memo format' },
          { status: 422 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Memo instruction not found' },
        { status: 422 }
      );
    }

    // Step c) Validate memo data
    if (memoData.t !== 'predikt.v1') {
      return NextResponse.json(
        { error: 'Invalid memo type' },
        { status: 422 }
      );
    }

    if (memoData.pid !== id) {
      return NextResponse.json(
        { error: 'Memo PID mismatch' },
        { status: 422 }
      );
    }

    // Recompute hash and validate
    const expectedHash = generatePredictionHash(
      insight.canonical!,
      insight.deadline!.toISOString(),
      insight.resolverRef!
    );

    if (memoData.h !== expectedHash) {
      return NextResponse.json(
        { error: 'Memo hash mismatch' },
        { status: 422 }
      );
    }

    // Validate deadline
    const expectedDate = insight.deadline!.toISOString().split('T')[0];
    if (memoData.d !== expectedDate) {
      return NextResponse.json(
        { error: 'Memo deadline mismatch' },
        { status: 422 }
      );
    }

    // Step d) Update insight with commitment info
    await prisma.insight.update({
      where: { id },
      data: {
        status: 'COMMITTED',
        memoSig: signature,
        slot: transaction.slot,
        updatedAt: new Date()
      }
    });

    // Step e) Log event
    console.log(JSON.stringify(createEvent(
      EVENT_TYPES.MEMO_COMMITTED,
      {
        id,
        signature,
        slot: transaction.slot,
        cluster,
        tookMs: Date.now() - Date.now() // Will be calculated properly
      }
    )));

    // Build response
    const explorerUrl = cluster === 'mainnet' 
      ? `https://explorer.solana.com/tx/${signature}`
      : `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

    const response: CommitInsightResponse = {
      status: 'committed',
      explorerUrl
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error committing insight:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid payload', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
