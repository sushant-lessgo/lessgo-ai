// src/modules/audience/work/parseCopy.test.ts
import { describe, it, expect } from 'vitest';
import {
  parseWorkCopy,
  validateWorkCopyCompleteness,
  resolveWorkSchema,
  backfillWorkCollectionIds,
} from './parseCopy';
import type { SectionCopy } from '@/types/generation';

const uiblocks = {
  hero: 'hero',
  work: 'work',
  proof: 'proof',
  about: 'about',
};

function rawCopy(): Record<string, SectionCopy> {
  return {
    hero: { elements: { role_line: 'Photography', name: 'Studio Vero', cta_label: 'Enquire' } },
    work: {
      elements: {
        heading: 'Selected work',
        groups: [
          { name: 'Weddings', cover_image: '', href: '#weddings' },
          { name: 'Editorial', cover_image: '', href: '#editorial' },
        ],
      },
    },
    proof: { elements: { heading: 'What clients say' } },
    about: { elements: { heading: 'About', bio: 'A short true story.' } },
  };
}

describe('resolveWorkSchema', () => {
  it('resolves a work section to its frozen contract schema', () => {
    expect(resolveWorkSchema('proof')?.sectionType).toBe('proof');
    expect(resolveWorkSchema('about')?.sectionType).toBe('about');
  });
  it('returns null for an unknown section', () => {
    expect(resolveWorkSchema('nope')).toBeNull();
  });
});

describe('parseWorkCopy', () => {
  it('injects the seller praise verbatim into proof.quotes', () => {
    const praise = ['The photos still make us cry.', 'Worth every penny.'];
    const out = parseWorkCopy(rawCopy(), uiblocks, praise);
    const quotes = out.proof.elements.quotes as Array<{ text: string; id?: string }>;

    expect(quotes.map((q) => q.text)).toEqual(praise);
    // Story section is `about`, DISTINCT from proof — untouched by praise.
    expect((out.about.elements as Record<string, unknown>).bio).toBe('A short true story.');
  });

  it('backfills stable ids on every collection item (work groups + praise quotes)', () => {
    const out = parseWorkCopy(rawCopy(), uiblocks, ['Great work.']);
    const groups = out.work.elements.groups as Array<{ id: string }>;
    const quotes = out.proof.elements.quotes as Array<{ id: string }>;

    expect(groups.every((g) => typeof g.id === 'string' && g.id.length > 0)).toBe(true);
    expect(quotes.every((q) => typeof q.id === 'string' && q.id.length > 0)).toBe(true);
  });

  it('never pads work groups beyond the stated items', () => {
    const out = parseWorkCopy(rawCopy(), uiblocks, []);
    const groups = out.work.elements.groups as unknown[];
    expect(groups).toHaveLength(2); // exactly the two raw groups, no padding
  });

  it('is idempotent on ids (re-parse preserves them)', () => {
    const once = parseWorkCopy(rawCopy(), uiblocks, ['x']);
    const firstId = (once.work.elements.groups as Array<{ id: string }>)[0].id;
    const twice = backfillWorkCollectionIds(once, uiblocks);
    expect((twice.work.elements.groups as Array<{ id: string }>)[0].id).toBe(firstId);
  });
});

describe('validateWorkCopyCompleteness', () => {
  it('flags missing sections', () => {
    const partial: Record<string, SectionCopy> = {
      hero: { elements: { name: 'x' } },
      work: { elements: {} }, // empty → missing
    };
    const res = validateWorkCopyCompleteness(partial, { hero: 'hero', work: 'work', proof: 'proof' });
    expect(res.complete).toBe(false);
    expect(res.missingSections).toContain('work');
    expect(res.missingSections).toContain('proof');
  });

  it('reports complete when every section has elements', () => {
    const full = parseWorkCopy(rawCopy(), uiblocks, ['x']);
    const res = validateWorkCopyCompleteness(full, uiblocks);
    expect(res.complete).toBe(true);
  });
});
