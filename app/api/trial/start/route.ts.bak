import { NextRequest, NextResponse } from 'next/server';
import { startTrialFromSharing } from '../../lib/trial';
import { getWalletIdentifier } from '../../lib/wallet';
import { isFeatureEnabled } from '../../lib/flags';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Check if Pro trials are enabled
    if (!isFeatureEnabled('PRO_TRIALS')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Pro trials not available' 
      });
    }

    const walletId = getWalletIdentifier(request);
    if (!walletId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Wallet not found' 
      }, { status: 401 });
    }

    const result = await startTrialFromSharing(walletId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Trial start error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
