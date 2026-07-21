// src/lib/i18n/publishedLocale.ts — language-settings phase 6.
//
// PLAIN module — NOT `'use client'`. The `/p/[slug]` SSR routes (server
// components) import it, so it must stay server-safe (published/client
// boundary law). No React, no DOM, no prisma.
//
// Purpose: give the SSR renderer the same locale semantics the static export
// already has, so the blob HTML and the `/p/{slug}` SSR fallback behave
// IDENTICALLY (dual-renderer parity):
//   • which path segment is a locale prefix (mirrors switcher.v2 `segAt`),
//   • the `window.__lessgoLocales` config stamped for the switcher,
//   • the hreflang alternates map.
//
// Overlay resolution deliberately lives elsewhere: SSR callers apply overlays by
// calling `resolveLocaleElements` (localeContent.ts) DIRECTLY, exactly as
// renderPublishedExport does. No wrapper — one implementation only.

import type { LocaleConfig } from '@/types/core/content';
import { isMultiLocale } from './localeContent';
import { resolveCanonicalURL } from '@/lib/staticExport/canonicalUrl';
import { isLessgoAppHost, matchPublishSubdomain } from '@/lib/domains/hosts';

/** SSR script src — RELATIVE on purpose (see `switcherTagsForSsr`). */
export const SWITCHER_SCRIPT_SRC = '/assets/switcher.v2.js';

/**
 * Split a `/p/{slug}/...` subpath into [declared non-default locale, remainder].
 *
 * Mirrors switcher.v2's `segAt`: only the FIRST segment counts, only when it is
 * a DECLARED locale that is NOT the default (default-locale content lives at the
 * bare path — there is no `/en/...` doc). Single-locale configs (incl. the
 * ruling-10 "declared single non-English locale" shape) never create locale
 * routes, so they always return null.
 *
 * Returns null when the request is not a locale route ⇒ callers keep their exact
 * pre-change code path.
 */
export function resolvePublishedLocale(
  config: LocaleConfig | null | undefined,
  segments: string[] | null | undefined,
): { locale: string; remainder: string[] } | null {
  if (!isMultiLocale(config)) return null;
  const segs = (segments || []).filter((s) => typeof s === 'string' && s.length > 0);
  if (segs.length === 0) return null;
  const first = segs[0];
  if (first === config!.defaultLocale) return null;
  if (!config!.locales.includes(first)) return null;
  return { locale: first, remainder: segs.slice(1) };
}

/**
 * The base path the SSR-rendered document is SERVED under, from the server's own
 * knowledge of the request host — stamped into the switcher config so the client
 * never has to guess.
 *
 * Why not leave it to the client's runtime detection: switcher.v2's hostname gate
 * only recognises `lessgo.ai` / `lessgo.site` / `localhost`, so a preview
 * deployment (`*.vercel.app/p/{slug}`) would compute `''` and rebuild
 * `/nl/p/{slug}` — a 404 in exactly the QA sandbox we test in. The server knows
 * its mount path with certainty; the client keeps runtime detection only as the
 * fallback for already-published blobs (which stamp no basePath).
 *
 * Rule: middleware rewrites published-subdomain and custom-domain requests to
 * `/p/{slug}{path}` INTERNALLY (src/middleware.ts:134,162) — the browser pathname
 * on those hosts carries no `/p` prefix, so basePath is ''. Every other host that
 * can reach this route (localhost, *.vercel.app, lessgo.ai, app.lessgo.ai) is
 * hitting the literal `/p/{slug}` URL.
 */
export function resolveSsrBasePath(host: string | null | undefined, slug: string): string {
  if (!host || !slug) return '';
  // Published subdomain ({slug}.lessgo.site / legacy .lessgo.ai) ⇒ rewritten.
  if (matchPublishSubdomain(host)) return '';
  // Custom domain (not a Lessgo-owned host) ⇒ rewritten.
  if (!isLessgoAppHost(host)) return '';
  return `/p/${slug}`;
}

/**
 * The inline `window.__lessgoLocales` payload, with the SAME `<` escaping the
 * static generator uses (htmlGenerator.ts) so the two surfaces stamp identical
 * configs. `basePath` is the one SSR-only addition.
 */
export function switcherConfigJson(cfg: {
  locales: string[];
  defaultLocale: string;
  current: string;
  slug: string;
  style: 'dropdown' | 'none';
  basePath: string;
}): string {
  return JSON.stringify({
    locales: cfg.locales,
    defaultLocale: cfg.defaultLocale,
    current: cfg.current,
    slug: cfg.slug,
    style: cfg.style,
    basePath: cfg.basePath,
  }).replace(/</g, '\\u003c');
}

/**
 * Everything the SSR pages need to inject the switcher, or null when nothing
 * should be injected. Suppression semantics are phase 5's, verbatim:
 * single/absent locale config ⇒ nothing; `switcherStyle: 'none'` ⇒ nothing
 * (no pill AND no geo redirect). hreflang is NOT affected by style (SEO-safe).
 *
 * The script src is RELATIVE (unlike the blob's absolute `{assetBase}/assets/…`):
 * this document is served BY the app itself on whatever host the visitor used, and
 * `/assets/*.js` is excluded from the middleware matcher, so a relative src always
 * resolves against the deployment actually serving the page — including preview
 * deployments, where an absolute prod URL would load the wrong (or missing) build.
 */
export function switcherTagsForSsr(args: {
  config: LocaleConfig | null | undefined;
  current: string;
  slug: string;
  /**
   * LAZY on purpose: callers pass `() => headers().get('host')`. `headers()` opts a
   * route out of static/ISR rendering, so it must only be touched when a switcher is
   * actually going to be emitted — a monolingual page never calls it and keeps its
   * ISR behavior exactly as before (zero-diff).
   */
  host: () => string | null | undefined;
}): { configScript: string; scriptSrc: string } | null {
  const { config } = args;
  if (!isMultiLocale(config)) return null;
  const style = config!.switcherStyle ?? 'dropdown';
  if (style === 'none') return null;
  return {
    configScript: `window.__lessgoLocales=${switcherConfigJson({
      locales: config!.locales,
      defaultLocale: config!.defaultLocale,
      current: args.current,
      slug: args.slug,
      style,
      basePath: resolveSsrBasePath(args.host(), args.slug),
    })}`,
    scriptSrc: SWITCHER_SCRIPT_SRC,
  };
}

/**
 * hreflang map for Next's `alternates.languages`, matching the static export's
 * `buildAlternates` (renderPublishedExport.ts:128-140) — reciprocal entries for
 * every declared locale + `x-default` at the default locale. Empty (⇒ callers omit
 * the key) for single/absent configs.
 *
 * `barePath` is the DEFAULT-locale path of the page ('/' for the root, '/about'
 * for a subpage); locale paths are that path prefixed with `/{loc}`.
 */
export function buildLocaleAlternateMap(args: {
  config: LocaleConfig | null | undefined;
  slug: string;
  canonicalDomain?: string;
  barePath: string;
}): Record<string, string> {
  const { config, slug, canonicalDomain } = args;
  if (!isMultiLocale(config)) return {};
  const bare = args.barePath || '/';
  const pathFor = (loc: string) =>
    loc === config!.defaultLocale ? bare : bare === '/' ? `/${loc}` : `/${loc}${bare}`;
  const hrefFor = (loc: string) =>
    resolveCanonicalURL({ slug, canonicalDomain, canonicalPath: pathFor(loc) });
  const out: Record<string, string> = {};
  for (const loc of config!.locales) out[loc] = hrefFor(loc);
  out['x-default'] = hrefFor(config!.defaultLocale);
  return out;
}
