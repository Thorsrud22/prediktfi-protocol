import { NextRequest, NextResponse } from 'next/server';
import { checkQuota } from '../../../lib/subscription';
import { getWalletIdentifier } from '../../../lib/wallet';
import { isFeatureEnabled } from '../../../lib/flags';
import { QuotaType } from '@prisma/client';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Check if quota system is enabled
    if (!isFeatureEnabled('QUOTA_SYSTEM')) {
      return NextResponse.json({ allowed: true, remaining: 999999 });
    }

    const walletId = getWalletIdentifier(request);
    if (!walletId) {
      return NextResponse.json({ 
        allowed: false, 
        error: 'Wallet not found' 
      }, { status: 401 });
    }

    const { quotaType, amount = 1 } = await request.json();
    
    if (!quotaType || !Object.values(QuotaType).includes(quotaType)) {
      return NextResponse.json({ 
        allowed: false, 
        error: 'Invalid quota type' 
      }, { status: 400 });
    }

    const result = await checkQuota(walletId, quotaType, amount);
    
    return NextResponse.json({
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: result.resetAt,
    });
  } catch (error) {
    console.error('Quota check error:', error);
    return NextResponse.json({ 
      allowed: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
