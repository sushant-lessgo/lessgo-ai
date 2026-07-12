import { describe, it, expect, vi } from 'vitest';
import {
  extractElementText,
  collectElements,
  computeNextBaseline,
  captureEditDeltas,
  type Baseline,
  type CollectedElement,
  type EditDeltaPrisma,
} from './capture';

// ─── mock prisma ─────────────────────────────────────────────────────────────
function mockPrisma() {
  const upsert = vi.fn().mockResolvedValue(undefined);
  const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
  const prisma: EditDeltaPrisma = { editDelta: { upsert, deleteMany } };
  return { prisma, upsert, deleteMany };
}

// A freeze-side (generate-copy → finalize) section as it lands in
// finalContent.content — raw copy elements: plain string / string[].
function freezeSection() {
  return {
    'hero-aaaa1111': {
      id: 'hero-aaaa1111',
      layout: 'CenteredHero',
      elements: {
        headline: 'Ship faster with Acme',
        subheadline: 'The all-in-one platform',
        feature_titles: ['Fast', 'Reliable', 'Secure'],
        form_id: 'form-123',
      },
      aiMetadata: { aiGenerated: true },
    },
  };
}

// The SAME unedited element as it comes back out of the editor store export():
// V2 direct format (identical plain values) plus a legacy `{ content }` wrapper
// on one field to exercise the parity-unwrap path.
function exportSection() {
  return {
    'hero-aaaa1111': {
      id: 'hero-aaaa1111',
      layout: 'CenteredHero',
      elements: {
        headline: 'Ship faster with Acme', // direct string
        subheadline: { content: 'The all-in-one platform', type: 'text', isEditable: true }, // legacy wrapper
        feature_titles: ['Fast', 'Reliable', 'Secure'], // direct array
        form_id: 'form-123',
      },
      aiMetadata: { aiGenerated: true },
    },
  };
}

describe('extractElementText', () => {
  it('passes plain strings through', () => {
    expect(extractElementText('hello')).toBe('hello');
    expect(extractElementText('')).toBe('');
  });

  it('joins string arrays with newlines', () => {
    expect(extractElementText(['a', 'b', 'c'])).toBe('a\nb\nc');
  });

  it('unwraps the editor `{ content }` wrapper (recurses)', () => {
    expect(extractElementText({ content: 'X', type: 'text', isEditable: true })).toBe('X');
    expect(extractElementText({ content: ['a', 'b'] })).toBe('a\nb');
  });

  it('unwraps the freeze-side `{ value }` wrapper (recurses)', () => {
    expect(extractElementText({ value: 'Y', needsReview: true })).toBe('Y');
  });

  it('returns null for non-text / empty shapes', () => {
    expect(extractElementText(123)).toBeNull();
    expect(extractElementText(true)).toBeNull();
    expect(extractElementText(null)).toBeNull();
    expect(extractElementText(undefined)).toBeNull();
    expect(extractElementText([{ a: 1 }])).toBeNull(); // object array (card struct)
    expect(extractElementText({ foo: 'bar' })).toBeNull(); // unknown object
  });
});

describe('PARITY INVARIANT — freeze shape vs export shape normalize identically', () => {
  it('every unedited element from both serializations produces the identical text', () => {
    const freeze = collectElements({ content: freezeSection() });
    const exp = collectElements({ content: exportSection() });

    const freezeMap = Object.fromEntries(freeze.map((e) => [e.elementKey, e.text]));
    const expMap = Object.fromEntries(exp.map((e) => [e.elementKey, e.text]));
    expect(expMap).toEqual(freezeMap);
  });

  it('unedited page ⇒ freeze baseline then diff ⇒ ZERO EditDelta rows written', async () => {
    // 1. Freeze from the generate-copy shape.
    const frozen = collectElements({ content: freezeSection() });
    const { next: baseline } = computeNextBaseline(null, frozen, undefined);

    // 2. Later autosave: collect from the editor-export shape, diff vs baseline.
    const collected = collectElements({ content: exportSection() });
    const { prisma, upsert, deleteMany } = mockPrisma();
    await captureEditDeltas({
      prisma,
      tokenId: 'tok',
      baseline,
      collected,
      templateId: 'meridian',
      audienceType: 'product',
      isFounderEdit: false,
    });

    expect(upsert).not.toHaveBeenCalled(); // no divergence → no rows
    // deleteMany may fire once (all elements at-baseline are revert candidates),
    // but it must upsert nothing — that is the invariant.
  });
});

describe('collectElements', () => {
  it('derives sectionType from the id prefix and skips null-normalizing elements', () => {
    const els = collectElements({ content: freezeSection() });
    expect(els.find((e) => e.elementKey === 'headline')).toMatchObject({
      sectionId: 'hero-aaaa1111',
      sectionType: 'hero',
      text: 'Ship faster with Acme',
    });
    expect(els.find((e) => e.elementKey === 'feature_titles')?.text).toBe('Fast\nReliable\nSecure');
  });

  it('walks multi-page `pages[*].content` and does NOT double-process the home page', () => {
    const home = freezeSection();
    const fc = {
      // top-level content mirrors pages[home].content (real export behavior)
      content: home,
      pages: {
        home: { content: home },
        about: {
          content: {
            'cta-bbbb2222': { elements: { headline: 'Contact us' } },
          },
        },
      },
    };
    const els = collectElements(fc);
    // home's headline appears exactly once (not doubled by the top-level content)
    expect(els.filter((e) => e.sectionId === 'hero-aaaa1111' && e.elementKey === 'headline')).toHaveLength(1);
    expect(els.find((e) => e.sectionId === 'cta-bbbb2222')?.text).toBe('Contact us');
  });

  it('tolerates empty-skeleton pages (content: {}) → no entries', () => {
    const fc = { pages: { home: { content: {} }, about: { content: {} } } };
    expect(collectElements(fc)).toEqual([]);
  });

  it('never walks the localeContent i18n overlay', () => {
    const fc = {
      content: freezeSection(),
      localeContent: {
        'hero-aaaa1111': { headline: 'Envía más rápido' }, // must be ignored
      },
    };
    const els = collectElements(fc);
    expect(els.every((e) => e.text !== 'Envía más rápido')).toBe(true);
  });
});

describe('computeNextBaseline', () => {
  it('additive first-sight freeze on empty stored baseline', () => {
    const collected: CollectedElement[] = [
      { sectionId: 'hero-1', sectionType: 'hero', elementKey: 'headline', text: 'A' },
    ];
    const { next, changed } = computeNextBaseline(null, collected, undefined);
    expect(changed).toBe(true);
    expect(next).toEqual({ 'hero-1': { headline: 'A' } });
  });

  it('does NOT re-freeze an already-frozen element (changed=false)', () => {
    const stored: Baseline = { 'hero-1': { headline: 'A' } };
    const collected: CollectedElement[] = [
      { sectionId: 'hero-1', sectionType: 'hero', elementKey: 'headline', text: 'EDITED' },
    ];
    const { next, changed } = computeNextBaseline(stored, collected, undefined);
    expect(changed).toBe(false); // baseline keeps original 'A'
    expect(next).toEqual({ 'hero-1': { headline: 'A' } });
  });

  it('patch overrides the additive freeze (regen re-freeze wins)', () => {
    const stored: Baseline = { 'hero-1': { headline: 'A' } };
    const collected: CollectedElement[] = [
      { sectionId: 'hero-1', sectionType: 'hero', elementKey: 'headline', text: 'A' },
    ];
    const patch = { 'hero-1': { headline: 'REGEN' } };
    const { next, changed } = computeNextBaseline(stored, collected, patch);
    expect(changed).toBe(true);
    expect(next).toEqual({ 'hero-1': { headline: 'REGEN' } });
  });

  it('patch-only (no collected) still merges + reports changed', () => {
    const { next, changed } = computeNextBaseline(null, [], { 's-1': { k: 'v' } });
    expect(changed).toBe(true);
    expect(next).toEqual({ 's-1': { k: 'v' } });
  });
});

describe('captureEditDeltas', () => {
  const base = {
    tokenId: 'tok',
    templateId: 'meridian',
    audienceType: 'product',
    isFounderEdit: false,
  };

  it('changed element → upsert with correct editDistance and truncation-safe text', async () => {
    const baseline: Baseline = { 'hero-1': { headline: 'cat' } };
    const collected: CollectedElement[] = [
      { sectionId: 'hero-1', sectionType: 'hero', elementKey: 'headline', text: 'cats' },
    ];
    const { prisma, upsert, deleteMany } = mockPrisma();
    await captureEditDeltas({ prisma, baseline, collected, ...base });

    expect(upsert).toHaveBeenCalledTimes(1);
    const arg = upsert.mock.calls[0][0] as any;
    expect(arg.where.projectToken_sectionId_elementKey).toEqual({
      projectToken: 'tok',
      sectionId: 'hero-1',
      elementKey: 'headline',
    });
    expect(arg.create.aiText).toBe('cat');
    expect(arg.create.userText).toBe('cats');
    expect(arg.create.editDistance).toBe(1);
    expect(arg.create.sectionType).toBe('hero');
    expect(arg.create.isFounderEdit).toBe(false);
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it('reverted element (== baseline) → deleteMany, no upsert', async () => {
    const baseline: Baseline = { 'hero-1': { headline: 'cat' } };
    const collected: CollectedElement[] = [
      { sectionId: 'hero-1', sectionType: 'hero', elementKey: 'headline', text: 'cat' },
    ];
    const { prisma, upsert, deleteMany } = mockPrisma();
    await captureEditDeltas({ prisma, baseline, collected, ...base });

    expect(upsert).not.toHaveBeenCalled();
    expect(deleteMany).toHaveBeenCalledTimes(1);
    const arg = deleteMany.mock.calls[0][0] as any;
    expect(arg.where.projectToken).toBe('tok');
    expect(arg.where.OR).toEqual([{ sectionId: 'hero-1', elementKey: 'headline' }]);
  });

  it('user-added element (no baseline entry) → skipped entirely', async () => {
    const baseline: Baseline = {}; // nothing frozen
    const collected: CollectedElement[] = [
      { sectionId: 'custom-9', sectionType: 'custom', elementKey: 'headline', text: 'user wrote this' },
    ];
    const { prisma, upsert, deleteMany } = mockPrisma();
    await captureEditDeltas({ prisma, baseline, collected, ...base });

    expect(upsert).not.toHaveBeenCalled();
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it('flags founder edits when isFounderEdit=true', async () => {
    const baseline: Baseline = { 'hero-1': { headline: 'cat' } };
    const collected: CollectedElement[] = [
      { sectionId: 'hero-1', sectionType: 'hero', elementKey: 'headline', text: 'dog' },
    ];
    const { prisma, upsert } = mockPrisma();
    await captureEditDeltas({ prisma, baseline, collected, ...base, isFounderEdit: true });
    expect((upsert.mock.calls[0][0] as any).create.isFounderEdit).toBe(true);
  });

  it('a prisma throw does NOT propagate past the caller wrapper (simulated)', async () => {
    // captureEditDeltas itself rejects on prisma failure; the saveDraft route wraps
    // it in try/catch. Here we assert the rejection is a normal awaitable error so
    // the route-level catch can swallow it (autosave never fails on capture).
    const baseline: Baseline = { 'hero-1': { headline: 'cat' } };
    const collected: CollectedElement[] = [
      { sectionId: 'hero-1', sectionType: 'hero', elementKey: 'headline', text: 'dog' },
    ];
    const prisma: EditDeltaPrisma = {
      editDelta: {
        upsert: vi.fn().mockRejectedValue(new Error('db down')),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };
    let swallowed = false;
    try {
      await captureEditDeltas({ prisma, baseline, collected, ...base });
    } catch {
      swallowed = true; // the route's try/catch does exactly this
    }
    expect(swallowed).toBe(true);
  });
});
