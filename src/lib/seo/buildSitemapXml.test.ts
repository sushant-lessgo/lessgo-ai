import { describe, it, expect } from 'vitest';
import { buildSitemapXml, buildRobotsTxt, collectSitemapPaths } from './buildSitemapXml';

describe('collectSitemapPaths', () => {
  it('root-only page', () => {
    expect(collectSitemapPaths({ layout: {}, content: {} })).toEqual(['/']);
  });

  it('multi-page: root first, subpages normalized + sorted', () => {
    const content = {
      subpages: {
        '/gallery': { layout: {}, content: {} },
        'contact': { layout: {}, content: {} }, // no leading slash → normalized
        '/products/nwc-2000': { layout: {}, content: {} },
      },
    };
    expect(collectSitemapPaths(content)).toEqual(['/', '/contact', '/gallery', '/products/nwc-2000']);
  });

  it('omits noindexed root and subpages', () => {
    const content = {
      seo: { noIndex: true },
      subpages: {
        '/gallery': { seo: { noIndex: true } },
        '/contact': { layout: {} },
      },
    };
    expect(collectSitemapPaths(content)).toEqual(['/contact']);
  });

  it('tolerates missing/garbage content', () => {
    expect(collectSitemapPaths(null)).toEqual(['/']);
    expect(collectSitemapPaths({ subpages: 'nope' })).toEqual(['/']);
  });
});

describe('buildSitemapXml', () => {
  it('emits locs on the canonical host with lastmod', () => {
    const xml = buildSitemapXml({
      canonicalHost: 'scalifixai.com',
      lastPublishAt: new Date('2026-07-01T12:34:56Z'),
      paths: ['/', '/gallery'],
    });
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://scalifixai.com</loc>');
    expect(xml).toContain('<loc>https://scalifixai.com/gallery</loc>');
    expect(xml.match(/<lastmod>2026-07-01<\/lastmod>/g)).toHaveLength(2);
  });

  it('omits lastmod when lastPublishAt is null', () => {
    const xml = buildSitemapXml({ canonicalHost: 'acme.lessgo.site', lastPublishAt: null, paths: ['/'] });
    expect(xml).not.toContain('<lastmod>');
  });

  it('XML-escapes path characters', () => {
    const xml = buildSitemapXml({ canonicalHost: 'a.lessgo.site', paths: ['/a&b<c'] });
    expect(xml).toContain('<loc>https://a.lessgo.site/a&amp;b&lt;c</loc>');
  });
});

describe('buildRobotsTxt', () => {
  it('is permissive with a Sitemap line — never a Disallow (noindex is a meta tag)', () => {
    expect(buildRobotsTxt('scalifixai.com')).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://scalifixai.com/sitemap.xml\n'
    );
    expect(buildRobotsTxt('scalifixai.com')).not.toContain('Disallow');
  });
});
