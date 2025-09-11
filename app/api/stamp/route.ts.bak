// E9.0 Stamp API - Node.js Runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { StampRequestSchema, StampResponse } from './_schemas';
import { generateMerkleRoot } from './_merkle';
import { prisma } from '../../lib/prisma';
import { trackServer } from '../../../lib/analytics';
import { Connection, Keypair, Transaction, SystemProgram, PublicKey, clusterApiUrl } from '@solana/web3.js';

// Simple memo program for devnet
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Step 1: Parse and validate request body
    const body = await request.json();
    const validation = StampRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }
    
    const { insightIds, walletAddress } = validation.data;
    
    // Step 2: Check if user has Pro plan (simplified - in real app check auth)
    // For now, we'll allow stamping for demonstration
    
    // Step 3: Verify all insights exist and are not already stamped
    const insights = await prisma.insight.findMany({
      where: {
        id: { in: insightIds },
        stamped: false,
      }
    });
    
    if (insights.length === 0) {
      return NextResponse.json(
        { error: 'No valid unstamped insights found' },
        { status: 404 }
      );
    }
    
    if (insights.length !== insightIds.length) {
      const foundIds = insights.map(i => i.id);
      const missingIds = insightIds.filter(id => !foundIds.includes(id));
      
      return NextResponse.json(
        { 
          error: 'Some insights not found or already stamped',
          missingIds 
        },
        { status: 400 }
      );
    }
    
    // Step 4: Generate merkle root
    const merkleRoot = generateMerkleRoot(insightIds);
    
    // Step 5: Create Solana transaction (devnet)
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    
    // For demo purposes, create a simple memo transaction
    // In production, you'd use a proper program for stamping
    const transaction = new Transaction();
    
    // Add memo instruction with merkle root
    const memoData = JSON.stringify({
      type: 'predikt_stamp',
      merkleRoot,
      insightIds,
      timestamp: Date.now(),
    });
    
    transaction.add({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoData, 'utf8'),
    });
    
    // Set recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(walletAddress);
    
    // For demo, we'll simulate the transaction signature
    // In real implementation, the client would sign and send this
    const simulatedTxSig = `stamp_${merkleRoot.substring(0, 8)}_${Date.now()}`;
    
    // Step 6: Create stamp record in database
    const stamp = await prisma.stamp.create({
      data: {
        merkleRoot,
        chain: 'solana',
        cluster: 'devnet',
        txSig: simulatedTxSig,
      }
    });
    
    // Step 7: Update insights to mark as stamped
    await prisma.insight.updateMany({
      where: {
        id: { in: insightIds }
      },
      data: {
        stamped: true,
        txSig: simulatedTxSig,
        stampId: stamp.id,
      }
    });
    
    // Step 8: Build response
    const response: StampResponse = {
      stampId: stamp.id,
      merkleRoot,
      txSig: simulatedTxSig,
      chain: 'solana',
      cluster: 'devnet',
      insightIds,
      explorerUrl: `https://explorer.solana.com/tx/${simulatedTxSig}?cluster=devnet`,
      createdAt: stamp.createdAt.toISOString(),
    };
    
    const tookMs = Date.now() - startTime;
    
    trackServer('insights_stamped', {
      count: insightIds.length,
      merkleRoot: merkleRoot.substring(0, 8),
      tookMs,
    });
    
    return NextResponse.json(response, {
      headers: {
        'X-Processing-Time': `${tookMs}ms`,
      }
    });
    
  } catch (error) {
    const tookMs = Date.now() - startTime;
    console.error('Stamp API error:', error);
    
    trackServer('stamp_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tookMs,
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Unable to stamp insights at this time'
      },
      { 
        status: 500,
        headers: {
          'X-Processing-Time': `${tookMs}ms`,
        }
      }
    );
  }
}
