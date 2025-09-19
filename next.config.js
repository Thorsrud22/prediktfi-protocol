/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Performance: External packages that should not be bundled
  serverExternalPackages: ['@solana/web3.js', '@coral-xyz/anchor'],

  // Performance optimizations
  webpack: (config, { dev, isServer }) => {
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
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 244000,
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

  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': ['@svgr/webpack'],
    },
  },
};

module.exports = nextConfig;
