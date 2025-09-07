/**
 * Analytics Event Tracking API
 * POST /api/analytics/track-event
 * Tracks user events for PMF analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { PMFTracker } from '../../../lib/analytics/pmf-tracker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletId, eventType, eventData, sessionId, userAgent, referrer } = body;

    if (!walletId || !eventType) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: walletId, eventType'
      }, { status: 400 });
    }

    // Track the event
    await PMFTracker.trackEvent(
      walletId,
      eventType,
      eventData,
      sessionId,
      userAgent || request.headers.get('user-agent') || undefined,
      referrer || request.headers.get('referer') || undefined
    );

    // Update user retention for action events
    if (['simulate_intent', 'sign_intent', 'share_receipt'].includes(eventType)) {
      await PMFTracker.updateUserRetention(walletId, true);
    }

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully'
    });

  } catch (error) {
    console.error('Failed to track event:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to track event',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
