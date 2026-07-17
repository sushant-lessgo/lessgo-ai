// src/lib/publishSanitizer.ts
//
// THE publish-gate engine. Server-only (NO 'use client'; never imported by a
// published renderer or a client component). Called only from the publish API
// flow — this is the ONE canonical chokepoint that cleans user-authored content
// before it is frozen into a PublishedPage snapshot + rendered to static HTML.
//
// Two independent boundaries live here:
//   1. HTML allow-policy  — DOMPurify + jsdom, adapted from EDITOR_PROFILE (the
//      only htmlSanitizer profile that keeps <a>). Real DOM parse, not regex.
//   2. URL / embed scheme-gate — a pattern-based (suffix-matched) key detector
//      routes every url-bearing / iframe-src field through isSafeURL (single-
//      sourced from headTags.ts), replacing unsafe schemes with an inert value.
//
// NOT a security boundary (explicitly out of scope): the regex paths in
// `sanitizeHTMLServer` (src/lib/htmlSanitizer.ts) and `sanitizeWithDOMPurify`
// (src/utils/htmlSanitization.ts). Those are legacy best-effort scrubbers; the
// DOMPurify parse below is the real thing. Do not treat the regex paths as the
// boundary.
//
// Documented, accepted tradeoffs:
//   (a) Plain-text `<` entity-encoding — the fast-path (`!html.includes('<')`)
//       skips DOMPurify for the ~90% of fields with no tags, so plain copy is
//       byte-identical. But a plain-text field that legitimately contains `<`
//       (e.g. "price < 5") is NOT fast-pathed → DOMPurify entity-encodes it
//       ("price &lt; 5"). Rare, safe direction, accepted.
//   (b) Over-gate bias on URL keys — an unsafe OR unrecognized url-key value
//       becomes a visible-in-QA dead link ('#'); under-gating is silent stored
//       XSS. When in doubt we GATE. Two accepted over-gates: (i) a hypothetical
//       prose field whose key ends in `url`/`link` would be scheme-gated (grep
//       confirms none exist today); (ii) a `slug`/`pathSlug` value without a
//       leading `/` fails isSafeURL → '#' (pickers emit '/'-prefixed; not a bug).
//   (c) Embed drop is destructive — a false-positive `endsWith('embed')` key
//       whose value is non-iframe would be dropped to ''. Today ONLY `map_embed`
//       carries that suffix; no non-iframe `*embed` key exists. Accepted.
//
// See docs/task/publish-sanitize.plan.md (phase 1) + .spec.md for full intent.

import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import type { DOMPurify as DOMPurifyInstance } from 'dompurify';
import { isSafeURL } from '@/lib/staticExport/headTags';
import { sanitizeStyleAttribute } from '@/lib/htmlSanitizer';

// ── HTML allow-policy ───────────────────────────────────────────────────────
//
// Adapted from EDITOR_PROFILE (the keep-<a> profile), NOT reinvented. `class` is
// kept because EDITOR_PROFILE keeps it and it is not an executable sink; the
// TextToolbarMVP emits inline `style` only (never `class`), but AI-generated /
// template-seeded content may carry class names we must not strip.
const ALLOWED_TAGS = [
  'a', 'b', 'strong', 'i', 'em', 'u', 's', 'br', 'p', 'div', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote',
];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'style', 'class'];
// FORBID_TAGS: user-authored embed/script vectors. (Template-authored JSX iframes
// whose src comes from content — map_embed, video_url — are NOT this pass's job;
// the embed-gate below covers those.) `style` as a TAG is forbidden; `style` as
// an ATTR is allowed (whitelisted via sanitizeStyleAttribute).
const FORBID_TAGS = [
  'script', 'style', 'iframe', 'object', 'embed', 'form',
  'link', 'meta', 'base', 'svg', 'math',
];
// on* handlers are stripped by DOMPurify by default; srcdoc is a known iframe
// breakout vector we forbid explicitly for defense-in-depth.
const FORBID_ATTR = ['srcdoc'];

let _purifier: DOMPurifyInstance | null = null;

/**
 * Lazy jsdom-backed DOMPurify singleton. Lazy so a publish cold-start doesn't pay
 * the jsdom construction cost until the first sanitize; cached module-wide after.
 * Mirrors the jsdom import idiom in src/lib/scrape/fetchSite.ts.
 */
function getPurifier(): DOMPurifyInstance {
  if (_purifier) return _purifier;
  const window = new JSDOM('').window;
  const purifier = createDOMPurify(window as unknown as Window & typeof globalThis);

  // style attr → whitelist props; href attr → scheme-gate. Drop on failure.
  purifier.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName === 'style') {
      const cleaned = sanitizeStyleAttribute(data.attrValue);
      if (!cleaned) {
        data.keepAttr = false;
      } else {
        data.attrValue = cleaned;
      }
      return;
    }
    if (data.attrName === 'href') {
      if (!isSafePublishedUrl(data.attrValue)) {
        data.keepAttr = false;
      }
    }
  });

  // Tab-nabbing hardening: any surviving target="_blank" gets rel~=noopener.
  // Runs after per-node attr processing so we see the final attribute set.
  purifier.addHook('afterSanitizeAttributes', (node) => {
    const el = node as Element;
    if (el.getAttribute && el.getAttribute('target') === '_blank') {
      const rel = el.getAttribute('rel') || '';
      if (!/\bnoopener\b/.test(rel)) {
        el.setAttribute('rel', rel ? `${rel} noopener` : 'noopener');
      }
    }
  });

  _purifier = purifier;
  return purifier;
}

/**
 * Sanitize a user-authored HTML string with the publish allow-policy.
 *
 * Fast-path: a string with no `<` cannot contain an element, so we skip DOMPurify
 * entirely — this preserves plain-copy byte-identity (DOMPurify would otherwise
 * entity-normalize `a & b` → `a &amp; b`, which some blocks render as React text
 * children rather than innerHTML). See tradeoff (a) in the module JSDoc.
 *
 * NOTE this fast-path is exactly why URLs need their OWN gate: a bare
 * "javascript:alert(1)" string has no `<` and would sail through untouched.
 */
export function sanitizePublishedHtml(html: string): string {
  if (!html || typeof html !== 'string') return html;
  if (!html.includes('<')) return html;
  return getPurifier().sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS,
    FORBID_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

// ── URL scheme-gate ─────────────────────────────────────────────────────────

/**
 * Publish-side URL safety predicate. Wraps (does NOT fork) the single-sourced
 * `isSafeURL` from headTags.ts (https/http/root-relative; rejects
 * javascript:/data:/vbscript:/protocol-relative; strips control chars), OR'd with
 * the three schemes published pages legitimately need but isSafeURL rejects:
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

/**
 * Gate a url-bearing value. Empty/whitespace passes through unchanged (no link).
 * Safe → unchanged. Unsafe → inert '#' (link stays clickable-but-dead; layout
 * unbroken; resolveDestination downstream never throws). Idempotent ('#' → '#').
 */
export function sanitizePublishedUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;
  return isSafePublishedUrl(url) ? url : '#';
}

/**
 * Pattern-based URL-key detector (PRIMARY defense — a suffix match, not a
 * hand-list, so it subsumes every `_href`/`_url` sink variant). Case-insensitive.
 *
 * Coded verbatim per the plan:
 *   endsWith('href')  → href, cta_href, secondary_cta_href, whatsapp_href, …
 *   endsWith('url')   → url, fileUrl, signin_url, book_call_url, calendly_url, …
 *   endsWith('link')  → link, cta_link, …
 *   endsWith('slug')  → slug, pathSlug, …
 */
export function isUrlContentKey(key: string): boolean {
  const k = key.toLowerCase();
  return (
    k.endsWith('href') ||
    k.endsWith('url') ||
    k.endsWith('link') ||
    k.endsWith('slug')
  );
}

/**
 * Explicit escape hatch, seeded EMPTY. The phase-2 sink grep reconciles: any
 * grep-found href/iframe-src key NOT matched by isUrlContentKey lands here (or the
 * pattern is widened) — the audit records the reconciliation either way.
 */
export const EXTRA_URL_KEYS: string[] = [];

/**
 * URL keys EXEMPT from the scheme-gate. A key qualifies ONLY if EVERY reader
 * (grep-verified) routes it through a render-side normalizer that is safe by
 * construction — no input scheme can survive.
 *
 * `video_url` qualifies: every reader goes through `ytEmbed`
 * (src/modules/templates/techpremium/blocks/Explainer/ytEmbed.ts), which
 * regex-extracts an 11-char [\w-] YouTube id and interpolates it into a FIXED
 * https://www.youtube-nocookie.com/embed/… string, or returns ''. Exemption is
 * REQUIRED (not optional): users legitimately store bare 11-char video IDs, which
 * fail isSafeURL → gating would turn them into '#' and break live videos on
 * re-publish (violating the no-semantic-change guarantee).
 */
export const EXEMPT_URL_KEYS: string[] = ['video_url'];

// ── Embed-src gate ──────────────────────────────────────────────────────────

/**
 * True for content keys whose value a template renders into an <iframe src>.
 * Checked BEFORE isUrlContentKey in dispatch (embed values may be full iframe
 * pastes, not plain URLs). Today only `map_embed` matches.
 */
export function isEmbedContentKey(key: string): boolean {
  return key.toLowerCase().endsWith('embed');
}

/**
 * Gate a content-derived iframe src. The value may be EITHER a bare embed URL OR a
 * full pasted <iframe src="…"> snippet (matches what mapEmbedSrc accepts — this
 * gate is a superset by design: https-only, no host-pin, so it also covers any
 * future non-host-pinned embed reader).
 *
 * Extract the candidate src (from `src="…"` if the value contains `<`, else the
 * raw value), require it parses as a URL with protocol `https:` (iframes get no
 * mailto:/tel:/#/relative allowance; http = mixed content). Safe → return the
 * ORIGINAL value UNCHANGED (render-side mapEmbedSrc keeps doing the extraction —
 * no stored rewrite, no semantic change). Unsafe / no extractable src /
 * unparseable → '' (blocks render "no embed" for empty; '#' is meaningless as an
 * iframe src). Idempotent ('' → '').
 */
export function sanitizePublishedEmbed(value: string): string {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const m = trimmed.includes('<') ? trimmed.match(/src=["']([^"']+)["']/i) : null;
  const candidate = trimmed.includes('<') ? (m ? m[1] : '') : trimmed;
  if (!candidate) return '';
  try {
    const u = new URL(candidate);
    if (u.protocol !== 'https:') return '';
    return value;
  } catch {
    return '';
  }
}
