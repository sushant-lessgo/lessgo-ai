// Blog (P2): RSS builder.
import { describe, it, expect } from 'vitest';
import { buildRssXml } from './buildRssXml';

const POSTS = [
  { slug: 'hello', title: 'Hello World', excerpt: 'A first post', publishedAt: new Date('2026-07-03T10:00:00Z') },
  { slug: 'older', title: 'Older & <bolder>', excerpt: null, publishedAt: new Date('2026-07-01T10:00:00Z') },
];

describe('buildRssXml', () => {
  const xml = buildRssXml({ canonicalHost: 'acme.com', siteTitle: 'Acme', posts: POSTS });

  it('channel: title, /blog link, self atom:link, lastBuildDate = newest post', () => {
    expect(xml).toContain('<title>Blog — Acme</title>');
    expect(xml).toContain('<link>https://acme.com/blog</link>');
    expect(xml).toContain('<atom:link href="https://acme.com/rss.xml" rel="self" type="application/rss+xml"/>');
    expect(xml).toContain(`<lastBuildDate>${POSTS[0].publishedAt.toUTCString()}</lastBuildDate>`);
  });

  it('items: link + permalink guid + RFC-822 pubDate; description omitted when no excerpt', () => {
    expect(xml).toContain('<link>https://acme.com/blog/hello</link>');
    expect(xml).toContain('<guid isPermaLink="true">https://acme.com/blog/hello</guid>');
    expect(xml).toContain(`<pubDate>${POSTS[0].publishedAt.toUTCString()}</pubDate>`);
    expect(xml).toContain('<description>A first post</description>');
    // the excerpt-less item has no description tag
    const olderItem = xml.slice(xml.indexOf('blog/older'));
    expect(olderItem).not.toContain('<description>');
  });

  it('XML-escapes user strings', () => {
    expect(xml).toContain('Older &amp; &lt;bolder&gt;');
    expect(xml).not.toContain('<bolder>');
  });

  it('empty site title falls back to plain Blog', () => {
    const bare = buildRssXml({ canonicalHost: 'a.lessgo.site', siteTitle: '', posts: POSTS });
    expect(bare).toContain('<title>Blog</title>');
  });

  it('no posts → valid empty channel without lastBuildDate', () => {
    const empty = buildRssXml({ canonicalHost: 'a.lessgo.site', siteTitle: 'A', posts: [] });
    expect(empty).not.toContain('<item>');
    expect(empty).not.toContain('<lastBuildDate>');
    expect(empty).toContain('</rss>');
  });
});
