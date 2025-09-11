/**
 * Use Invite Code API
 * POST /api/invite-codes/use - Use an invite code
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { isFeatureEnabled } from '../../../../lib/flags';

export async function POST(request: NextRequest) {
  try {
    // Check if invite codes feature is enabled
    if (!isFeatureEnabled('INVITE_CODES')) {
      return NextResponse.json({ error: 'Invite codes feature not enabled' }, { status: 403 });
    }

    const body = await request.json();
    const { code, walletId } = body;

    if (!code || !walletId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Code and walletId are required' 
      }, { status: 400 });
    }

    // Find and validate invite code
    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code }
    });

    if (!inviteCode) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid invite code' 
      }, { status: 404 });
    }

    if (!inviteCode.isActive) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invite code is no longer active' 
      }, { status: 400 });
    }

    if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invite code has expired' 
      }, { status: 400 });
    }

    if (inviteCode.usedCount >= inviteCode.maxUses) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invite code has reached maximum uses' 
      }, { status: 400 });
    }

    // Increment usage count
    const updatedCode = await prisma.inviteCode.update({
      where: { id: inviteCode.id },
      data: { usedCount: inviteCode.usedCount + 1 }
    });

    // Track the usage event
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/analytics/track-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId,
          eventType: 'invite_code_used',
          eventData: { 
            code: inviteCode.code,
            usedCount: updatedCode.usedCount,
            maxUses: inviteCode.maxUses
          }
        })
      });
    } catch (error) {
      console.warn('Failed to track invite code usage:', error);
    }

    return NextResponse.json({
      success: true,
      code: inviteCode.code,
      usedCount: updatedCode.usedCount,
      maxUses: inviteCode.maxUses,
      remainingUses: inviteCode.maxUses - updatedCode.usedCount
    });

  } catch (error) {
    console.error('Use invite code error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to use invite code' 
    }, { status: 500 });
  }
}
