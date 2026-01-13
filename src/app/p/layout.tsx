/**
 * Published Pages Layout
 *
 * Statically preloads most common core fonts (Inter, Sora) for optimal LCP.
 * These 4 preloads (~60-80KB) load on all pages - acceptable tradeoff for SSR performance.
 *
 * Strategy:
 * - Preload Inter 400/700 (default font, most pages)
 * - Preload Sora 400/700 (startup/AI tone, second most common)
 * - Covers 80-90% of actual usage
 * - Static preloads in server HTML = zero JS dependency
 */

import '@/app/globals.css';
import '@/styles/fonts-self-hosted.css';

export default function PublishedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preload Inter - default font (most pages) */}
        <link
          rel="preload"
          as="font"
          href="/fonts/inter/inter-v20-latin-regular.woff2"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          href="/fonts/inter/inter-v20-latin-700.woff2"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Preload Sora - startup/AI tone (second most common) */}
        <link
          rel="preload"
          as="font"
          href="/fonts/sora/sora-v17-latin-regular.woff2"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          href="/fonts/sora/sora-v17-latin-700.woff2"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
