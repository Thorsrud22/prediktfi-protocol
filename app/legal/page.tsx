export default function LegalPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[color:var(--text)]">Terms of Service</h1>
        <p className="mt-2 text-[color:var(--muted)]">
          Last updated: September 1, 2025
        </p>
      </header>

      <div className="prose prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">Testing Platform</h2>
          <p className="text-[color:var(--muted)] mb-4">
            PrediktFi is a testing platform built on Solana Devnet for demonstration and educational purposes only. 
            This is not a production application and should not be used with real funds or for actual trading.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">No Real Payouts</h2>
          <p className="text-[color:var(--muted)] mb-4">
            All transactions on this platform use Solana Devnet tokens which have no monetary value. 
            There are no real payouts, winnings, or financial rewards. Any SOL used is testnet SOL 
            provided for free by Solana faucets.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">Not Investment Advice</h2>
          <p className="text-[color:var(--muted)] mb-4">
            Nothing on this platform constitutes investment advice, financial advice, trading advice, 
            or any other sort of advice. The platform is for educational and demonstration purposes only. 
            Do not make any financial decisions based on information found on this platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">Use at Your Own Risk</h2>
          <p className="text-[color:var(--muted)] mb-4">
            This is experimental software provided "as is" without any warranties. Users interact with 
            the platform at their own risk. The developers are not responsible for any losses, damages, 
            or issues that may arise from using this platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">Development Status</h2>
          <p className="text-[color:var(--muted)] mb-4">
            This platform is in active development and may contain bugs, incomplete features, 
            or unexpected behavior. Features may change or be removed without notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">Data Collection</h2>
          <p className="text-[color:var(--muted)] mb-4">
            We may collect anonymous usage data to improve the platform. No personal information 
            is stored beyond what is necessary for the technical operation of the application.
          </p>
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
      </div>
    </div>
  );
}
