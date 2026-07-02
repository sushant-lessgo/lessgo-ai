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
