// src/lib/safeUrl.ts
//
// THE two URL scheme-allow-list predicates, single-sourced. PURE module with
// ZERO imports — safe in a client bundle, a server route, an edge worker and a
// plain test alike.
//
// WHY THIS FILE EXISTS (cms-collections phase 2, the "boundary law"):
// `isSafePublishedUrl` used to live in `src/lib/publishSanitizer.ts`, which is
// server-only (it imports `jsdom` + `dompurify`). The CMS render model
// (`src/modules/cms/render/toRenderModel.ts`) sanitizes URLs INSIDE the single
// shaping function so the editor and the publish materializer consume the same
// already-sanitized model — and the editor adapter is a `'use client'`
// component. Importing publishSanitizer from there would drag jsdom into the
// client bundle. So both predicates were MOVED here; `headTags.ts` and
// `publishSanitizer.ts` re-export from this file. ONE implementation each,
// never a fork.
//
// WHICH ONE TO USE:
//   - isSafeURL          — NARROW. `<img src>`, og:image, hreflang, anything that
//                          must resolve to a fetchable document/asset.
//   - isSafePublishedUrl — WIDE. User-authored CTA/link destinations, which
//                          legitimately include `mailto:` / `tel:` / `#anchor`.
//     Using the narrow one on a CTA silently deletes "Email me" / "Call us" /
//     in-page-anchor links with no user-visible reason.

/**
 * Scheme allow-list for any user-influenced URL baked into the head or an image
 * src (publish-trust M4).
 *
 * CONTRACT — returns true ONLY for:
 *   - absolute `https://…` / `http://…`, or
 *   - root-relative `/path…` (but NOT protocol-relative `//evil.com`, which inherits
 *     the page scheme and points off-origin, nor the `/\evil.com` browser-quirk twin).
 * Everything else is false: `javascript:`, `data:`, `vbscript:`, no-scheme garbage, ''.
 *
 * NORMALIZATION: strips ALL chars \x00-\x20 ANYWHERE (not `.trim()`) then lowercases.
 * Browsers ignore embedded control/whitespace chars when parsing a scheme, so
 * `java\tscript:x`, `java script:x` and ` javascript:x` are all LIVE URLs — a trim-only
 * normalization lets them through.
 *
 * NO ENTITY-DECODE NEEDED: this predicate runs BEFORE escapeHTML at every call site.
 * An entity-encoded colon (`javascript&#58;x`) fails the allow-list here, and escapeHTML
 * afterwards re-encodes the `&` — so an encoded scheme can never re-activate in the
 * emitted attribute.
 *
 * REJECT SEMANTICS ARE PER-SINK (never emit '' into an href — that yields a self-link):
 *   - og:image  → gated at source in resolveOgImage(); an unsafe candidate falls through
 *                 the `||` chain to the auto /api/og/{slug} URL.
 *   - hreflang  → the whole <link rel="alternate"> is OMITTED.
 *   - canonical → NOT gated (escape-only); see the call-site note in htmlGenerator.ts.
 *   - CMS image/gallery values → the value is DROPPED from the render model.
 */
export function isSafeURL(url: string): boolean {
  if (!url) return false;
  const normalized = url.replace(/[\x00-\x20]/g, '').toLowerCase();
  if (!normalized) return false;
  // Protocol-relative `//host` (and the `/\host` quirk form) are off-origin absolutes.
  if (normalized.startsWith('//') || normalized.startsWith('/\\')) return false;
  if (normalized.startsWith('/')) return true;
  return normalized.startsWith('https://') || normalized.startsWith('http://');
}

/**
 * Publish-side URL safety predicate. Wraps (does NOT fork) `isSafeURL`
 * (https/http/root-relative; rejects javascript:/data:/vbscript:/protocol-relative;
 * strips control chars), OR'd with the three schemes published pages legitimately
 * need but isSafeURL rejects:
 *   - mailto:  (email CTAs)
 *   - tel:     (call-conversion CTAs)
 *   - #frag    (in-page anchor / section-scroll CTA system)
 * Empty string is treated as "nothing to gate" by sanitizePublishedUrl, not here.
 */
export function isSafePublishedUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  if (isSafeURL(url)) return true;
  const normalized = url.replace(/[\x00-\x20]/g, '').toLowerCase();
  if (!normalized) return false;
  return (
    normalized.startsWith('mailto:') ||
    normalized.startsWith('tel:') ||
    normalized.startsWith('#')
  );
}
