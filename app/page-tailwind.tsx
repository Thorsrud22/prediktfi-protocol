export default function Home() {
  return (
    <>
      {/* Aurora background */}
      <div className="aurora-bg"></div>
      <div className="vignette"></div>

      <div className="relative z-10 min-h-screen">
        {/* Navigation */}
        <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            PrediktFi
          </div>
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl">
            Connect Wallet
          </button>
        </nav>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-7xl md:text-9xl font-black mb-8 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight">
              PrediktFi
            </h1>
            <h2 className="text-4xl md:text-6xl font-bold mb-10 text-white leading-tight">
              Tokenized Predictions on Solana
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-16 max-w-4xl mx-auto leading-relaxed">
              Turn insights into tradable assets. Access the future of on-chain
              prediction markets with real speed and near zero fees.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-full text-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-2xl hover:shadow-blue-500/25 hover:-translate-y-1">
                Launch App
              </button>
              <button className="border-2 border-gray-400 text-gray-300 px-10 py-5 rounded-full text-xl font-bold hover:bg-white/10 hover:border-white transition-all">
                Learn More
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-32">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-8 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm3 2h6v4H7V4zm8 6V9a1 1 0 00-1-1h-2a1 1 0 00-1 1v1H9V9a1 1 0 00-1-1H6a1 1 0 00-1 1v1h10z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">
                On-Chain Markets
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                Create and trade prediction assets directly on Solana without
                intermediaries.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-8 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">
                Permissionless
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                No KYC. Anyone with a wallet can participate across borders.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/10">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl mb-8 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">
                High Performance
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                Sub-second finality and minimal fees so markets feel instant.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center text-gray-400 py-16 border-t border-white/10 mt-32">
          <p className="text-lg">© 2025 PrediktFi · Built on Solana</p>
        </footer>
      </div>
    </>
  );
}
