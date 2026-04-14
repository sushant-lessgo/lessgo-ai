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
