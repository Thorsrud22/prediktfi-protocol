import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook, fetchChargeById } from "../../../lib/coinbase";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("X-CC-Webhook-Signature");
    const rawBody = await request.text();
    const ok = verifyWebhook(rawBody, signature);
    if (!ok) return new NextResponse("invalid signature", { status: 400 });

    const payload = JSON.parse(rawBody);
    const type: string | undefined = payload?.event?.type;
    const chargeId: string | undefined = payload?.event?.data?.id;

    if (!type || !chargeId) return NextResponse.json({ ok: true }); // ignore malformed

    if (type === "charge:confirmed" || type === "charge:resolved") {
      // Best-effort verification; no persistence required
      try {
        await fetchChargeById(chargeId);
      } catch (e) {
        // swallow errors, webhook must be idempotent
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: true }); // never fail webhook
  }
}
