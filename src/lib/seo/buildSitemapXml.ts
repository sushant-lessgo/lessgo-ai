/**
 * Sitemap + robots builders for published hosts (SEO track, Phase 4).
 *
 * robots.txt is ALWAYS permissive: noindex is enforced by the <meta robots> tag
 * baked into the page HTML (a robots.txt Disallow would block the crawl, so the
 * crawler would never see the noindex directive). Noindexed pages are simply
 * omitted from the sitemap.
 *
 * <loc> URLs always use the CANONICAL host (live custom domain when one exists,
 * else the {slug}.lessgo.site subdomain) so both hosts consolidate authority.
 *
 * Pure + dependency-free so it unit-tests without Prisma/KV.
 */

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Collect the sitemap paths from a published page's content JSON (nested DB
 * shape): root ('/') unless content.seo.noIndex, plus every subpage key minus
 * the noindexed ones. Root first, subpages sorted for stable output.
 */
export function collectSitemapPaths(content: any): string[] {
  const paths: string[] = [];
  if (!content?.seo?.noIndex) paths.push('/');
  const subpages = content?.subpages && typeof content.subpages === 'object' ? content.subpages : {};
  const subPaths = Object.entries(subpages)
    .filter(([, sub]: [string, any]) => sub && !sub.seo?.noIndex)
    .map(([p]) => (p.startsWith('/') ? p : `/${p}`))
    .filter((p) => p !== '/')
    .sort();
  return [...paths, ...subPaths];
}

/**
 * Blog (Phase 1): append '/blog' + '/blog/{slug}' for the given PUBLISHED posts.
 * Zero posts → paths unchanged (the index only exists when posts do). Posts with
 * seo.noIndex are omitted (their pages carry the meta robots tag). Pure — the
 * sitemap route does the DB query.
 */
export function appendBlogPaths(
  paths: string[],
  posts: Array<{ slug: string; seo?: any }>
): string[] {
  if (!posts.length) return paths;
  const postPaths = posts
    .filter((p) => !p.seo?.noIndex)
    .map((p) => `/blog/${p.slug}`)
    .sort();
  return [...paths, '/blog', ...postPaths];
}

export function buildSitemapXml(opts: {
  canonicalHost: string;
  lastPublishAt?: Date | null;
  paths: string[];
}): string {
  const lastmod = opts.lastPublishAt ? opts.lastPublishAt.toISOString().slice(0, 10) : null;
  const urls = opts.paths
    .map((path) => {
      const loc = `https://${opts.canonicalHost}${path === '/' ? '' : xmlEscape(path)}`;
      return `  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function buildRobotsTxt(canonicalHost: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: https://${canonicalHost}/sitemap.xml\n`;
}
