import { NextRequest, NextResponse } from 'next/server';
import { parseAndVerify } from '../../../lib/license';
import { fetchChargeById, isMockMode } from '../../../lib/coinbase';
import { trackServer } from '../../../lib/analytics';
import { setProCookie } from '../../../lib/plan';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    let license: string | undefined;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      license = body?.license;
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      license = String(form.get('license') || '');
    } else {
      // best-effort try json then form
      try {
        const body = await request.json();
        license = body?.license;
      } catch {
        const form = await request.formData();
        license = String(form.get('license') || '');
      }
    }

    if (!license || typeof license !== 'string') {
      return NextResponse.json({ ok: false, message: 'Invalid or missing license' }, { status: 400 });
    }

    const verified = parseAndVerify(license);
    if (!verified.ok || !verified.chargeId) {
      return NextResponse.json({ ok: false, message: verified.error || 'Invalid license' }, { status: 400 });
    }

    // Optional fast re-check with Coinbase when not in mock mode
    if (!isMockMode()) {
      try {
        const charge = await fetchChargeById(verified.chargeId);
        const status: string | undefined = charge?.timeline?.[charge.timeline.length - 1]?.status || charge?.status;
        const acceptable = status === 'CONFIRMED' || status === 'RESOLVED' || status === 'confirmed' || status === 'resolved';
        if (!acceptable) {
          return NextResponse.json({ ok: false, message: 'Charge not confirmed yet' }, { status: 400 });
        }
      } catch (e: any) {
        // If the check fails, fail closed
        return NextResponse.json({ ok: false, message: 'Verification failed' }, { status: 400 });
      }
    }

    const res = NextResponse.json({ ok: true });
    
    // Set production-secure Pro cookie
    setProCookie(res, 'pro');
    
    // Track successful license redemption and pro activation
    trackServer('license_redeemed', { source: 'success' });
    trackServer('pro_activated');
    
    return res;
  } catch (error) {
    return NextResponse.json({ ok: false, message: 'redeem_failed' }, { status: 500 });
  }
}
