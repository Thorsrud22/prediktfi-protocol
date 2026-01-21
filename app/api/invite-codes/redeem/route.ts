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

// EMERGENCY BYPASS CODES (Skip DB check)
const BYPASS_CODES = [
    'PREDIKT-BETA',
    'ALPHA-ALPHA',
    'PREDIKT-LAUNCH-01',
    'PREDIKT-LAUNCH-02',
    'PREDIKT-LAUNCH-03',
    'PREDIKT-LAUNCH-04',
    'PREDIKT-LAUNCH-05',
    'PREDIKT-LAUNCH-06',
    'PREDIKT-LAUNCH-07',
    'PREDIKT-LAUNCH-08',
    'PREDIKT-LAUNCH-09',
    'PREDIKT-LAUNCH-10'
];

export async function POST(request: NextRequest) {
    try {
        const { code } = await request.json();

        // Get IP for abuse prevention & session recovery

        const forwarded = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const cfConnectingIp = request.headers.get('cf-connecting-ip');
        const ipAddress = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        if (!code || typeof code !== 'string') {
            return NextResponse.json(
                { error: 'Invite code is required' },
                { status: 400 }
            );
        }

        const normalizedCode = code.trim().toUpperCase();

        // --- EMERGENCY BYPASS CHECK ---
        if (BYPASS_CODES.includes(normalizedCode)) {
            console.log(`🔓 Bypassing DB for code ${normalizedCode}`);

            // Create JWT token directly (skipping DB)
            const token = await new SignJWT({
                type: 'access',
                code: normalizedCode,
                redeemedAt: new Date().toISOString(),
                recovered: false
            })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('30d')
                .sign(JWT_SECRET);

            const response = NextResponse.json({
                success: true,
                message: 'Access granted (Bypass)',
            });

            response.cookies.set('predikt_access', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60,
                path: '/',
            });

            response.cookies.set('predikt_auth_status', '1', {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60,
                path: '/',
            });

            return response;
        }

        // Find the invite code
        const inviteCode = await prisma.inviteCode.findUnique({
            where: { code: normalizedCode },
            include: { redemptions: true }
        });

        if (!inviteCode) {
            return NextResponse.json(
                { error: 'Invalid invite code' },
                { status: 404 }
            );
        }

        // --- IP-BASED SESSION RECOVERY ---
        // Check if this IP has already redeemed this code recently (last 24h)
        // If so, we re-issue the token without incrementing the usage count.
        const existingRedemption = await prisma.inviteRedemption.findFirst({
            where: {
                inviteCodeId: inviteCode.id,
                ipAddress: ipAddress,
                expiresAt: { gt: new Date() } // Still within recovery window
            }
        });

        let isRecovery = false;

        if (existingRedemption) {
            // Allow re-entry!
            isRecovery = true;
            console.log(`♻️ Session recovery for IP ${ipAddress} on code ${normalizedCode}`);
        } else {
            // --- STANDARD VALIDATION ---
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
            // AND create a redemption record for recovery
            const recoveryExpiry = new Date();
            recoveryExpiry.setDate(recoveryExpiry.getDate() + 1); // 24h recovery window

            await prisma.$transaction([
                prisma.inviteCode.update({
                    where: { id: inviteCode.id },
                    data: { usedCount: inviteCode.usedCount + 1 },
                }),
                prisma.inviteRedemption.create({
                    data: {
                        inviteCodeId: inviteCode.id,
                        ipAddress: ipAddress,
                        userAgent: userAgent,
                        expiresAt: recoveryExpiry
                    }
                })
            ]);
        }

        // Create JWT token
        const token = await new SignJWT({
            type: 'access',
            code: normalizedCode,
            redeemedAt: new Date().toISOString(),
            recovered: isRecovery
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('30d')
            .sign(JWT_SECRET);

        // Set HTTP-only cookie
        const response = NextResponse.json({
            success: true,
            message: isRecovery ? 'Access recovered' : 'Access granted',
        });

        response.cookies.set('predikt_access', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
        });

        // Set a public cookie for client-side UI state (not for security)
        response.cookies.set('predikt_auth_status', '1', {
            httpOnly: false, // Allow client JS to read this
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60,
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('[InviteRedeem] Critical error:', error);

        // --- FAILSAFE FALLBACK ---
        // If DB fails (e.g. SQLite on Vercel), check against known active codes.
        try {
            const FAILSAFE_CODES = new Set([
                'PREDIKT-BETA', 'ALPHA-ALPHA',
                '7WQQY1OW', 'Q9BTGK8Q', 'WJHRJ3VB', 'PJ145VEQ', 'P2BE3UIS',
                '72W9Z05K', 'STVRK1RT', '7J9BFEG2', 'G1VB74EK', 'POUDX7LN'
            ]);

            const body = await request.clone().json().catch(() => ({}));
            const code = body.code?.trim()?.toUpperCase();

            if (code && FAILSAFE_CODES.has(code)) {
                console.log(`🛡️ Failsafe access granted for code ${code}`);
                const token = await new SignJWT({
                    type: 'access', code, redeemedAt: new Date().toISOString(), recovered: false, failsafe: true
                }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('30d').sign(JWT_SECRET);

                const response = NextResponse.json({ success: true, message: 'Access granted (Recovery)' });
                response.cookies.set('predikt_access', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 2592000, path: '/' });
                response.cookies.set('predikt_auth_status', '1', { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 2592000, path: '/' });
                return response;
            }
        } catch (fbError) { console.error('Failsafe failed:', fbError); }
        // --- END FAILSAFE ---

        return NextResponse.json(
            {
                error: 'System error: ' + (error.message || 'Unknown error'),
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
