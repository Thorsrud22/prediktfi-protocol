import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service • Predikt',
  description: 'Terms of service for Predikt prediction platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[--background]">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-3xl font-bold text-[--text] mb-8">Terms of Service</h1>
        
        <div className="prose prose-gray max-w-none">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-yellow-800 font-medium">
              ⚠️ Beta Platform - This is a testing environment for demonstration purposes.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">1. Platform Purpose</h2>
            <p className="text-[--muted] mb-4">
              Predikt is a prediction platform currently in beta testing. This platform is provided 
              for demonstration and educational purposes. Users participate at their own discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">2. Beta Status</h2>
            <p className="text-[--muted] mb-4">
              This platform is in active development. Features may change, and temporary downtime 
              may occur. We make no guarantees about service availability or data persistence.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">3. No Financial Advice</h2>
            <p className="text-[--muted] mb-4">
              Predictions and insights provided by this platform are for informational purposes only 
              and do not constitute financial, investment, or professional advice. Users should conduct 
              their own research before making any decisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">4. Acceptable Use</h2>
            <p className="text-[--muted] mb-4">
              Users must not attempt to exploit, abuse, or disrupt the platform. Automated access 
              may be rate-limited. We reserve the right to suspend access for violations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">5. Updates</h2>
            <p className="text-[--muted] mb-4">
              These terms may be updated as the platform evolves. Continued use constitutes 
              acceptance of any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">6. Contact</h2>
            <p className="text-[--muted]">
              For questions about these terms, please contact us via GitHub issues on our repository.
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
