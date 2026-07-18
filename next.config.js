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
      // 🚨 X-Frame-Options is SPLIT so onboarding STEP 06 can iframe the preview
      // same-origin (work-onboarding-shell, founder ruling 2026-07-16). DENY blocks
      // framing EVEN same-origin — that's why this exists. Every other route keeps DENY.
      //
      // ⚠️ These two sources MUST stay mutually exclusive, and they are:
      //   `/preview/:token+`  → one-or-more segments ⇒ matches `/preview/{token}`
      //                         (and `/preview/{token}/privacy`), NOT bare `/preview`.
      //   `/((?!preview/).*)` → everything whose path does not start with `preview/`,
      //                         which includes bare `/preview`.
      // Do NOT loosen `:token+` to `:token*` (zero-or-more): `*` also matches bare
      // `/preview`, which then matches BOTH sources. Next dedupes headers() by key
      // with LAST-WINS, so today that overlap would resolve to DENY (the DENY entry
      // is last) rather than sending two conflicting XFO values — but it makes the
      // behavior depend on ENTRY ORDER instead of the source patterns. Keep them
      // exclusive so order can't matter.
      //
      // ⚠️ INTERIM TARGET — THIS RULE MUST MOVE WITH THE REVEAL. Generate + reveal
      // + preview are consolidating onto the edit route (preview becomes an editor
      // mode toggle; `/preview` retires) — future editor-track work. Whoever
      // retires `/preview`: re-point this source at the editor preview surface in
      // the SAME change. Do not leave it dangling on a nonexistent route, and do
      // not simply delete it — the reveal's iframe stops rendering without it.
      // The matching iframe call site is src/components/onboarding/journey/steps/StepReveal.tsx.
      {
        source: '/preview/:token+',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        source: '/((?!preview/).*)',
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