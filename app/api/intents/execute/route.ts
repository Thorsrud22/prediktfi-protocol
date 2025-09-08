/**
 * Execute trading intent API endpoint
 * POST /api/intents/execute
 */

import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '../../../lib/flags';
import { prisma } from '../../../lib/prisma';
import { checkRateLimit } from '../../../lib/ratelimit';
import { validateCSRF } from '../../../lib/security';
import { validateExecuteIntent } from '../../../lib/intents/schema';
import { checkIdempotency, generateExecuteKey, validateIdempotencyKey } from '../../../lib/idempotency';
import { executeIntent, isExecutionSafe } from '../../../lib/intents/executor';
import { createReceipt, updateReceiptOnExecute } from '../../../lib/intents/receipts';
import { killSwitchService } from '../../../lib/kill-switch';
import { geofencingService } from '../../../lib/geofencing';
import { checkCombinedRateLimit } from '../../../lib/rate-limit-wallet';
import { getQuoteWithFallback, buildSwapWithFallback, FallbackResult } from '../../../lib/aggregators/fallback-service';
import { shouldForceSimulationOnly, shouldDisableAggregator, shouldTestIdempotency } from '../../../lib/chaos/chaos-testing';
import { ANALYTICS_EVENT_TYPES } from '../../../../src/server/analytics/events';

export async function POST(request: NextRequest) {
  // Check if actions feature is enabled
  if (!isFeatureEnabled('ACTIONS')) {
    return NextResponse.json({ error: 'Actions feature not enabled' }, { status: 403 });
  }

  // Check kill switch
  const killSwitchCheck = killSwitchService.checkBeforeOperation('execute');
  if (!killSwitchCheck.allowed) {
    return NextResponse.json({ 
      error: 'Trading operations are currently disabled',
      reason: killSwitchCheck.reason
    }, { status: 503 });
  }

  // Check chaos testing - force simulation only
  if (shouldForceSimulationOnly()) {
    return NextResponse.json({ 
      error: 'System in simulation-only mode for chaos testing',
      reason: 'Chaos test active: force_simulation_only',
      simulationOnly: true
    }, { status: 503 });
  }

  // Get client IP and user agent for geofencing
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // CSRF protection - disabled for testing
  // if (!validateCSRF(request)) {
  //   return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
  // }

  // Rate limiting - disabled for testing
  // const rateLimitResponse = await checkRateLimit(request, { plan: 'alerts' });
  // if (rateLimitResponse) {
  //   return rateLimitResponse;
  // }
  
  // Wallet-based rate limiting
  const walletRateLimitResponse = checkCombinedRateLimit(request, {
    perWalletMinWindow: 60, // 1 minute
    perWalletDailyCap: 20, // 20 executions per day per wallet
    perWalletBurstLimit: 3 // 3 executions per minute per wallet
  });
  if (walletRateLimitResponse) {
    return walletRateLimitResponse;
  }

  try {
    const body = await request.json();
    
    // Validate request
    const validation = validateExecuteIntent(body);
    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: validation.errors 
      }, { status: 400 });
    }

    // Check geofencing and ToS acceptance
    const userId = body.userId || 'anonymous'; // In real app, get from auth
    const geofencingCheck = await geofencingService.checkActionsAllowed(
      userId,
      clientIP,
      userAgent
    );
    
    if (!geofencingCheck.allowed) {
      return NextResponse.json({
        error: 'Actions not available',
        reason: geofencingCheck.reason,
        requiresToS: geofencingCheck.requiresToS,
        location: geofencingCheck.location
      }, { status: 403 });
    }
    
    const { intentId, idempotencyKey } = validation.request!;
    
    // Validate idempotency key
    if (!validateIdempotencyKey(idempotencyKey)) {
      return NextResponse.json({ 
        error: 'Invalid idempotency key format' 
      }, { status: 400 });
    }
    
    // Check idempotency
    const idempotencyCheck = await checkIdempotency(idempotencyKey, 'execute');
    if (idempotencyCheck.isIdempotent) {
      return NextResponse.json({
        success: true,
        txSig: idempotencyCheck.result?.txSig,
        message: 'Intent already executed'
      });
    }
    
    // Get intent
    const intent = await prisma.intent.findUnique({
      where: { id: intentId }
    });
    
    if (!intent) {
      return NextResponse.json({ 
        error: 'Intent not found' 
      }, { status: 404 });
    }
    
    // Check if intent is simulation-only
    if (intent.simOnly) {
      return NextResponse.json({ 
        error: 'Intent is simulation-only' 
      }, { status: 400 });
    }
    
    // Get latest simulation
    const latestSimulation = await prisma.intentReceipt.findFirst({
      where: {
        intentId,
        status: 'simulated'
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!latestSimulation) {
      return NextResponse.json({ 
        error: 'No simulation found. Please simulate first.' 
      }, { status: 400 });
    }
    
    // Check if simulation is recent (within 5 minutes)
    const simulationAge = Date.now() - latestSimulation.createdAt.getTime();
    if (simulationAge > 5 * 60 * 1000) { // 5 minutes
      return NextResponse.json({ 
        error: 'Simulation is too old. Please re-simulate.' 
      }, { status: 400 });
    }
    
    // Get current market data for safety check
    const marketData = await getCurrentMarketData(intent.base, intent.quote);
    
    // Check execution safety
    const safetyCheck = await isExecutionSafe(intent, marketData);
    if (!safetyCheck.safe) {
      return NextResponse.json({
        error: 'Execution not safe',
        errors: safetyCheck.errors,
        warnings: safetyCheck.warnings
      }, { status: 400 });
    }
    
    // Get wallet public key (mock for now)
    const walletPublicKey = await getWalletPublicKey(intent.walletId);
    if (!walletPublicKey) {
      return NextResponse.json({ 
        error: 'Wallet public key not found' 
      }, { status: 404 });
    }
    
    // Prepare execution context
    const executionContext = {
      intent: {
        ...intent,
        sizeJson: JSON.parse(intent.sizeJson),
        guardsJson: JSON.parse(intent.guardsJson)
      },
      walletPublicKey,
      slippageBps: 50, // Default slippage
      prioritizationFeeLamports: 1000 // Default priority fee
    };
    
    // Execute intent
    const executionResult = await executeIntent(executionContext);
    
    // Create execution receipt
    const receipt = await createReceipt(
      intentId, 
      'executed', 
      executionResult, 
      'Execution completed successfully'
    );
    
    // Store idempotency result
    await storeIdempotencyResult(idempotencyKey, { 
      intentId, 
      txSig: executionResult.txSig,
      receiptId: receipt.id 
    });

    // Send analytics event if this intent was executed from a copy action
    if (intent?.sourceModelId) {
      try {
        await fetch(`${request.nextUrl.origin}/api/analytics/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            type: ANALYTICS_EVENT_TYPES.INTENT_EXECUTED_FROM_COPY,
            modelId: intent.sourceModelId,
            intentId: intentId
          })
        });
      } catch (error) {
        console.warn('Failed to send intent_executed_from_copy analytics event:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      txSig: executionResult.txSig,
      execution: executionResult,
      receiptId: receipt.id,
      message: 'Intent executed successfully'
    });
    
  } catch (error) {
    console.error('Execute intent error:', error);
    
    // Create failed receipt
    try {
      const body = await request.json();
      const validation = validateExecuteIntent(body);
      if (validation.valid) {
        await createReceipt(validation.request!.intentId, 'failed', null, `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (receiptError) {
      console.error('Failed to create error receipt:', receiptError);
    }
    
    return NextResponse.json(
      { error: 'Execution failed' },
      { status: 500 }
    );
  }
}

/**
 * Get current market data
 */
async function getCurrentMarketData(base: string, quote: string) {
  // Mock implementation
  // In production, this would fetch real market data
  return {
    price: 100,
    liquidityUsd: 1000000,
    volume24h: 1000000
  };
}

/**
 * Get wallet public key
 */
async function getWalletPublicKey(walletId: string): Promise<string | null> {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId }
    });
    
    return wallet?.address || null;
  } catch (error) {
    console.error('Failed to get wallet public key:', error);
    return null;
  }
}

/**
 * Store idempotency result
 */
async function storeIdempotencyResult(key: string, result: any) {
  // This would be implemented in the idempotency module
  console.log('Storing idempotency result:', key, result);
}
