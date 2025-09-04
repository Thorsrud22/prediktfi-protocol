import Link from "next/link";

export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-[color:var(--bg)] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-[color:var(--muted)] hover:text-[color:var(--text)] transition-colors mb-6"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-[color:var(--text)] mb-4">
            Privacy Policy
          </h1>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="bg-[color:var(--surface)] rounded-[var(--radius)] p-6 mb-8">
            <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">
              Data & Privacy Policy
            </h2>
            <div className="space-y-4 text-[color:var(--muted)]">
              <p>
                Predikt is an AI-first prediction studio built on Solana. 
                Our platform enables users to create AI-backed insights and log them on-chain for verification.
              </p>
              <p>
                <strong className="text-[color:var(--text)]">Geographic Restrictions:</strong> 
                Access to certain features may be restricted in specific jurisdictions based on local regulations. 
                We comply with applicable laws and regulations in the regions where we operate.
              </p>
              <p>
                <strong className="text-[color:var(--text)]">Responsible Use:</strong> 
                Users are expected to use the platform responsibly and in accordance with applicable laws. 
                Predictions should be used for information discovery and insight sharing purposes.
              </p>
              <p>
                <strong className="text-[color:var(--text)]">Age Restriction:</strong> 
                Users must be at least 18 years old to use our prediction studio.
              </p>
              <p>
                <strong className="text-[color:var(--text)]">Data Collection:</strong> 
                We store only minimal referral codes in localStorage for attribution purposes. 
                No personal information is collected or stored on our servers.
              </p>
            </div>
          </div>

          <div className="bg-[color:var(--surface)] rounded-[var(--radius)] p-6">
            <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">
              Contact Information
            </h2>
            <div className="space-y-2 text-[color:var(--muted)]">
              <p>
                For questions about this policy or platform access, please contact us:
              </p>
              <p>
                <strong className="text-[color:var(--text)]">Email:</strong> 
                <a 
                  href="mailto:support@prediktfi.com" 
                  className="text-[color:var(--primary)] hover:underline ml-2"
                >
                  support@prediktfi.com
                </a>
              </p>
              <p className="text-sm text-[color:var(--muted)]/80 mt-4">
                Last updated: September 2, 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
