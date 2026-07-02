/**
 * Canonical / social URL resolution for published static pages.
 *
 * A published page is served on either its `{slug}.lessgo.ai` subdomain or, once a
 * custom domain is live, that custom domain (the subdomain then 301s to it). The
 * canonical + og:url + twitter:url must point at the host the page actually lives on,
 * and at the page's own path so multi-page subpages don't all claim the root URL.
 *
 * Pure + dependency-free so it can be unit-tested without the server-only render stack.
 */
export function resolveCanonicalURL(opts: {
  slug: string;
  canonicalDomain?: string;
  canonicalPath?: string;
}): string {
  const host = opts.canonicalDomain || `${opts.slug}.lessgo.ai`;
  const path =
    opts.canonicalPath && opts.canonicalPath !== '/' ? opts.canonicalPath : '';
  return `https://${host}${path}`;
}
