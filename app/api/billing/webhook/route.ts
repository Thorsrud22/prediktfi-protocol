import { NextRequest, NextResponse } from "next/server";
import { fetchChargeById } from "../../../lib/coinbase";
import { verifyWebhook } from "../../../lib/coinbase-webhook";
import { trackServer } from "../../../lib/analytics";

export const runtime = "nodejs";

// Simple in-memory store for webhook idempotency
const processedWebhooks = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("X-CC-Webhook-Signature");
    const rawBody = await request.text();
    const ok = verifyWebhook(rawBody, signature);
    if (!ok) return new NextResponse("invalid signature", { status: 400 });

    const payload = JSON.parse(rawBody);
    const type: string | undefined = payload?.event?.type;
    const chargeId: string | undefined = payload?.event?.data?.id;
    const eventId: string | undefined = payload?.event?.id;

    if (!type || !chargeId) return NextResponse.json({ ok: true }); // ignore malformed

    // Idempotency check
    const webhookKey = `${eventId || chargeId}-${type}`;
    if (processedWebhooks.has(webhookKey)) {
      trackServer('webhook_duplicate_ignored', { chargeId, type });
      return NextResponse.json({ ok: true });
    }

    if (type === "charge:confirmed" || type === "charge:resolved") {
      // Best-effort verification; no persistence required
      try {
        await fetchChargeById(chargeId);
        console.log(JSON.stringify({
          kind: 'webhook_processed',
          chargeId,
          type,
          eventId,
          ts: Date.now()
        }));
      } catch (e) {
        // swallow errors, webhook must be idempotent
      }
    }

    // Mark as processed
    processedWebhooks.add(webhookKey);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: true }); // never fail webhook
  }
}
