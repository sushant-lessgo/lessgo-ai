/**
 * Pure, edge-safe host/path decisions for the app-subdomain split.
 *
 * This module is imported by `src/middleware.ts` (edge runtime). It MUST stay
 * free of 'use client', React, and Node-only APIs so it can run at the edge and
 * be unit-tested in isolation (decision D3). All new host/path routing logic
 * lives here as pure functions; the middleware only calls them.
 *
 * Rollout flag: `NEXT_PUBLIC_DASHBOARD_URL` (app-host origin). Unset → every
 * apex→app decision returns null, so behaviour is unchanged (decision D1/D4).
 */
import { publishedSubdomainHost } from './hosts';

/** Apex marketing hosts (exact, port-stripped, lowercased). */
export const APEX_HOSTS = ['lessgo.ai', 'www.lessgo.ai'] as const;

/**
 * App-host origin, derived from `NEXT_PUBLIC_DASHBOARD_URL` when set, else the
 * literal fallback. Read lazily so `vi.stubEnv` in tests takes effect.
 */
export function appOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_DASHBOARD_URL;
  return raw && raw.trim() ? raw.trim().replace(/\/+$/, '') : null;
}

/** App host label (`app.lessgo.ai`), derived from the dashboard URL when set. */
export const APP_HOST: string = (() => {
  const raw = process.env.NEXT_PUBLIC_DASHBOARD_URL;
  if (raw && raw.trim()) {
    try {
      return new URL(raw.trim()).host.toLowerCase().split(':')[0];
    } catch {
      /* fall through to literal */
    }
  }
  return 'app.lessgo.ai';
})();

function normalizeHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const h = host.toLowerCase().split(':')[0];
  return h || null;
}

/** True only for exact apex prod hosts (localhost / *.vercel.app → false). */
export function isApexProdHost(host: string | null | undefined): boolean {
  const h = normalizeHost(host);
  return h != null && (APEX_HOSTS as readonly string[]).includes(h);
}

/** True only for the exact app prod host (localhost / *.vercel.app → false). */
export function isAppProdHost(host: string | null | undefined): boolean {
  const h = normalizeHost(host);
  return h != null && h === 'app.lessgo.ai';
}

/**
 * Path prefixes that belong to the product app and are redirected apex→app.
 * Everything else (`/`, `/blog`, `/pricing`, `/privacy`, `/terms`, `/thanks`,
 * `/p`, `/api/*`, `/assets/*`, `/dev`) stays on apex.
 */
export const APP_PATH_PREFIXES = [
  '/dashboard',
  '/edit',
  '/preview',
  '/onboarding',
  '/generate',
  '/admin',
  '/t',
  '/sign-in',
  '/sign-up',
] as const;

/** True if `pathname` is under an app path prefix (exact or `/prefix/...`). */
export function isAppPath(pathname: string): boolean {
  const p = (pathname || '').split('?')[0].split('#')[0];
  return APP_PATH_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`),
  );
}

/**
 * Target URL for an apex→app redirect, or null when no redirect applies.
 *
 * Returns a target only when ALL hold: `NEXT_PUBLIC_DASHBOARD_URL` is set,
 * `host` is an exact apex prod host, and `pathAndSearch` is an app path. The
 * query string is preserved (caller passes pathname + search).
 */
export function getApexToAppRedirect(
  host: string | null | undefined,
  pathAndSearch: string,
): string | null {
  const origin = appOrigin();
  if (!origin) return null;
  if (!isApexProdHost(host)) return null;
  const pathname = (pathAndSearch || '').split('?')[0].split('#')[0];
  if (!isAppPath(pathname)) return null;
  return `${origin}${pathAndSearch}`;
}

/**
 * True only for the exact app prod host (`app.lessgo.ai`) — the host whose
 * responses must carry `X-Robots-Tag: noindex, nofollow`. Apex / localhost /
 * *.vercel.app → false (they must stay indexable / unaffected). D6: the caller
 * attaches the header ONLY post-auth; this is a pure host classifier.
 */
export function shouldNoindex(host: string | null | undefined): boolean {
  return isAppProdHost(host);
}

/**
 * Target URL for an apex `/p/{slug}` → published-subdomain 301, or null.
 *
 * When `host` is an exact apex prod host AND `pathname` is `/p/{slug}` or
 * `/p/{slug}/{subpath}`, return `https://{slug}.lessgo.site{/subpath}` (host
 * from `publishedSubdomainHost()`, so `LESSGO_PUBLISH_HOST` is respected). Else
 * null. localhost / *.vercel.app / non-`/p` paths → null (D4 untouched).
 */
export function getApexPublishRedirect(
  host: string | null | undefined,
  pathname: string,
): string | null {
  if (!isApexProdHost(host)) return null;
  const p = (pathname || '').split('?')[0].split('#')[0];
  const m = /^\/p\/([^/]+)(\/.*)?$/.exec(p);
  if (!m) return null;
  const slug = m[1];
  const subpath = m[2] || '';
  return `https://${publishedSubdomainHost(slug)}${subpath}`;
}
