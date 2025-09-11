import { NextRequest, NextResponse } from 'next/server';
import { trackReceiptShare } from '../../lib/trial';
import { getWalletIdentifier } from '../../lib/wallet';
import { isFeatureEnabled } from '../../lib/flags';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Check if Pro trials are enabled
    if (!isFeatureEnabled('PRO_TRIALS')) {
      return NextResponse.json({ 
        success: true,
        message: 'Trial tracking not enabled' 
      });
    }

    const walletId = getWalletIdentifier(request);
    if (!walletId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Wallet not found' 
      }, { status: 401 });
    }

    const { intentId, platform, shareUrl } = await request.json();
    
    if (!intentId || !platform) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { status: 400 });
    }

    await trackReceiptShare(walletId, intentId, platform, shareUrl);
    
    return NextResponse.json({ 
      success: true,
      message: 'Share tracked successfully' 
    });
  } catch (error) {
    console.error('Track share error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
