// src/modules/skeletons/styleTokens.test.ts
// section-background phase 1 — `resolveSectionSurface` (the RESOLVER only).
//
// The SERIALIZER (`serializeStyleTokens`, incl. the `--u-bg`/`--u-fg` contrast-pair
// invariant) is tested in its established home,
// `src/modules/skeletons/work/tokenContract.test.ts` — deliberately not split.

import { describe, it, expect } from 'vitest';
import { resolveSectionSurface, type StyleTokens } from './styleTokens';

const FALLBACK = 'paper'; // stands in for tmpl.getSurfaceForSection(sectionType)

describe('resolveSectionSurface', () => {
  it('returns the id-keyed override when one is set', () => {
    const tokens: StyleTokens = { 'about-aaa': { background: 'dark' } };
    expect(resolveSectionSurface('atelier', tokens, 'about-aaa', FALLBACK)).toBe('dark');
  });

  it('returns the fallback for absent tokens / absent section / explicit "default"', () => {
    expect(resolveSectionSurface('atelier', null, 'about-aaa', FALLBACK)).toBe(FALLBACK);
    expect(resolveSectionSurface('atelier', undefined, 'about-aaa', FALLBACK)).toBe(FALLBACK);
    expect(resolveSectionSurface('atelier', {}, 'about-aaa', FALLBACK)).toBe(FALLBACK);
    expect(
      resolveSectionSurface('atelier', { 'about-aaa': {} }, 'about-aaa', FALLBACK),
    ).toBe(FALLBACK);
    expect(
      resolveSectionSurface(
        'atelier',
        { 'about-aaa': { background: 'default' } },
        'about-aaa',
        FALLBACK,
      ),
    ).toBe(FALLBACK);
  });

  // NO-BLEED: the map is id-keyed, so a sibling section of the SAME type must be
  // untouched (this is what makes id-keying safe across multi-page projects, where
  // sectionIds are globally unique).
  it('does not bleed onto a sibling section', () => {
    const tokens: StyleTokens = { 'hero-aaa': { background: 'dark' } };
    expect(resolveSectionSurface('atelier', tokens, 'hero-aaa', FALLBACK)).toBe('dark');
    expect(resolveSectionSurface('atelier', tokens, 'hero-bbb', FALLBACK)).toBe(FALLBACK);
  });

  // GATING (D4/R5): styleTokens are project-GLOBAL while templateId is
  // user-switchable — an ungated resolver would leak a work-skeleton surface onto
  // hearth/lex after a template switch.
  it('ignores overrides for non-skeleton templates (template-switch leak)', () => {
    const tokens: StyleTokens = { 'about-aaa': { background: 'dark' } };
    for (const templateId of ['hearth', 'lex', 'meridian', 'techpremium', null, undefined]) {
      expect(resolveSectionSurface(templateId, tokens, 'about-aaa', 'cream')).toBe('cream');
    }
  });

  it('honours every non-default surface value on a skeleton template', () => {
    for (const background of ['paper', 'paper-2', 'dark', 'accent'] as const) {
      expect(
        resolveSectionSurface('atelier', { 'about-aaa': { background } }, 'about-aaa', FALLBACK),
      ).toBe(background);
    }
  });
});
