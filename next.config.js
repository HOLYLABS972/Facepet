const createNextIntlPlugin = require('next-intl/plugin');
const path = require('path');

const withNextIntl = createNextIntlPlugin();

// Bundle analyzer (optional, run with ANALYZE=true npm run build)
let withBundleAnalyzer = (config) => config;
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch (e) {
  // Bundle analyzer not installed, skip it
  if (process.env.ANALYZE === 'true') {
    console.log('Bundle analyzer not installed. Run: npm install --save-dev @next/bundle-analyzer');
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        minimize: true,
        usedExports: true, // Enable tree-shaking
        sideEffects: false,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor libraries
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Common code shared across multiple chunks
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
              name: 'common',
            },
            // Admin pages - lazy loaded
            admin: {
              test: /[\\/]src[\\/]components[\\/]admin[\\/]/,
              name: 'admin',
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: '*.firebasestorage.app',
        port: ''
      }
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year cache for optimized images
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: false,
    unoptimized: false, // Force optimization
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Cache optimization
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5
  },
  // Experimental features
  experimental: {
    optimizeCss: false,
    scrollRestoration: true,
    isrMemoryCacheSize: 50 * 1024 * 1024, // 50MB ISR cache
  },
  // Strip console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep error and warn logs
    } : false,
  },
  // SWC minification for faster builds
  swcMinify: true,
};

module.exports = withBundleAnalyzer(withNextIntl(nextConfig));
