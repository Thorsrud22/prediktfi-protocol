import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getWalletIdentifier } from '@/lib/wallet';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    const walletId = getWalletIdentifier(request);
    if (!walletId) {
      return NextResponse.json({ error: 'Wallet not connected' }, { status: 401 });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: walletId,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Generate simple HTML receipt
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${payment.id}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .details { margin-bottom: 20px; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .label { font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Predikt Protocol</h1>
            <h2>Payment Receipt</h2>
          </div>
          
          <div class="details">
            <div class="detail-row">
              <span class="label">Receipt ID:</span>
              <span>${payment.id}</span>
            </div>
            <div class="detail-row">
              <span class="label">Plan:</span>
              <span>${payment.plan.charAt(0).toUpperCase() + payment.plan.slice(1)}</span>
            </div>
            <div class="detail-row">
              <span class="label">Amount:</span>
              <span>$${payment.amountUsd.toFixed(2)} USD</span>
            </div>
            <div class="detail-row">
              <span class="label">Token:</span>
              <span>${payment.token}</span>
            </div>
            <div class="detail-row">
              <span class="label">Transaction:</span>
              <span>${payment.txSig}</span>
            </div>
            <div class="detail-row">
              <span class="label">Date:</span>
              <span>${new Date(payment.receivedAt).toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="label">Paid to:</span>
              <span>Ez6dxRTZ...mnd5</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for your payment!</p>
            <p>This receipt was generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(receiptHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="receipt-${payment.id}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json({ error: 'Failed to generate receipt' }, { status: 500 });
  }
}
