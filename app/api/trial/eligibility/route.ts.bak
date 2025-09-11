import { NextRequest, NextResponse } from 'next/server';
import { checkTrialEligibility } from '../../lib/trial';
import { getWalletIdentifier } from '../../lib/wallet';
import { isFeatureEnabled } from '../../lib/flags';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Check if Pro trials are enabled
    if (!isFeatureEnabled('PRO_TRIALS')) {
      return NextResponse.json({ 
        canStart: false, 
        reason: 'Pro trials not available' 
      });
    }

    const walletId = getWalletIdentifier(request);
    if (!walletId) {
      return NextResponse.json({ 
        canStart: false, 
        reason: 'Wallet not found' 
      }, { status: 401 });
    }

    const eligibility = await checkTrialEligibility(walletId);
    
    return NextResponse.json(eligibility);
  } catch (error) {
    console.error('Trial eligibility error:', error);
    return NextResponse.json({ 
      canStart: false, 
      reason: 'Internal server error' 
    }, { status: 500 });
  }
}
