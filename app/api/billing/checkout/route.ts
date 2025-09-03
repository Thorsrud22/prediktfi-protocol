import { NextRequest, NextResponse } from "next/server";
import { createCharge, isMockMode } from "../../../lib/coinbase";

export const runtime = "edge"; // lightweight

export async function POST(_req: NextRequest) {
  try {
    const baseUrl = process.env.PREDIKT_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const intent = "pro-monthly";
    const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);

    if (isMockMode()) {
      const code = `MOCK-${Date.now()}`;
      const hosted_url = `${baseUrl}/billing/success?code=${encodeURIComponent(code)}`;
      return NextResponse.json({ hosted_url });
    }

    const payload = {
      name: "Predikt Pro (Monthly) – Early Beta",
      description: "Unlimited insights · Priority processing · Early beta pricing",
      pricing_type: "no_price",
      metadata: { intent, nonce },
      redirect_url: `${baseUrl}/billing/success?code={charge.code}`,
      cancel_url: `${baseUrl}/billing/cancel`,
      local_price: undefined,
      // success_url is not directly supported; redirect_url handles post-payment
    } as any;

    const { hosted_url } = await createCharge(payload);
    return NextResponse.json({ hosted_url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "checkout_failed" }, { status: 500 });
  }
}
