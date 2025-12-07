import { NextRequest, NextResponse } from 'next/server';
import { getTrialStatus } from '@/lib/trial';
import { isFeatureEnabled } from '@/lib/flags';

export const runtime = 'nodejs';

/**
 * Internal API for trial status - called by Edge proxy
 * Not intended for direct client access
 */
export async function GET(request: NextRequest) {
    try {
        // Verify internal call (simple check - in production use proper auth)
        const internalKey = request.headers.get('x-internal-key');
        if (internalKey !== process.env.INTERNAL_API_KEY && process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if Pro trials are enabled
        if (!isFeatureEnabled('PRO_TRIALS')) {
            return NextResponse.json({ isOnTrial: false });
        }

        const walletId = request.nextUrl.searchParams.get('walletId');
        if (!walletId) {
            return NextResponse.json({ isOnTrial: false });
        }

        const status = await getTrialStatus(walletId);
        return NextResponse.json(status);
    } catch (error) {
        console.error('Internal trial status error:', error);
        return NextResponse.json({ isOnTrial: false });
    }
}
