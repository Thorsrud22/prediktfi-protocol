/** @type {import('next').NextConfig} */
// Force reload: 2026-01-25
const nextConfig = {
  // Performance: External packages that should not be bundled
  serverExternalPackages: ['@solana/web3.js', '@coral-xyz/anchor'],

  // Reactivity optimizations (experimental)
  reactStrictMode: true,



  // Performance optimizations
  async redirects() {
    return [
      {
        source: '/policy',
        destination: '/legal/privacy',
        permanent: true,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/security.txt',
        destination: '/.well-known/security.txt',
      },
    ];
  },

  webpack: (config, { dev, isServer, webpack }) => {
    // Universal alias to kill the build error (REMOVED - root cause was splitChunks)
    // config.plugins.push(...)

    if (dev) {
      // Development optimizations for speed
      config.resolve.alias = {
        ...config.resolve.alias,
        'react-native': require.resolve('./app/lib/wallet-adapters.dev.ts'),
      };

      // Faster dev builds - reduce file watching overhead
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 300,
        ignored: [
          '**/node_modules/@reown/**',
          '**/node_modules/@walletconnect/**',
          '**/node_modules/react-native/**',
          '**/node_modules/@solana/**',
          '**/node_modules/@heroicons/**',
          '**/node_modules/framer-motion/**',
        ],
      };

      // Speed up dev builds by disabling heavy optimizations
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: {
          chunks: 'async',
          cacheGroups: {
            default: false,
            vendors: false,
          },
        },
      };

      // Skip source maps in development for speed
      config.devtool = false;

      // Reduce parsing overhead
      config.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      });
    } else {
      // Production optimizations
      // config.optimization = {
      //   ...config.optimization,
      //   splitChunks: {
      //     chunks: 'all',
      //     maxSize: 244000,
      //     cacheGroups: {
      //       vendor: {
      //         test: /[\\/]node_modules[\\/]/,
      //         name: 'vendors',
      //         chunks: 'all',
      //       },
      //       solana: {
      //         test: /[\\/]node_modules[\\/]@solana[\\/]/,
      //         name: 'solana',
      //         chunks: 'all',
      //         priority: 20,
      //       },
      //       wallet: {
      //         test: /[\\/]node_modules[\\/]@solana[\\/]wallet-adapter[\\/]/,
      //         name: 'wallet-adapter',
      //         chunks: 'all',
      //         priority: 30,
      //       },
      //     },
      //   },
      // };
    }

    return config;
  },

  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
    // Enable React Server Components optimizations
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Aggressive prefetching and caching
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': ['@svgr/webpack'],
    },
  },

  // Headers for aggressive caching
  // NOTE: Content-Security-Policy is now handled dynamically in middleware.ts with nonce-based CSP
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
