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
  console.log('Bundle analyzer not installed. Run: npm install --save-dev @next/bundle-analyzer');
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
    minimumCacheTTL: 60,
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: false
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
    maxInactiveAge: 60 * 1000, // Increased from 25s to 60s to prevent premature chunk disposal
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5 // Increased from 2 to 5
  },
  // Experimental features
  experimental: {
    optimizeCss: false,
    scrollRestoration: true,
    serverActions: true
  }
};

module.exports = withBundleAnalyzer(withNextIntl(nextConfig));
