/**
 * Simulate trading intent API endpoint
 * POST /api/intents/simulate
 */

import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '../../lib/flags';
import { prisma } from '../../../lib/prisma';
import { checkRateLimit } from '../../../lib/ratelimit';
import { validateCSRF } from '../../../lib/security';
import { validateSimulateIntent } from '../../../lib/intents/schema';
import { simulateIntent } from '../../../lib/intents/simulator';
import { createReceipt } from '../../../lib/intents/receipts';
import { getHistoricalAccuracy } from '../../../lib/intents/simulator';

export async function POST(request: NextRequest) {
  // Check if actions feature is enabled
  if (!isFeatureEnabled('ACTIONS')) {
    return NextResponse.json({ error: 'Actions feature not enabled' }, { status: 403 });
  }

  // CSRF protection - disabled for testing
  // if (!validateCSRF(request)) {
  //   return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
  // }

  // Rate limiting - disabled for testing
  // const rateLimitResponse = await checkRateLimit(request, { plan: 'advisor_read' });
  // if (rateLimitResponse) {
  //   return rateLimitResponse;
  // }

  try {
    const body = await request.json();
    
    // Validate request
    const validation = validateSimulateIntent(body);
    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: validation.errors 
      }, { status: 400 });
    }
    
    const { intentId } = validation.request!;
    
    // Get intent
    const intent = await prisma.intent.findUnique({
      where: { id: intentId }
    });
    
    if (!intent) {
      return NextResponse.json({ 
        error: 'Intent not found' 
      }, { status: 404 });
    }
    
    // Check if already simulated recently (within 30 seconds)
    const recentSimulation = await prisma.intentReceipt.findFirst({
      where: {
        intentId,
        status: 'simulated',
        createdAt: {
          gte: new Date(Date.now() - 30 * 1000) // 30 seconds ago
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (recentSimulation) {
      const simData = JSON.parse(recentSimulation.simJson || '{}');
      return NextResponse.json({
        success: true,
        simulation: simData,
        cached: true,
        message: 'Using recent simulation'
      });
    }
    
    // Get wallet snapshot
    const walletSnapshot = await getWalletSnapshot(intent.walletId);
    if (!walletSnapshot) {
      return NextResponse.json({ 
        error: 'Wallet snapshot not found' 
      }, { status: 404 });
    }
    
    // Prepare simulation data
    const intentData = {
      base: intent.base,
      quote: intent.quote,
      side: intent.side as 'BUY' | 'SELL',
      sizeJson: JSON.parse(intent.sizeJson),
      guardsJson: JSON.parse(intent.guardsJson)
    };
    
    // Run simulation
    const simulationResult = await simulateIntent(intentData, walletSnapshot);
    
    // Create receipt
    await createReceipt(intentId, 'simulated', simulationResult, 'Simulation completed');
    
    // Get historical accuracy
    const historicalAccuracy = await getHistoricalAccuracy(intent.base, intent.quote);
    
    return NextResponse.json({
      success: true,
      simulation: simulationResult,
      historicalAccuracy,
      message: 'Simulation completed successfully'
    });
    
  } catch (error) {
    console.error('Simulate intent error:', error);
    
    // Create failed receipt
    try {
      const body = await request.json();
      const validation = validateSimulateIntent(body);
      if (validation.valid) {
        await createReceipt(validation.request!.intentId, 'failed', null, `Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (receiptError) {
      console.error('Failed to create error receipt:', receiptError);
    }
    
    return NextResponse.json(
      { error: 'Simulation failed' },
      { status: 500 }
    );
  }
}

/**
 * Get wallet snapshot for simulation
 */
async function getWalletSnapshot(walletId: string) {
  try {
    // Get latest holdings snapshot
    const snapshot = await prisma.holdingSnapshot.findFirst({
      where: { walletId },
      orderBy: { ts: 'desc' }
    });
    
    if (!snapshot) {
      return null;
    }
    
    // Get all holdings for this wallet
    const holdings = await prisma.holdingSnapshot.findMany({
      where: { 
        walletId,
        ts: snapshot.ts // Same timestamp
      }
    });
    
    const totalValueUsd = holdings.reduce((sum, h) => sum + parseFloat(h.valueUsd), 0);
    
    return {
      walletId,
      timestamp: snapshot.ts.toISOString(),
      totalValueUsd,
      holdings: holdings.map(h => ({
        asset: h.asset,
        symbol: h.asset, // Simplified
        amount: parseFloat(h.amount),
        valueUsd: parseFloat(h.valueUsd)
      }))
    };
  } catch (error) {
    console.error('Failed to get wallet snapshot:', error);
    return null;
  }
}
