/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // External packages that should not be bundled
  serverExternalPackages: ['@solana/web3.js', '@coral-xyz/anchor'],
  // Simpler dev config for stability
  webpack: (config, { dev }) => {
    if (dev) {
      // Basic stability settings
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
