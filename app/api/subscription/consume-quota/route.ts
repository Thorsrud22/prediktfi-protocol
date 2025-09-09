import { NextRequest, NextResponse } from 'next/server';
import { consumeQuota } from '../../../lib/subscription';
import { getWalletIdentifier } from '../../../lib/wallet';
import { isFeatureEnabled } from '../../lib/flags';
import { QuotaType } from '@prisma/client';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Check if quota system is enabled
    if (!isFeatureEnabled('QUOTA_SYSTEM')) {
      return NextResponse.json({ success: true });
    }

    const walletId = getWalletIdentifier(request);
    if (!walletId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Wallet not found' 
      }, { status: 401 });
    }

    const { quotaType, amount = 1 } = await request.json();
    
    if (!quotaType || !Object.values(QuotaType).includes(quotaType)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid quota type' 
      }, { status: 400 });
    }

    const success = await consumeQuota(walletId, quotaType, amount);
    
    if (!success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Quota exceeded' 
      }, { status: 429 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Quota consumption error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
