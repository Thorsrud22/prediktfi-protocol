import Link from "next/link";

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[color:var(--text)]">Legal Information</h1>
        <p className="mt-2 text-[color:var(--muted)]">
          Last updated: September 1, 2025
        </p>
      </header>

      <div className="space-y-8">
        {/* Alert Banner */}
        <div className="p-4 bg-blue-100 border border-blue-300 rounded-lg dark:bg-blue-900/20 dark:border-blue-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Devnet Testing Environment:</strong> This platform operates on Solana Devnet for testing and demonstration purposes only. No real funds are at risk.
              </p>
            </div>
          </div>
        </div>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">Terms of Service</h2>
          <div className="text-[color:var(--muted)] space-y-4">
            <h3 className="text-lg font-medium text-[color:var(--text)]">1. Platform Purpose</h3>
            <p>
              Predikt is a prediction market platform built on Solana Devnet for demonstration and educational purposes only. 
              This is not a production application and should not be used with real funds or for actual trading.
            </p>

            <h3 className="text-lg font-medium text-[color:var(--text)]">2. No Real Payouts</h3>
            <p>
              All transactions use Solana Devnet tokens which have no monetary value. There are no real payouts, 
              winnings, or financial rewards. Any SOL used is testnet SOL provided for free by Solana faucets.
            </p>

            <h3 className="text-lg font-medium text-[color:var(--text)]">3. User Responsibilities</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must be at least 18 years old to use this platform</li>
              <li>You are responsible for the security of your wallet and private keys</li>
              <li>You understand this is a testing environment only</li>
              <li>You will not attempt to exploit platform vulnerabilities</li>
            </ul>

            <h3 className="text-lg font-medium text-[color:var(--text)]">4. Not Investment Advice</h3>
            <p>
              Nothing on this platform constitutes investment advice, financial advice, trading advice, 
              or any other sort of advice. The platform is for educational and demonstration purposes only.
            </p>

            <h3 className="text-lg font-medium text-[color:var(--text)]">5. Development Status</h3>
            <p>
              This platform is in active development and may contain bugs, incomplete features, 
              or unexpected behavior. Features may change or be removed without notice.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">Privacy Policy</h2>
          <div className="text-[color:var(--muted)] space-y-4">
            <h3 className="text-lg font-medium text-[color:var(--text)]">Information We Collect</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Wallet Addresses:</strong> Public wallet addresses for transaction processing</li>
              <li><strong>Transaction Data:</strong> On-chain transaction signatures and amounts</li>
              <li><strong>Local Storage:</strong> Preferences and temporary data stored in your browser</li>
            </ul>

            <h3 className="text-lg font-medium text-[color:var(--text)]">How We Use Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process and verify test transactions</li>
              <li>Display your prediction history and portfolio</li>
              <li>Improve platform functionality</li>
            </ul>

            <h3 className="text-lg font-medium text-[color:var(--text)]">Data Security</h3>
            <p>
              We implement appropriate security measures to protect your information. However, 
              no method of transmission over the internet is 100% secure.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">Risk Disclaimer</h2>
          <div className="text-[color:var(--muted)] space-y-4">
            <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-700">
              <p className="text-yellow-800 dark:text-yellow-300 font-medium">
                ⚠️ Testing Environment Only - No Real Financial Risk
              </p>
            </div>

            <h3 className="text-lg font-medium text-[color:var(--text)]">Technical Risks</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Platform technical issues may affect test transactions</li>
              <li>Wallet security compromises could affect test tokens</li>
              <li>Platform downtime during development</li>
              <li>Data loss during development iterations</li>
            </ul>

            <h3 className="text-lg font-medium text-[color:var(--text)]">Recommendations</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Only use test wallets with devnet SOL</li>
              <li>Do not use production wallets or real funds</li>
              <li>Understand this is experimental software</li>
              <li>Keep your wallet and private keys secure</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">Contact</h2>
          <p className="text-[color:var(--muted)] mb-4">
            For questions about these terms or the platform, please visit our{" "}
            <a 
              href="https://github.com/Thorsrud22/prediktfi-protocol" 
              className="text-[color:var(--accent)] hover:underline"
              target="_blank" 
              rel="noopener noreferrer"
            >
              GitHub repository
            </a>.
          </p>
        </section>

        <div className="text-center">
          <Link 
            href="/markets" 
            className="inline-block px-6 py-3 bg-[color:var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Back to Markets
          </Link>
        </div>
      </div>
    </div>
  );
}
