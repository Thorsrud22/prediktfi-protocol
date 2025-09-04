/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // External packages that should not be bundled
  serverExternalPackages: ['@solana/web3.js', '@coral-xyz/anchor'],
  
  // Security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://commerce.coinbase.com",
              "connect-src 'self' https://commerce.coinbase.com",
              "img-src 'self' data: https:",
              "style-src 'self' 'unsafe-inline'",
              "frame-src https://commerce.coinbase.com"
            ].join('; ')
          }
        ]
      }
    ];
  },
  
  // Performance optimizations for development
  webpack: (config, { dev }) => {
    if (dev) {
      // Exclude heavy wallet dependencies in development
      config.resolve.alias = {
        ...config.resolve.alias,
        '@solana/wallet-adapter-wallets': require.resolve('./app/lib/wallet-adapters.dev.ts'),
        'react-native': require.resolve('./app/lib/wallet-adapters.dev.ts'), // Mock heavy packages
      };
      
      // Faster dev builds
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 300,
        ignored: [
          '**/node_modules/@reown/**',
          '**/node_modules/@walletconnect/**',
          '**/node_modules/react-native/**',
        ],
      };
      
      // Reduce bundle size in development
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
      
      // Skip source maps in development for speed
      config.devtool = false;
    }
    return config;
  },
};

module.exports = nextConfig;
