// src/modules/audience/work/injectPackages.test.ts
// Wave 2 packages quad — the facts-verbatim bullets injector + the DEFINITE
// parse-time system-key strip (image/featured/logo_image dropped at parse).

import { describe, it, expect } from 'vitest';
import { injectPackages, MAX_BULLETS } from './injectPackages';
import { parseWorkCopy } from './parseCopy';
import type { WorkGroup } from '@/lib/schemas/workFacts.schema';
import type { SectionCopy } from '@/types/generation';

function group(name: string, items?: string[]): WorkGroup {
  return {
    name,
    kind: 'category',
    price: { mode: 'on-request' },
    items: items?.map((n) => ({ name: n, photos: [] })),
  };
}

function packagesSection(tiers: Array<Record<string, unknown>>): Record<string, SectionCopy> {
  return { packages: { elements: { packages: tiers } } as unknown as SectionCopy };
}

describe('injectPackages — verbatim group items → per-tier bullets', () => {
  it('maps each group\'s item names verbatim, in facts order, positionally per tier', () => {
    const sections = packagesSection([
      { id: 'pk1', name: 'Essential', bullets: 'AI DRAFT — should be replaced' },
      { id: 'pk2', name: 'Signature' },
    ]);
    const groups = [
      group('Essential', ['One focused hour', 'A tight, retouched selection']),
      group('Signature', ['Half a day, multiple setups', 'Usage license included']),
    ];

    injectPackages(sections, groups);

    const tiers = sections.packages.elements.packages as any[];
    expect(tiers[0].bullets).toBe('One focused hour\nA tight, retouched selection');
    expect(tiers[1].bullets).toBe('Half a day, multiple setups\nUsage license included');
  });

  it('clamps to MAX_BULLETS lines', () => {
    const many = Array.from({ length: MAX_BULLETS + 5 }, (_, i) => `line ${i + 1}`);
    const sections = packagesSection([{ id: 'pk1', name: 'Big' }]);
    injectPackages(sections, [group('Big', many)]);
    const lines = (sections.packages.elements.packages as any[])[0].bullets.split('\n');
    expect(lines).toHaveLength(MAX_BULLETS);
    expect(lines[0]).toBe('line 1');
    expect(lines[MAX_BULLETS - 1]).toBe(`line ${MAX_BULLETS}`);
  });

  it('STRIPS a tier\'s bullets to empty when its matching group states no items (no fabrication)', () => {
    const sections = packagesSection([
      { id: 'pk1', name: 'Essential', bullets: 'fabricated inclusion' },
    ]);
    injectPackages(sections, [group('Essential' /* no items */)]);
    expect((sections.packages.elements.packages as any[])[0].bullets).toBe('');
  });

  it('LEAVES AI-drafted bullets untouched when facts are silent (no groups)', () => {
    const sections = packagesSection([{ id: 'pk1', name: 'Essential', bullets: 'AI draft kept' }]);
    injectPackages(sections, undefined);
    expect((sections.packages.elements.packages as any[])[0].bullets).toBe('AI draft kept');
    injectPackages(sections, []);
    expect((sections.packages.elements.packages as any[])[0].bullets).toBe('AI draft kept');
  });

  it('no-ops when the page has no packages section', () => {
    const sections: Record<string, SectionCopy> = { hero: { elements: {} } as SectionCopy };
    expect(() => injectPackages(sections, [group('X', ['a'])])).not.toThrow();
  });
});

describe('parseWorkCopy — DEFINITE system-key strip (manual-lane AI exclusion)', () => {
  it('drops AI-emitted values for fillMode:system fields (image/featured/logo_image) but keeps id + manual copy', () => {
    const raw: Record<string, SectionCopy> = {
      header: { elements: { logo_text: 'Studio Co', logo_image: 'https://evil/ai-logo.jpg' } } as unknown as SectionCopy,
      packages: {
        elements: {
          heading: 'Ways to work',
          packages: [
            { id: 'keep-me', name: 'Essential', price_line: '€250', image: 'https://evil/ai.jpg', featured: 'true', bullets: 'kept' },
          ],
        },
      } as unknown as SectionCopy,
    };

    const out = parseWorkCopy(raw, { header: 'header', packages: 'packages' }, undefined);

    // Scalar system field stripped; required manual copy survives.
    expect(out.header.elements.logo_image).toBeUndefined();
    expect(out.header.elements.logo_text).toBe('Studio Co');

    // Collection item: system fields stripped, id + manual fields preserved.
    const tier = (out.packages.elements.packages as any[])[0];
    expect(tier.image).toBeUndefined();
    expect(tier.featured).toBeUndefined();
    expect(tier.id).toBe('keep-me'); // id is the one system field kept (identity)
    expect(tier.name).toBe('Essential');
    expect(tier.bullets).toBe('kept'); // manual_preferred, not stripped
  });

  it('injects verbatim bullets when facts.groups are passed to parseWorkCopy', () => {
    const raw: Record<string, SectionCopy> = {
      packages: {
        elements: { heading: 'Ways', packages: [{ id: 'pk1', name: 'Essential', bullets: 'ai draft' }] },
      } as unknown as SectionCopy,
    };
    const out = parseWorkCopy(raw, { packages: 'packages' }, undefined, [
      group('Essential', ['Verbatim inclusion A', 'Verbatim inclusion B']),
    ]);
    expect((out.packages.elements.packages as any[])[0].bullets).toBe(
      'Verbatim inclusion A\nVerbatim inclusion B'
    );
  });
});
