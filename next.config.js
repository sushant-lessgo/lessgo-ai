/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // A05: Security Misconfiguration - Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
    ];
  },
  // Remove console.log statements in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error'], // Keep console.error for production error tracking
    } : false,
  },
  // Performance optimizations for production
  compress: true,
  poweredByHeader: false,
  // Image optimization for better performance
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
  },
  // Required on Next 14 so instrumentation.ts register() runs (Sentry server/edge
  // init). Became default in Next 15; must be explicit here.
  experimental: {
    instrumentationHook: true,
  },
};

const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(nextConfig, {
  org: 'lessgo-ai',
  project: 'lessgo-ai',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { disable: false },
  // tunnelRoute intentionally omitted: a /monitoring route would collide with
  // middleware.ts Branch A rewrites on *.lessgo.ai hosts.
});