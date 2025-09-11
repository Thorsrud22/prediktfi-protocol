import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createSolanaPayUrl, generateQRCodeDataUrl, calculateSolAmount, getPaymentWallet, getUsdcMint } from '@/src/lib/solana';
import { getWalletIdentifier } from '@/lib/wallet';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

const createPaymentSchema = z.object({
  plan: z.enum(['starter', 'pro']),
  token: z.enum(['USDC', 'SOL']).optional(),
  currency: z.enum(['USDC', 'SOL']).optional(),
  amountUsd: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const walletId = getWalletIdentifier(request);
    if (!walletId) {
      return NextResponse.json({ error: 'Wallet not connected' }, { status: 401 });
    }

    const body = await request.json();
    const { plan, token, currency, amountUsd: requestedAmountUsd } = createPaymentSchema.parse(body);

    // Determine token/currency (support both old and new formats)
    const selectedToken = token || currency || 'USDC';

    // Get pricing (use requested amount or fallback to environment variables)
    const starterPrice = parseFloat(process.env.PRICING_STARTER_USD || '9');
    const proPrice = parseFloat(process.env.PRICING_PRO_USD || '29');
    const amountUsd = requestedAmountUsd || (plan === 'starter' ? starterPrice : proPrice);

    // Calculate token amount
    let amount: number;
    if (selectedToken === 'USDC') {
      amount = amountUsd; // USDC amount in dollars
    } else {
      // SOL amount
      amount = await calculateSolAmount(amountUsd);
    }

    // Generate unique reference
    const reference = ulid();

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        userId: walletId,
        plan,
        reference,
        amountUsd,
        token: selectedToken,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    // Create Solana Pay URL
    const recipient = getPaymentWallet().toString();
    const splToken = selectedToken === 'USDC' ? getUsdcMint().toString() : undefined;
    
    const solanaUrl = createSolanaPayUrl({
      recipient,
      amount,
      splToken,
      reference,
      label: `Predikt ${plan === 'starter' ? 'Starter' : 'Pro'}`,
      message: `Payment for ${plan} plan - ${walletId.slice(0, 8)}...`,
    });

    // Generate QR code
    const qrPngDataUrl = await generateQRCodeDataUrl(solanaUrl);

    return NextResponse.json({
      reference,
      solanaUrl,
      qrPngDataUrl,
      qrUrl: qrPngDataUrl, // Alias for compatibility
      deepLink: solanaUrl, // Alias for compatibility
      amount,
      token: selectedToken,
      currency: selectedToken, // Alias for compatibility
      plan,
      amountUsd,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
