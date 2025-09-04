import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy • Predikt',
  description: 'Privacy policy for Predikt prediction platform.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[--background]">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-3xl font-bold text-[--text] mb-8">Privacy Policy</h1>
        
        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">Data Collection</h2>
            <p className="text-[--muted] mb-4">
              We collect minimal data necessary for platform functionality:
            </p>
            <ul className="list-disc pl-6 text-[--muted] mb-4">
              <li>Usage analytics (page views, feature usage) - anonymized</li>
              <li>Plan status (Free/Pro) stored in browser cookies</li>
              <li>Temporary session data in browser localStorage</li>
              <li>Server logs for debugging and security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">Cookies</h2>
            <p className="text-[--muted] mb-4">
              We use essential cookies to remember your plan status (Free/Pro). These are 
              necessary for the platform to function correctly. No third-party tracking cookies are used.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">Analytics</h2>
            <p className="text-[--muted] mb-4">
              We collect anonymous usage analytics to improve the platform. This includes:
            </p>
            <ul className="list-disc pl-6 text-[--muted] mb-4">
              <li>Page visits and feature usage patterns</li>
              <li>Error rates and performance metrics</li>
              <li>No personally identifiable information</li>
              <li>No cross-site tracking</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">Data Sharing</h2>
            <p className="text-[--muted] mb-4">
              We do not sell, rent, or share personal data with third parties. Aggregated, 
              anonymous usage statistics may be shared for research purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">Data Retention</h2>
            <p className="text-[--muted] mb-4">
              Browser data (localStorage, cookies) persists until you clear it. Server logs 
              are retained for 30 days for debugging purposes, then automatically deleted.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">Your Rights</h2>
            <p className="text-[--muted] mb-4">
              You can clear your browser data at any time. For questions about data practices, 
              contact us via GitHub issues.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">Updates</h2>
            <p className="text-[--muted] mb-4">
              This privacy policy may be updated as we add features. We'll post significant 
              changes on the platform.
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
