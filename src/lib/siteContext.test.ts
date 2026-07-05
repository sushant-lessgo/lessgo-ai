// Unit tests for the pure parts of the SiteContext layer (normalizeUrlKey +
// prompt-block rendering). DB-touching functions (getFreshSiteContext /
// upsertSiteContext) are exercised by the manual Phase-1 verification
// (scrape twice → second call cached:true, 0 credits).

import { describe, it, expect } from 'vitest';
import {
  normalizeUrlKey,
  buildSiteContextPromptBlock,
  type SiteFact,
  type SiteExcerpt,
} from './siteContext';

describe('normalizeUrlKey', () => {
  it('lowercases the host and strips www', () => {
    expect(normalizeUrlKey('https://WWW.GoldenShadowTrading.com')).toBe('goldenshadowtrading.com');
  });

  it('drops path, query, hash, and trailing slash (origin-level key)', () => {
    expect(normalizeUrlKey('https://goldenshadowtrading.com/about-us?x=1#top')).toBe(
      'goldenshadowtrading.com'
    );
    expect(normalizeUrlKey('https://goldenshadowtrading.com/')).toBe('goldenshadowtrading.com');
  });

  it('two paths on one site share a key; different hosts do not', () => {
    expect(normalizeUrlKey('https://a.com/x')).toBe(normalizeUrlKey('http://www.a.com/y'));
    expect(normalizeUrlKey('https://a.com')).not.toBe(normalizeUrlKey('https://b.com'));
  });

  it('preserves subdomains other than www', () => {
    expect(normalizeUrlKey('https://shop.a.com')).toBe('shop.a.com');
  });

  it('throws on garbage (caller validates urls first)', () => {
    expect(() => normalizeUrlKey('not a url')).toThrow();
  });
});

describe('buildSiteContextPromptBlock', () => {
  const facts: SiteFact[] = [
    { fact: 'Manufacturing since 2009 in Dubai', topic: 'company', confidence: 'high' },
    { fact: 'Serves six industries', topic: 'service', confidence: 'medium' },
  ];
  const excerpts: SiteExcerpt[] = [
    { text: 'Wear Better, Feel Better', kind: 'voice' },
  ];

  it('returns empty string with nothing to feed (brand-new business path)', () => {
    expect(buildSiteContextPromptBlock([], [])).toBe('');
  });

  it('tags facts with confidence + topic', () => {
    const block = buildSiteContextPromptBlock(facts, []);
    expect(block).toContain('[high] (company) Manufacturing since 2009 in Dubai');
    expect(block).toContain('[medium] (service) Serves six industries');
  });

  it('frames excerpts as tone-only, never assertable', () => {
    const block = buildSiteContextPromptBlock([], excerpts);
    expect(block).toContain('TONE REFERENCE ONLY');
    expect(block).toContain('NEVER treat an excerpt as an assertable claim');
    expect(block).toContain('"Wear Better, Feel Better"');
  });

  it('frames the whole block as draw-from-improve, not imitate', () => {
    const block = buildSiteContextPromptBlock(facts, excerpts);
    expect(block).toContain('draw from it, improve on it, do NOT imitate it');
    expect(block).toContain('never-fabricate rules still apply');
  });
});
