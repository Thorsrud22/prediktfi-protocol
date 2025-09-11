import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { getSolanaConnection, getPaymentWallet, getUsdcMint } from '@/src/lib/solana';
import { upgradeToPro } from '@/lib/subscription';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 });
    }

    // Find pending invoice
    const invoice = await prisma.invoice.findUnique({
      where: { reference, status: 'PENDING' },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if invoice expired
    if (new Date() > invoice.expiresAt) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ status: 'expired' });
    }

    // Check for payment on-chain
    const connection = getSolanaConnection();
    const paymentWallet = getPaymentWallet();
    const usdcMint = getUsdcMint();

    // Get recent signatures for the payment wallet
    const signatures = await connection.getSignaturesForAddress(paymentWallet, {
      limit: 50,
    });

    for (const sigInfo of signatures) {
      try {
        const tx = await connection.getParsedTransaction(sigInfo.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx || !tx.meta) continue;

        // Check if this transaction contains our reference in memo
        const memoInstruction = tx.transaction.message.instructions.find(
          (ix: any) => ix.programId.toString() === 'MemoSq4gqABAXKb96qnH8TysKcWfC85B2q2'
        );

        if (!memoInstruction || !('data' in memoInstruction) || !memoInstruction.data) continue;

        // Decode memo to check for reference
        const memoText = Buffer.from(memoInstruction.data, 'base64').toString('utf-8');
        if (!memoText.includes(reference)) continue;

        // Check if this is a USDC transfer
        if (invoice.token === 'USDC') {
          const usdcTransfer = tx.meta.postTokenBalances?.find(
            (balance: any) => 
              balance.mint === usdcMint.toString() &&
              balance.owner === paymentWallet.toString() &&
              balance.uiTokenAmount.uiAmount === invoice.amountUsd
          );

          if (!usdcTransfer) continue;
        } else {
          // Check SOL transfer
          const solTransfer = tx.meta.postBalances?.find(
            (balance: any, index: number) => {
              const preBalance = tx.meta?.preBalances?.[index] || 0;
              const diff = balance - preBalance;
              return Math.abs(diff - invoice.amountUsd * 1e9) < 1000; // Allow small tolerance
            }
          );

          if (!solTransfer) continue;
        }

        // Payment found! Update invoice and grant plan
        await prisma.$transaction(async (tx) => {
          // Update invoice
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              status: 'PAID',
              txSig: sigInfo.signature,
              paidAt: new Date(),
            },
          });

          // Create payment record
          await tx.payment.create({
            data: {
              userId: invoice.userId,
              plan: invoice.plan,
              token: invoice.token,
              amountUsd: invoice.amountUsd,
              txSig: sigInfo.signature,
            },
          });

          // Grant plan (upgrade to Pro) - 30 days from now
          const planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          await upgradeToPro(invoice.userId, undefined, planExpiresAt);
        });

        return NextResponse.json({
          status: 'paid',
          txSig: sigInfo.signature,
        });
      } catch (txError) {
        console.error('Error checking transaction:', txError);
        continue;
      }
    }

    // No payment found yet
    return NextResponse.json({ status: 'pending' });
  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json({ error: 'Failed to check payment status' }, { status: 500 });
  }
}
