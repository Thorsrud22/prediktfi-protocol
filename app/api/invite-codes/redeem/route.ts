/**
 * Invite Code Redemption API
 * POST /api/invite-codes/redeem - Redeem an invite code and set session cookie
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'predikt-access-secret-change-in-production'
);

export async function POST(request: NextRequest) {
    try {
        const { code } = await request.json();

        if (!code || typeof code !== 'string') {
            return NextResponse.json(
                { error: 'Invite code is required' },
                { status: 400 }
            );
        }

        const normalizedCode = code.trim().toUpperCase();

        // Find the invite code
        const inviteCode = await prisma.inviteCode.findUnique({
            where: { code: normalizedCode },
        });

        if (!inviteCode) {
            return NextResponse.json(
                { error: 'Invalid invite code' },
                { status: 404 }
            );
        }

        if (!inviteCode.isActive) {
            return NextResponse.json(
                { error: 'This invite code is no longer active' },
                { status: 400 }
            );
        }

        if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
            return NextResponse.json(
                { error: 'This invite code has expired' },
                { status: 400 }
            );
        }

        if (inviteCode.usedCount >= inviteCode.maxUses) {
            return NextResponse.json(
                { error: 'This invite code has already been used' },
                { status: 400 }
            );
        }

        // Burn the code (increment usedCount)
        await prisma.inviteCode.update({
            where: { id: inviteCode.id },
            data: { usedCount: inviteCode.usedCount + 1 },
        });

        // Create JWT token
        const token = await new SignJWT({
            type: 'access',
            code: normalizedCode,
            redeemedAt: new Date().toISOString(),
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('30d')
            .sign(JWT_SECRET);

        // Set HTTP-only cookie
        const response = NextResponse.json({
            success: true,
            message: 'Access granted',
        });

        response.cookies.set('predikt_access', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Invite code redemption error:', error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}
