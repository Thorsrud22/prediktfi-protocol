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
      },
      // Static assets caching like PredictionSwap
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // Images and public assets
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400'
          }
        ]
      },
      // API routes caching
      {
        source: '/api/public/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300'
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=300'
          }
        ]
      }
    ];
  },
  
  // Performance optimizations
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Only alias react-native to prevent build issues
      config.resolve.alias = {
        ...config.resolve.alias,
        'react-native': require.resolve('./app/lib/wallet-adapters.dev.ts'),
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
    } else {
      // Production optimizations
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            solana: {
              test: /[\\/]node_modules[\\/]@solana[\\/]/,
              name: 'solana',
              chunks: 'all',
              priority: 20,
            },
            wallet: {
              test: /[\\/]node_modules[\\/]@solana[\\/]wallet-adapter[\\/]/,
              name: 'wallet-adapter',
              chunks: 'all',
              priority: 30,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },
};

module.exports = nextConfig;
