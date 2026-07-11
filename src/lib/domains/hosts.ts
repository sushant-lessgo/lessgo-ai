const DEFAULT_APP_HOSTS = ['lessgo.ai', 'localhost', 'vercel.app'];

function getAppHosts(): string[] {
  const env = process.env.LESSGO_APP_HOSTS;
  if (!env) return DEFAULT_APP_HOSTS;
  return env.split(',').map((h) => h.trim().toLowerCase()).filter(Boolean);
}

/**
 * True if host is owned by Lessgo (app itself, not a user's custom domain).
 * Matches exact host or any subdomain of the configured suffixes.
 * Configure via env: LESSGO_APP_HOSTS=lessgo.ai,localhost,vercel.app
 */
export function isLessgoAppHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const h = host.toLowerCase().split(':')[0];
  if (!h) return false;
  const appHosts = getAppHosts();
  return appHosts.some((suffix) => h === suffix || h.endsWith(`.${suffix}`));
}

/**
 * Host that published pages live on: `{slug}.lessgo.site`. Overridable via env.
 * The app itself (dashboard/marketing) stays on lessgo.ai — this is publish-only.
 */
export const PUBLISH_HOST = (process.env.LESSGO_PUBLISH_HOST || 'lessgo.site').toLowerCase();

// Legacy suffix kept so already-shared `.lessgo.ai` links keep resolving.
const PUBLISH_SUFFIXES = Array.from(new Set([PUBLISH_HOST, 'lessgo.ai']));

/** Canonical published host for a slug (the one we display/return). */
export function publishedSubdomainHost(slug: string): string {
  return `${slug}.${PUBLISH_HOST}`;
}

/**
 * Every host a published page is reachable on. KV routes are written for all of
 * them so both the new `.lessgo.site` and legacy `.lessgo.ai` serve the same blob.
 */
export function publishSubdomainHosts(slug: string): string[] {
  return PUBLISH_SUFFIXES.map((s) => `${slug}.${s}`);
}

// Labels that are never a published slug on either suffix. `app` is reserved so
// `app.lessgo.ai` (the product app host) is not swallowed by Branch A as a slug.
const RESERVED_PUBLISH_LABELS = new Set(['www', 'lessgo', 'app']);

/**
 * Middleware Branch-A matcher: if `host` is a single-label published subdomain
 * (`{slug}.lessgo.site` or legacy `{slug}.lessgo.ai`), return the slug label,
 * else null. Reserved labels (`www`, apex `lessgo`, app `app`) return null.
 */
export function matchPublishSubdomain(host?: string | null): string | null {
  if (!host) return null;
  const h = host.toLowerCase().split(':')[0];
  if (!h) return null;
  const suffix = PUBLISH_SUFFIXES.find((s) => h.endsWith(`.${s}`));
  if (!suffix) return null;
  const label = h.slice(0, h.length - suffix.length - 1);
  if (!label || label.includes('.') || RESERVED_PUBLISH_LABELS.has(label)) return null;
  return label;
}
