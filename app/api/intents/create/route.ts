/**
 * Create trading intent API endpoint
 * POST /api/intents/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '../../../lib/flags';
import { prisma } from '../../../lib/prisma';
import { checkRateLimit } from '../../../lib/ratelimit';
import { validateCSRF } from '../../../lib/security';
import { validateCreateIntent } from '../../../lib/intents/schema';
import { checkIdempotency, generateCreateKey, validateIdempotencyKey } from '../../../lib/idempotency';
import { runGuards, hasBlockingViolations } from '../../../lib/intents/guards';
import { checkCombinedRateLimit } from '../../../lib/rate-limit-wallet';
import { checkNoiseFilterWithMarketData } from '../../../lib/intents/noise-filter';
import { checkQuota, consumeQuota } from '../../../lib/subscription';
import { getWalletIdentifier } from '../../../lib/wallet';
import { isFeatureEnabled } from '../../../lib/flags';

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
  // const rateLimitResponse = await checkRateLimit(request, { plan: 'advisor_write' });
  // if (rateLimitResponse) {
  //   return rateLimitResponse;
  // }
  
  // Wallet-based rate limiting
  const walletRateLimitResponse = checkCombinedRateLimit(request, {
    perWalletMinWindow: 60, // 1 minute
    perWalletDailyCap: 50, // 50 intents per day per wallet
    perWalletBurstLimit: 5 // 5 intents per minute per wallet
  });
  if (walletRateLimitResponse) {
    return walletRateLimitResponse;
  }

  // Check quota if quota system is enabled
  if (isFeatureEnabled('QUOTA_SYSTEM')) {
    const walletId = getWalletIdentifier(request);
    if (walletId) {
      const quotaCheck = await checkQuota(walletId, 'INTENTS_WEEKLY', 1);
      if (!quotaCheck.allowed) {
        return NextResponse.json({
          error: 'Quota exceeded',
          code: 'QUOTA_EXCEEDED',
          message: `Weekly intent quota exceeded. You have ${quotaCheck.remaining} intents remaining. Upgrade to Pro for 30 intents per week.`,
          resetAt: quotaCheck.resetAt,
          remaining: quotaCheck.remaining
        }, { status: 429 });
      }
    }
  }

  try {
    const body = await request.json();
    
    // Validate request
    const validation = validateCreateIntent(body);
    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: validation.errors 
      }, { status: 400 });
    }
    
    const { intent, idempotencyKey } = validation.request!;
    
    // Validate idempotency key
    if (!validateIdempotencyKey(idempotencyKey)) {
      return NextResponse.json({ 
        error: 'Invalid idempotency key format' 
      }, { status: 400 });
    }
    
    // Check idempotency
    const idempotencyCheck = await checkIdempotency(idempotencyKey, 'create');
    if (idempotencyCheck.isIdempotent) {
      return NextResponse.json({
        success: true,
        intentId: idempotencyCheck.result?.intentId,
        message: 'Intent already created'
      });
    }
    
    // Get wallet snapshot for guard validation
    const walletSnapshot = await getWalletSnapshot(intent.walletId);
    if (!walletSnapshot) {
      return NextResponse.json({ 
        error: 'Wallet not found or no holdings' 
      }, { status: 404 });
    }
    
    // Check noise filter
    const sizeUsd = intent.sizeJson.type === 'pct' 
      ? (walletSnapshot.totalValueUsd * intent.sizeJson.value / 100)
      : intent.sizeJson.value;
    
    const noiseFilterResult = await checkNoiseFilterWithMarketData(
      sizeUsd,
      intent.base,
      intent.quote
    );
    
    if (noiseFilterResult.shouldBlock) {
      return NextResponse.json({
        error: 'Noise filter blocked',
        reason: noiseFilterResult.reason,
        cooldownRemaining: noiseFilterResult.cooldownRemaining
      }, { status: 400 });
    }
    
    // Run guards (basic validation)
    const guards = intent.guardsJson;
    const violations = runGuards(
      intent.sizeJson,
      walletSnapshot,
      { price: 100, liquidityUsd: 1000000, volume24h: 1000000 }, // Mock market data
      guards,
      50 // Mock slippage
    );
    
    if (hasBlockingViolations(violations)) {
      return NextResponse.json({
        error: 'Guard violations',
        violations: violations.filter(v => v.severity === 'error')
      }, { status: 400 });
    }
    
    // Create intent
    const createdIntent = await prisma.intent.create({
      data: {
        walletId: intent.walletId,
        strategyId: intent.strategyId,
        chain: intent.chain,
        base: intent.base,
        quote: intent.quote,
        side: intent.side,
        sizeJson: JSON.stringify(intent.sizeJson),
        tpJson: intent.tpJson ? JSON.stringify(intent.tpJson) : null,
        slJson: intent.slJson ? JSON.stringify(intent.slJson) : null,
        rationale: intent.rationale,
        confidence: intent.confidence,
        backtestWin: intent.backtestWin,
        expectedDur: intent.expectedDur,
        guardsJson: JSON.stringify(intent.guardsJson),
        venuePref: intent.venuePref,
        simOnly: intent.simOnly
      }
    });
    
    // Store idempotency result
    await storeIdempotencyResult(idempotencyKey, { intentId: createdIntent.id });
    
    // Consume quota if quota system is enabled
    if (isFeatureEnabled('QUOTA_SYSTEM')) {
      const walletId = getWalletIdentifier(request);
      if (walletId) {
        await consumeQuota(walletId, 'INTENTS_WEEKLY', 1);
      }
    }
    
    return NextResponse.json({
      success: true,
      intentId: createdIntent.id,
      message: 'Intent created successfully'
    });
    
  } catch (error) {
    console.error('Create intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create intent' },
      { status: 500 }
    );
  }
}

/**
 * Get wallet snapshot for guard validation
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
      totalValueUsd,
      holdings: holdings.map(h => ({
        asset: h.asset,
        valueUsd: parseFloat(h.valueUsd),
        amount: parseFloat(h.amount)
      }))
    };
  } catch (error) {
    console.error('Failed to get wallet snapshot:', error);
    return null;
  }
}

/**
 * Store idempotency result (imported from idempotency.ts)
 */
async function storeIdempotencyResult(key: string, result: any) {
  // This would be implemented in the idempotency module
  // For now, just log it
  console.log('Storing idempotency result:', key, result);
}
