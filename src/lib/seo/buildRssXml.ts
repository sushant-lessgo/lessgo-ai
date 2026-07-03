/**
 * RSS 2.0 builder for a published site's blog (Blog P2). Same design as
 * buildSitemapXml: pure + dependency-free so it unit-tests without Prisma.
 * Excerpt-only items (no content:encoded body — deferred). <link>s always use
 * the canonical host. Caller filters to published, non-noIndex posts.
 */

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface RssPost {
  slug: string;
  title: string;
  excerpt?: string | null;
  publishedAt?: Date | null;
}

export function buildRssXml(opts: {
  canonicalHost: string;
  siteTitle: string;
  posts: RssPost[];
}): string {
  const base = `https://${opts.canonicalHost}`;
  const channelTitle = opts.siteTitle ? `Blog — ${opts.siteTitle}` : 'Blog';
  const newest = opts.posts
    .map((p) => p.publishedAt)
    .filter((d): d is Date => d instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const items = opts.posts
    .map((p) => {
      const link = `${base}/blog/${xmlEscape(p.slug)}`;
      return [
        '  <item>',
        `    <title>${xmlEscape(p.title)}</title>`,
        `    <link>${link}</link>`,
        `    <guid isPermaLink="true">${link}</guid>`,
        ...(p.publishedAt ? [`    <pubDate>${p.publishedAt.toUTCString()}</pubDate>`] : []),
        ...(p.excerpt ? [`    <description>${xmlEscape(p.excerpt)}</description>`] : []),
        '  </item>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `  <title>${xmlEscape(channelTitle)}</title>`,
    `  <link>${base}/blog</link>`,
    `  <description>${xmlEscape(`Articles and updates${opts.siteTitle ? ` from ${opts.siteTitle}` : ''}.`)}</description>`,
    `  <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>`,
    ...(newest ? [`  <lastBuildDate>${newest.toUTCString()}</lastBuildDate>`] : []),
    items,
    '</channel>',
    '</rss>',
    '',
  ].join('\n');
}
