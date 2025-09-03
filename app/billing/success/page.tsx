import { computeFromChargeId } from "../../lib/license";
import { fetchChargeByCode, isMockMode } from "../../lib/coinbase";

export const dynamic = "force-dynamic";

function CopyButton({ text }: { text: string }) {
  return (
    <button
      className="px-3 py-2 border rounded-md text-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          alert('Copied');
        } catch {}
      }}
    >
      Copy
    </button>
  );
}

async function getData(code: string) {
  if (code.startsWith("MOCK-") || isMockMode()) {
    const id = code;
    return { status: "confirmed", chargeId: id } as const;
  }
  const charge = await fetchChargeByCode(code);
  const timeline = charge?.timeline || [];
  const latest = timeline[timeline.length - 1];
  const status = (latest?.status || charge?.status || '').toLowerCase();
  return { status, chargeId: charge?.id } as const;
}

export default async function BillingSuccessPage({ searchParams }: { searchParams: { code?: string } }) {
  const code = searchParams?.code || "";

  if (!code) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-4">Missing charge code</h1>
        <a className="text-blue-600" href="/pricing">Back to Pricing</a>
      </div>
    );
  }

  try {
    const { status, chargeId } = await getData(code);
    const isOk = status === 'confirmed' || status === 'resolved' || status === 'CONFIRMED' || status === 'RESOLVED';

    if (!isOk || !chargeId) {
      return (
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-2xl font-bold mb-2">Payment pending</h1>
          <p className="text-gray-600 mb-6">We see your payment, but the charge isn't confirmed yet. This can take a few minutes. Try again shortly.</p>
          <a className="text-blue-600" href={`/billing/success?code=${encodeURIComponent(code)}`}>Try again</a>
        </div>
      );
    }

    const license = computeFromChargeId(chargeId);

    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">Payment received 🎉 Here’s your Pro license</h1>
        <p className="text-gray-600 mb-6">Copy this code and redeem to activate Pro on this browser.</p>

        <div className="p-4 border rounded-lg bg-[--surface] mb-6 flex items-center gap-2">
          <code className="text-sm break-all">{license}</code>
          <CopyButton text={license} />
        </div>

        <form action="/api/billing/redeem" method="POST" className="flex items-center gap-3">
          <input type="hidden" name="license" value={license} />
          <button formAction={async (_formData: any) => {}} className="px-4 py-2 bg-[--accent] text-white rounded-md" >
            Redeem now
          </button>
        </form>

        <div className="mt-8">
          <a className="text-blue-600" href="/studio">Back to Studio</a>
        </div>
      </div>
    );
  } catch (e: any) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-2">Could not load charge</h1>
        <p className="text-gray-600 mb-6">{e?.message || 'Unknown error'}</p>
        <a className="text-blue-600" href="/pricing">Back to Pricing</a>
      </div>
    );
  }
}
