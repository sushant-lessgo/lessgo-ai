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
      // Global security headers. X-Frame-Options is NOT here — it's split below.
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
        ],
      },
      // 🚨 X-Frame-Options is SPLIT so the editor preview SUB-ROUTE can be iframed
      // same-origin (the mobile-view preview + the work-journey reveal). DENY blocks
      // framing EVEN same-origin — that's why this exists. Every other route keeps DENY.
      //
      // editor-route-consolidation phase 5: the work-journey reveal FOLDED onto the
      // editor (`/edit/{token}?reveal=1`, an in-editor presentation state — NOT an
      // iframe), so the ONLY thing that ever framed `/preview` (the retired STEP 06
      // iframe in StepReveal.tsx) is gone. Grep confirmed no remaining `<iframe`
      // targets `/preview` — the surviving `/preview/{token}` references are plain
      // <a href> navigations (admin, work-dashboard "Update site", privacy), which
      // XFO does not affect. So the legacy `/preview/:token+` SAMEORIGIN rule is
      // REMOVED here: `/preview` now falls under DENY like every other non-framed
      // route. The `/edit/{token}/preview` sub-route stays the single framable surface.
      //
      // ⚠️ These TWO sources MUST stay mutually exclusive, and they are:
      //   `/edit/:token/preview`     → the editor preview SUB-ROUTE, exactly one token
      //                                segment (NOT `:token+` — do not widen the framable
      //                                surface to `/edit/{token}/anything`). SAMEORIGIN.
      //   `/((?!edit/[^/]+/preview$).*)`
      //                              → everything that is not exactly `edit/{token}/preview`.
      //                                Bare `/preview/{token}` and bare `/edit/{token}` (no
      //                                /preview) both land here ⇒ DENY. No path matches both,
      //                                so header value is order-independent.
      {
        source: '/edit/:token/preview',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        source: '/((?!edit/[^/]+/preview$).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
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