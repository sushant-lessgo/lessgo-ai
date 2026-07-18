import { publishedSubdomainHost } from '@/lib/domains/hosts';

/**
 * publishedUrl — the ONE place the app builds a user-facing live-page URL
 * (dashboard-lifecycle-actions DD8).
 *
 * Plain module: NO `'use client'`, no hooks, no DOM — safe to import from both
 * server components/route handlers and client components.
 *
 * Why it exists: dashboard surfaces were hand-building `lessgo.ai/p/{slug}`,
 * which is the INTERNAL SSR path, not the address a visitor gets. The live URL
 * is the publish subdomain `{slug}.lessgo.site` (host resolution — incl. the
 * `LESSGO_PUBLISH_HOST` override — is owned by `@/lib/domains/hosts`; this
 * module only adds the scheme + path, it never re-derives the host).
 *
 * Scope note: a custom domain, when attached and live, is the canonical host for
 * a page — see `@/lib/seo/resolvePublishedHost`. This helper is the subdomain
 * URL only (the address that always works, custom domain or not).
 */

/** Canonical live host for a slug, e.g. `acme.lessgo.site`. No scheme. */
export function publishedHost(slug: string): string {
  return publishedSubdomainHost(slug);
}

/**
 * Absolute live URL for a slug, e.g. `https://acme.lessgo.site/` or
 * `https://acme.lessgo.site/blog`. `path` is normalised to a leading slash.
 */
export function publishedUrl(slug: string, path = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `https://${publishedHost(slug)}${normalized}`;
}
