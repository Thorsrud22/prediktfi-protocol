/**
 * Invite Codes API
 * GET /api/invite-codes - Get available invite codes
 * POST /api/invite-codes - Create new invite codes (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isFeatureEnabled } from '@/lib/flags';

export async function GET(request: NextRequest) {
  try {
    // Check if invite codes feature is enabled
    if (!isFeatureEnabled('INVITE_CODES')) {
      return NextResponse.json({ error: 'Invite codes feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
      // Validate specific invite code
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

      return NextResponse.json({
        success: true,
        code: inviteCode.code,
        usedCount: inviteCode.usedCount,
        maxUses: inviteCode.maxUses,
        remainingUses: inviteCode.maxUses - inviteCode.usedCount
      });
    }

    // Get all active invite codes (for admin dashboard)
    const inviteCodes = await prisma.inviteCode.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({
      success: true,
      codes: inviteCodes.map(code => ({
        id: code.id,
        code: code.code,
        usedCount: code.usedCount,
        maxUses: code.maxUses,
        remainingUses: code.maxUses - code.usedCount,
        createdAt: code.createdAt,
        expiresAt: code.expiresAt
      }))
    });

  } catch (error) {
    console.error('Invite codes API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if invite codes feature is enabled
    if (!isFeatureEnabled('INVITE_CODES')) {
      return NextResponse.json({ error: 'Invite codes feature not enabled' }, { status: 403 });
    }

    const body = await request.json();
    const { count = 1, maxUses = 100, expiresInDays } = body;

    // Generate invite codes
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = generateInviteCode();
      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      codes.push({
        code,
        maxUses,
        expiresAt
      });
    }

    // Create codes in database
    const createdCodes = await prisma.inviteCode.createMany({
      data: codes
    });

    return NextResponse.json({
      success: true,
      created: createdCodes.count,
      codes: codes.map(c => c.code)
    });

  } catch (error) {
    console.error('Create invite codes error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create invite codes'
    }, { status: 500 });
  }
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
