/**
 * Pure <head> fragment builders for the published static HTML (SEO track).
 *
 * Every builder returns '' when its input is absent — that is the byte-identity
 * guarantee: a page with no seo settings produces exactly the same head as
 * before this module existed. Fragments start with '\n  ' so they slot into the
 * htmlGenerator template without disturbing surrounding lines.
 *
 * Pure + dependency-free so they unit-test without the server-only render stack.
 */

/** Canonical HTML-escape for user-supplied strings baked into the head. */
export function escapeHTML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Scheme allow-list for any user-influenced URL baked into the head (publish-trust M4).
 *
 * MOVED to `src/lib/safeUrl.ts` (cms-collections phase 2) — a pure, zero-import
 * module so the client-safe CMS render model can use the same predicate without
 * dragging a server-only dependency into the client bundle. The full contract
 * lives there. Re-exported here because the existing call sites
 * (htmlGenerator.ts, buildPageMetadata.ts, publishSanitizer.ts, headTags.test.ts)
 * import it from `./headTags` — ONE implementation, never a fork.
 */
export { isSafeURL } from '@/lib/safeUrl';

/**
 * noindex meta tag. Deliberately a meta tag, NOT robots.txt Disallow — a
 * Disallow blocks the crawl so the crawler never sees the noindex directive.
 */
export function robotsMetaTag(noIndex: boolean | undefined): string {
  return noIndex ? '\n  <meta name="robots" content="noindex,nofollow">' : '';
}

/** Per-site favicon link (root page's seo.faviconUrl cascades to all pages). */
export function faviconLinkTag(url?: string): string {
  return url ? `\n  <link rel="icon" href="${escapeHTML(url)}">` : '';
}

/** JSON-LD script tag. `json` must already be serialized script-breakout-safe. */
export function jsonLdScriptTag(json?: string): string {
  return json ? `\n  <script type="application/ld+json">${json}</script>` : '';
}

/**
 * Strict ID regexes for the tracking pixels baked into the head. These are the
 * SINGLE source of truth — imported by validation.ts (zod) and the client modal,
 * never redefined. The charsets (\d, [A-Z0-9-]) contain no HTML metacharacters, so
 * a value that passes the regex is injection-safe verbatim (no escaping needed).
 */
export const META_PIXEL_ID_RE = /^\d{5,20}$/; // real pixel IDs are 15–16 digits; bounded
export const GA4_MEASUREMENT_ID_RE = /^G-[A-Z0-9]{4,20}$/; // client uppercases before validating

/**
 * Meta (Facebook) base pixel snippet. Returns '' when the id is absent OR fails
 * META_PIXEL_ID_RE (defense-in-depth: builder re-checks even though the sanitizer
 * already validated). Vendor markup is verbatim; {PIXEL_ID} interpolated twice.
 */
export function metaPixelSnippet(pixelId?: string): string {
  if (!pixelId || !META_PIXEL_ID_RE.test(pixelId)) return '';
  return `\n  <!-- Meta Pixel Code -->
  <script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${pixelId}');
  fbq('track', 'PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
  /></noscript>
  <!-- End Meta Pixel Code -->`;
}

/**
 * Google Analytics 4 gtag.js snippet. Returns '' when the id is absent OR fails
 * GA4_MEASUREMENT_ID_RE. Vendor markup is verbatim; {MEASUREMENT_ID} twice.
 */
export function ga4Snippet(measurementId?: string): string {
  if (!measurementId || !GA4_MEASUREMENT_ID_RE.test(measurementId)) return '';
  return `\n  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  </script>
  <!-- End Google tag -->`;
}
