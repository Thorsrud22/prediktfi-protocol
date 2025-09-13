import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

const OWNER = process.env.NEXT_PUBLIC_PAYMENT_WALLET
  || 'Ez6dxRTZPCR41LNFPTPH9FjpDkX8NusbP1HDJy2vmnd5' // dev fallback

export async function POST(req: Request) {
  try {
    const { plan = 'pro', payer, currency = 'SOL' } = await req.json()

    if (!['starter','pro'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Devnet defaults: keep it simple with SOL to avoid USDC mint setup hassles.
    const amount = plan === 'pro' ? 0.01 : 0

    const reference = randomBytes(16).toString('hex')
    const params = new URLSearchParams({
      amount: String(amount),
      label: 'Predikt Pro',
      message: `Predikt ${plan} subscription`,
      reference,
    })
    // NOTE: For USDC later, add &spl-token=<MINT>
    const link = `solana:${OWNER}?${params}`

    return NextResponse.json({
      ok: true,
      plan,
      currency,
      amount,
      reference,
      link,
      recipient: OWNER,
      payer: payer || null,
      deepLink: link, // Support both naming conventions
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to create invoice', detail: e?.message }, { status: 500 })
  }
}