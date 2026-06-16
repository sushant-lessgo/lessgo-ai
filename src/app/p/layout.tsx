/**
 * Published Pages Layout
 *
 * Statically preloads the broadly-shared near-body faces for optimal LCP.
 * `p/layout` is shared across all template pages, so we preload only the faces
 * used by the most templates (not template-specific display/variable fonts).
 *
 * Strategy:
 * - Preload Inter 400 (Meridian body)
 * - Preload Inter Tight 400 (Meridian display + Lex body)
 * - Other faces (Fraunces, Source Serif 4, Lora, EB Garamond, JetBrains Mono,
 *   DM Sans) load on demand via font-display:swap from fonts-self-hosted.css
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
        {/* Preload Inter - Meridian body */}
        <link
          rel="preload"
          as="font"
          href="/fonts/inter/inter-v20-latin-regular.woff2"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Preload Inter Tight - Meridian display + Lex body */}
        <link
          rel="preload"
          as="font"
          href="/fonts/inter-tight/inter-tight-latin-400-normal.woff2"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
