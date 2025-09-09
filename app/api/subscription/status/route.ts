import { NextRequest, NextResponse } from 'next/server';
import { getUserSubscription } from '../../../lib/subscription';
import { getWalletIdentifier } from '../../../lib/wallet';
import { isFeatureEnabled } from '../../lib/flags';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Check if monetization is enabled
    if (!isFeatureEnabled('MONETIZATION')) {
      return NextResponse.json({ 
        tier: 'free', 
        isPro: false, 
        quotas: null 
      });
    }

    const walletId = getWalletIdentifier(request);
    if (!walletId) {
      return NextResponse.json({ 
        tier: 'free', 
        isPro: false, 
        quotas: null 
      });
    }

    const subscription = await getUserSubscription(walletId);
    
    return NextResponse.json({
      tier: subscription.tier.toLowerCase(),
      isPro: subscription.isPro,
      isTrial: subscription.isTrial,
      trialEndsAt: subscription.trialEndsAt,
      quotas: subscription.quotas,
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json({ 
      tier: 'free', 
      isPro: false, 
      quotas: null 
    });
  }
}
