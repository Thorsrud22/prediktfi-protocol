import { NextRequest, NextResponse } from 'next/server';
import { getTrialStatus } from '@/lib/trial';
import { getWalletIdentifier } from '@/lib/wallet';
import { isFeatureEnabled } from '@/lib/flags';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Check if Pro trials are enabled
    if (!isFeatureEnabled('PRO_TRIALS')) {
      return NextResponse.json({ 
        isOnTrial: false 
      });
    }

    const walletId = getWalletIdentifier(request);
    if (!walletId) {
      return NextResponse.json({ 
        isOnTrial: false 
      });
    }

    const status = await getTrialStatus(walletId);
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('Trial status error:', error);
    return NextResponse.json({ 
      isOnTrial: false 
    });
  }
}
