import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy • Predikt',
  description: 'Refund policy for Predikt Pro subscriptions.',
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[--background]">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-3xl font-bold text-[--text] mb-8">Refund Policy</h1>
        
        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">Beta Pricing</h2>
            <p className="text-[--muted] mb-4">
              Predikt Pro is currently offered at early beta pricing. All transactions are 
              processed securely through Coinbase Commerce using cryptocurrency payments.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">Refund Eligibility</h2>
            <p className="text-[--muted] mb-4">
              Refunds may be considered in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-[--muted] mb-4">
              <li>Technical issues preventing access to Pro features</li>
              <li>Billing errors or duplicate charges</li>
              <li>Requests made within 7 days of purchase</li>
              <li>Where required by applicable consumer protection laws</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">Refund Process</h2>
            <p className="text-[--muted] mb-4">
              To request a refund:
            </p>
            <ol className="list-decimal pl-6 text-[--muted] mb-4">
              <li>Contact our support team via GitHub issues with your license code</li>
              <li>Provide a brief explanation of the issue</li>
              <li>Allow 5-7 business days for review and processing</li>
              <li>Refunds are processed back to the original payment method when possible</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">Beta Platform Considerations</h2>
            <p className="text-[--muted] mb-4">
              As a beta platform, some limitations apply:
            </p>
            <ul className="list-disc pl-6 text-[--muted] mb-4">
              <li>Features may change or be temporarily unavailable</li>
              <li>Performance may vary during development</li>
              <li>Data persistence is not guaranteed</li>
            </ul>
            <p className="text-[--muted] mb-4">
              These factors are considered part of the beta experience and typically do not 
              qualify for refunds unless they significantly impact core functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">Contact Information</h2>
            <p className="text-[--muted] mb-4">
              For refund requests or questions about this policy, please open an issue on our 
              GitHub repository with the "billing" label. We typically respond within 2-3 business days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">Policy Updates</h2>
            <p className="text-[--muted] mb-4">
              This refund policy may be updated as we transition from beta to full release. 
              Changes will be posted on this page and take effect immediately.
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <a href="/" className="text-[--accent] hover:underline">← Back to Predikt</a>
        </div>
      </div>
    </div>
  );
}
