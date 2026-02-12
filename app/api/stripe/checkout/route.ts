import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { headers } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { priceId, redirectPath = '/studio' } = await req.json();
        const headersList = await headers();
        const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [
                {
                    price: priceId || 'price_1Qv...CHANGEME...', // You'll need to create this price in Stripe dashboard
                    quantity: 1,
                },
            ],
            success_url: `${origin}${redirectPath}?payment=success`,
            cancel_url: `${origin}${redirectPath}?payment=cancelled`,
            // innovative metadata for tracking
            metadata: {
                source: 'predikt-pricing-page',
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error('Error creating checkout session:', err);
        return NextResponse.json(
            { error: 'Error creating checkout session' },
            { status: 500 }
        );
    }
}
