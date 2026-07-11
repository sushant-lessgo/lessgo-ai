import { describe, it, expect } from 'vitest';
import { matchPublishSubdomain, isLessgoAppHost } from './hosts';

describe('matchPublishSubdomain — reserved labels', () => {
  it('reserves `app` on the legacy .lessgo.ai suffix (required assertion)', () => {
    expect(matchPublishSubdomain('app.lessgo.ai')).toBe(null);
  });

  it('reserves `app` on the .lessgo.site suffix', () => {
    expect(matchPublishSubdomain('app.lessgo.site')).toBe(null);
  });

  it('reserves `www`', () => {
    expect(matchPublishSubdomain('www.lessgo.ai')).toBe(null);
    expect(matchPublishSubdomain('www.lessgo.site')).toBe(null);
  });

  it('still matches a normal slug', () => {
    expect(matchPublishSubdomain('scalifixai.lessgo.site')).toBe('scalifixai');
    expect(matchPublishSubdomain('scalifixai.lessgo.ai')).toBe('scalifixai');
  });

  it('returns null for multi-label and empty hosts', () => {
    expect(matchPublishSubdomain('a.b.lessgo.site')).toBe(null);
    expect(matchPublishSubdomain('')).toBe(null);
    expect(matchPublishSubdomain(null)).toBe(null);
  });
});

describe('isLessgoAppHost', () => {
  it('treats app.lessgo.ai as a lessgo-owned app host', () => {
    expect(isLessgoAppHost('app.lessgo.ai')).toBe(true);
  });
});
