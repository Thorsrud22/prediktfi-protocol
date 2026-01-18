import { NextRequest, NextResponse } from "next/server";
import { grantBonusQuota, checkRateLimit } from "@/app/lib/ratelimit";

/**
 * API to grant bonus quota for sharing on X
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletAddress } = body;

        // Use wallet address or IP as identifier
        const identifier = walletAddress ||
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown";

        if (identifier === "unknown") {
            return NextResponse.json({ error: "Could not identify user" }, { status: 400 });
        }

        // --- Rate Limiting for Bonus Claims ---
        const rateLimitResponse = await checkRateLimit(request, {
            identifier,
            plan: 'bonus_claim'
        });

        if (rateLimitResponse) {
            return NextResponse.json({
                error: "Bonus limit reached",
                message: "You can only unlock 2 bonus evaluations per day."
            }, { status: 429 });
        }

        // Grant +1 bonus evaluation
        const newTotal = await grantBonusQuota(identifier);

        return NextResponse.json({
            success: true,
            bonusGranted: 1,
            totalBonus: newTotal,
            message: "Bonus evaluation granted! Happy Predikting."
        });

    } catch (error) {
        console.error("Failed to grant bonus quota:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
