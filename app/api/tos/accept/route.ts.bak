/**
 * Terms of Service acceptance API
 * POST /api/tos/accept
 */

import { NextRequest, NextResponse } from 'next/server';
import { geofencingService } from '../../../lib/geofencing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tosVersion } = body;

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check if ToS version matches current version
    const currentVersion = geofencingService.getCurrentToSVersion();
    if (tosVersion && tosVersion !== currentVersion) {
      return NextResponse.json({
        error: 'Outdated Terms of Service version',
        currentVersion,
        providedVersion: tosVersion
      }, { status: 400 });
    }

    // Check geofencing first
    const locationCheck = await geofencingService.checkLocationAllowed(clientIP);
    if (!locationCheck.allowed) {
      return NextResponse.json({
        error: 'Actions not available in your location',
        reason: locationCheck.reason,
        location: locationCheck.location
      }, { status: 403 });
    }

    // Record ToS acceptance
    geofencingService.recordToSAcceptance(userId, clientIP, userAgent);

    return NextResponse.json({
      success: true,
      message: 'Terms of Service accepted',
      version: currentVersion,
      location: locationCheck.location
    });

  } catch (error) {
    console.error('ToS acceptance error:', error);
    return NextResponse.json(
      { error: 'Failed to accept Terms of Service' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // Check if user has accepted ToS
    const hasAccepted = geofencingService.hasAcceptedToS(userId);
    const currentVersion = geofencingService.getCurrentToSVersion();
    const tosText = geofencingService.getToSText();

    return NextResponse.json({
      hasAccepted,
      currentVersion,
      tosText: hasAccepted ? undefined : tosText // Only send ToS text if not accepted
    });

  } catch (error) {
    console.error('ToS check error:', error);
    return NextResponse.json(
      { error: 'Failed to check Terms of Service status' },
      { status: 500 }
    );
  }
}
