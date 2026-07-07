import { describe, it, expect } from 'vitest';
import {
  deriveGuideTasks,
  resolveElementValue,
  useReviewState,
  type GuideSurfaces,
  type GuideTaskId,
  type ReviewItem,
} from './useReviewState';

const HEADER = 'header-1';
const FOOTER = 'footer-1';
const HERO = 'hero-1';

function baseSurfaces(overrides: Partial<GuideSurfaces> = {}): GuideSurfaces {
  return {
    headerSectionId: HEADER,
    footerSectionId: FOOTER,
    primaryCtas: [{ sectionId: HERO, elementKey: 'cta_text' }],
    hasImageElement: true,
    firstImageTarget: { sectionId: HERO, elementKey: 'hero_image' },
    stockItems: [],
    ...overrides,
  };
}

function stockItem(sectionId: string, elementKey: string): ReviewItem {
  return { sectionId, elementKey, type: 'stock_image', severity: 'medium', displayName: elementKey };
}

function byId(tasks: ReturnType<typeof deriveGuideTasks>, id: GuideTaskId) {
  const t = tasks.find((x) => x.id === id);
  if (!t) throw new Error(`missing task ${id}`);
  return t;
}

describe('deriveGuideTasks', () => {
  it('returns exactly the 4 curated tasks (no 5th)', () => {
    const tasks = deriveGuideTasks({}, baseSurfaces());
    expect(tasks.map((t) => t.id).sort()).toEqual(
      ['add_contact', 'add_logo', 'link_ctas', 'replace_stock_photos'].sort()
    );
    expect(tasks).toHaveLength(4);
  });

  describe('add_logo', () => {
    it('present when header exists, not present otherwise', () => {
      expect(byId(deriveGuideTasks({}, baseSurfaces()), 'add_logo').present).toBe(true);
      expect(
        byId(deriveGuideTasks({}, baseSurfaces({ headerSectionId: null })), 'add_logo').present
      ).toBe(false);
    });

    it('not done when no logo, done when globalSettings.logoUrl set', () => {
      expect(byId(deriveGuideTasks({}, baseSurfaces()), 'add_logo').done).toBe(false);
      expect(
        byId(deriveGuideTasks({}, baseSurfaces(), { logoUrl: 'https://x/logo.png' }), 'add_logo')
          .done
      ).toBe(true);
    });

    it('done when header logo_image element is non-empty (incl. {content} wrapper)', () => {
      const content = { [HEADER]: { elements: { logo_image: { content: 'https://x/l.png' } } } };
      expect(byId(deriveGuideTasks(content, baseSurfaces()), 'add_logo').done).toBe(true);
    });
  });

  describe('link_ctas', () => {
    it('present only when a primary CTA exists', () => {
      expect(byId(deriveGuideTasks({}, baseSurfaces()), 'link_ctas').present).toBe(true);
      expect(
        byId(deriveGuideTasks({}, baseSurfaces({ primaryCtas: [] })), 'link_ctas').present
      ).toBe(false);
    });

    it('not done when CTA is unlinked, done when buttonConfig is a link with url', () => {
      const unlinked = { [HERO]: { elements: {} } };
      expect(byId(deriveGuideTasks(unlinked, baseSurfaces()), 'link_ctas').done).toBe(false);

      const linked = {
        [HERO]: { elementMetadata: { cta_text: { buttonConfig: { type: 'link', url: 'https://x' } } } },
      };
      expect(byId(deriveGuideTasks(linked, baseSurfaces()), 'link_ctas').done).toBe(true);
    });

    it('done via legacy section.cta fallback', () => {
      const legacy = { [HERO]: { cta: { type: 'link', url: 'https://x' } } };
      expect(byId(deriveGuideTasks(legacy, baseSurfaces()), 'link_ctas').done).toBe(true);
    });

    it('not done if ANY primary CTA is unlinked', () => {
      const surfaces = baseSurfaces({
        primaryCtas: [
          { sectionId: HERO, elementKey: 'cta_text' },
          { sectionId: 'cta-2', elementKey: 'cta_text' },
        ],
      });
      const content = {
        [HERO]: { elementMetadata: { cta_text: { buttonConfig: { type: 'link', url: 'https://x' } } } },
        'cta-2': { elements: {} },
      };
      expect(byId(deriveGuideTasks(content, surfaces), 'link_ctas').done).toBe(false);
    });
  });

  describe('replace_stock_photos', () => {
    it('present only when a non-logo image element exists', () => {
      expect(byId(deriveGuideTasks({}, baseSurfaces()), 'replace_stock_photos').present).toBe(true);
      expect(
        byId(
          deriveGuideTasks({}, baseSurfaces({ hasImageElement: false })),
          'replace_stock_photos'
        ).present
      ).toBe(false);
    });

    it('not done when stock items remain, done when replaced (no stock items)', () => {
      const withStock = baseSurfaces({ stockItems: [stockItem(HERO, 'hero_image')] });
      expect(byId(deriveGuideTasks({}, withStock), 'replace_stock_photos').done).toBe(false);
      expect(byId(deriveGuideTasks({}, baseSurfaces()), 'replace_stock_photos').done).toBe(true);
    });
  });

  describe('add_contact', () => {
    it('present only when a footer exists', () => {
      expect(byId(deriveGuideTasks({}, baseSurfaces()), 'add_contact').present).toBe(true);
      expect(
        byId(deriveGuideTasks({}, baseSurfaces({ footerSectionId: null })), 'add_contact').present
      ).toBe(false);
    });

    it('not done when contact empty, done when email or address filled', () => {
      expect(byId(deriveGuideTasks({}, baseSurfaces()), 'add_contact').done).toBe(false);

      const email = { [FOOTER]: { elements: { contact_email: 'hi@x.com' } } };
      expect(byId(deriveGuideTasks(email, baseSurfaces()), 'add_contact').done).toBe(true);

      const addr = { [FOOTER]: { elements: { contact_address: '1 Main St' } } };
      expect(byId(deriveGuideTasks(addr, baseSurfaces()), 'add_contact').done).toBe(true);
    });
  });
});

describe('refreshFromContent (Phase 2 reactivity)', () => {
  it('no-ops (skips set, keeps refs) when the derived output is unchanged', () => {
    const store = useReviewState.getState();
    store.initFromContent({}, {}, [], {});
    const g1 = useReviewState.getState().guideTasks;
    const r1 = useReviewState.getState().reviewItems;

    // Same content + same globalSettings → nothing derived changes → no set.
    useReviewState.getState().refreshFromContent({}, null, null, {});

    // No set means reference identity is preserved (proves the set was skipped).
    expect(useReviewState.getState().guideTasks).toBe(g1);
    expect(useReviewState.getState().reviewItems).toBe(r1);
  });

  it('re-derives (new refs) when the derived output changes', () => {
    const store = useReviewState.getState();
    store.initFromContent({}, {}, [], {});
    const g1 = useReviewState.getState().guideTasks;
    expect(g1.find((t) => t.id === 'add_logo')?.done).toBe(false);

    // globalSettings.logoUrl now set → add_logo.done flips → derived changes → set fires.
    useReviewState.getState().refreshFromContent({}, null, null, { logoUrl: 'https://x/l.png' });

    const g2 = useReviewState.getState().guideTasks;
    expect(g2).not.toBe(g1);
    expect(g2.find((t) => t.id === 'add_logo')?.done).toBe(true);
  });

  it('stores threaded baseline + currentPageId (Phase 5 wiring), setting even when derived is equal', () => {
    const store = useReviewState.getState();
    store.initFromContent({}, {}, [], { logoUrl: 'https://x/l.png' }, null, null);
    const g1 = useReviewState.getState().guideTasks;
    expect(useReviewState.getState().baseline).toBeNull();

    // Same derived output (same logoUrl), but baseline changes → must set + store baseline.
    const baseline = { content: {}, pages: {} };
    useReviewState.getState().refreshFromContent({}, baseline, 'page-2', { logoUrl: 'https://x/l.png' });

    expect(useReviewState.getState().baseline).toBe(baseline);
    expect(useReviewState.getState().currentPageId).toBe('page-2');
    // Derived was equal, so a set still happened for baseline — guideTasks may be a fresh ref.
    expect(useReviewState.getState().guideTasks.find((t) => t.id === 'add_logo')?.done).toBe(true);
    void g1;
  });

  it('does not clobber confirmedElements on refresh', () => {
    const store = useReviewState.getState();
    store.initFromContent({}, {}, [], {});
    store.confirmItem('hero-1', 'headline');
    expect(useReviewState.getState().isConfirmed('hero-1', 'headline')).toBe(true);

    useReviewState.getState().refreshFromContent({}, null, null, { logoUrl: 'https://x/l.png' });

    expect(useReviewState.getState().isConfirmed('hero-1', 'headline')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Phase 5 — resolveElementValue + activeMarkers (auto-clear vs persisted baseline)
// ---------------------------------------------------------------------------

describe('resolveElementValue', () => {
  it('resolves a plain top-level key (string + {content} wrapper)', () => {
    const root = {
      's1': { elements: { headline: 'hi', sub: { content: 'wrapped' } } },
    };
    expect(resolveElementValue(root, 's1', 'headline')).toBe('hi');
    expect(resolveElementValue(root, 's1', 'sub')).toBe('wrapped');
  });

  it('returns undefined when section / elements / key are absent', () => {
    expect(resolveElementValue(undefined, 's1', 'headline')).toBeUndefined();
    expect(resolveElementValue({}, 's1', 'headline')).toBeUndefined();
    expect(resolveElementValue({ s1: {} }, 's1', 'headline')).toBeUndefined();
    expect(resolveElementValue({ s1: { elements: {} } }, 's1', 'missing')).toBeUndefined();
  });

  it('resolves a dotted collection key by item id (not raw index)', () => {
    const root = {
      's1': {
        elements: {
          testimonials: [
            { id: 'a', quote: 'first' },
            { id: 'b', quote: { content: 'second' } },
          ],
        },
      },
    };
    expect(resolveElementValue(root, 's1', 'testimonials.a.quote')).toBe('first');
    expect(resolveElementValue(root, 's1', 'testimonials.b.quote')).toBe('second');
    // Missing item id / field → undefined (no crash).
    expect(resolveElementValue(root, 's1', 'testimonials.zzz.quote')).toBeUndefined();
    expect(resolveElementValue(root, 's1', 'testimonials.a.nope')).toBeUndefined();
    // Non-array collection → undefined.
    expect(
      resolveElementValue({ s1: { elements: { testimonials: 'x' } } }, 's1', 'testimonials.a.quote')
    ).toBeUndefined();
  });
});

describe('activeMarkers (Phase 5 auto-clear)', () => {
  // PullQuoteWithMark (service schema): top-level `quote` is ai_generated_needs_review.
  const QUOTE_LAYOUT = 'PullQuoteWithMark';
  // VestriaQuotes (product schema): `testimonials` collection with dotted needs_review fields.
  const COLL_LAYOUT = 'VestriaQuotes';

  function activeKeys(): Set<string> {
    return new Set(
      useReviewState.getState().activeMarkers.map((i) => `${i.sectionId}::${i.elementKey}`)
    );
  }

  it('unchanged value (= baseline) → marker present; edited value (≠ baseline) → absent', () => {
    const sec = 'testimonials-1';
    const layouts = { [sec]: QUOTE_LAYOUT };
    const sections = [sec];

    // Unchanged: current quote equals baseline quote.
    const baseline = { content: { [sec]: { elements: { quote: 'AI original' } } } };
    useReviewState.getState().initFromContent(
      { [sec]: { elements: { quote: 'AI original' } } },
      layouts, sections, {}, baseline, null
    );
    expect(activeKeys().has(`${sec}::quote`)).toBe(true);

    // Edited: current quote diverges from baseline → marker drops.
    useReviewState.getState().initFromContent(
      { [sec]: { elements: { quote: 'user edited this' } } },
      layouts, sections, {}, baseline, null
    );
    expect(activeKeys().has(`${sec}::quote`)).toBe(false);
  });

  it('already-edited-at-first-load (content ≠ baseline on the FIRST derive) → marker absent', () => {
    // Returning user: their edit is baked into content on first load. A value-snapshot design
    // would wrongly re-flag this; diffing vs the immutable baseline correctly clears it.
    const sec = 'testimonials-1';
    const layouts = { [sec]: QUOTE_LAYOUT };
    const baseline = { content: { [sec]: { elements: { quote: 'AI original' } } } };
    useReviewState.getState().initFromContent(
      { [sec]: { elements: { quote: 'already edited before reload' } } },
      layouts, [sec], {}, baseline, null
    );
    expect(activeKeys().has(`${sec}::quote`)).toBe(false);
  });

  it('collection dotted key: edited item value → absent; equal → present (proves resolver)', () => {
    const sec = 'testimonials-2';
    const layouts = { [sec]: COLL_LAYOUT };
    const mkContent = (quote: string) => ({
      [sec]: { elements: { testimonials: [{ id: 't1', quote, author_name: 'Ada', author_role: 'CTO' }] } },
    });
    const baseline = { content: mkContent('baseline quote') };

    // Equal → present.
    useReviewState.getState().initFromContent(mkContent('baseline quote'), layouts, [sec], {}, baseline, null);
    expect(activeKeys().has(`${sec}::testimonials.t1.quote`)).toBe(true);
    // Sibling fields unchanged → also present.
    expect(activeKeys().has(`${sec}::testimonials.t1.author_name`)).toBe(true);

    // Edited item quote → that dotted marker drops, siblings stay.
    useReviewState.getState().initFromContent(mkContent('edited quote'), layouts, [sec], {}, baseline, null);
    expect(activeKeys().has(`${sec}::testimonials.t1.quote`)).toBe(false);
    expect(activeKeys().has(`${sec}::testimonials.t1.author_name`)).toBe(true);
  });

  it('multi-page subpage: uses baseline.pages[currentPageId].content (page-aware root)', () => {
    const sec = 'testimonials-3';
    const layouts = { [sec]: QUOTE_LAYOUT };
    // Baseline: home body-only content has NO testimonials-3; the subpage baseline lives under pages.
    const baseline = {
      content: {}, // home body-only — subpage section absent here
      pages: { 'sub-1': { content: { [sec]: { elements: { quote: 'subpage AI original' } } } } },
    };

    // Subpage value equals its page-baseline → present (proves it read pages root, not undefined).
    useReviewState.getState().initFromContent(
      { [sec]: { elements: { quote: 'subpage AI original' } } },
      layouts, [sec], {}, baseline, 'sub-1'
    );
    expect(activeKeys().has(`${sec}::quote`)).toBe(true);

    // Subpage value diverges from its page-baseline → marker clears (not stuck).
    useReviewState.getState().initFromContent(
      { [sec]: { elements: { quote: 'edited on the subpage' } } },
      layouts, [sec], {}, baseline, 'sub-1'
    );
    expect(activeKeys().has(`${sec}::quote`)).toBe(false);
  });

  it('missing baseline → marker treated ACTIVE (no throw)', () => {
    const sec = 'testimonials-4';
    const layouts = { [sec]: QUOTE_LAYOUT };

    // No baseline at all: still active, no crash.
    expect(() =>
      useReviewState.getState().initFromContent(
        { [sec]: { elements: { quote: 'whatever' } } },
        layouts, [sec], {}, null, null
      )
    ).not.toThrow();
    expect(activeKeys().has(`${sec}::quote`)).toBe(true);

    // Baseline present but lacks this page/element AND lacks `pages` — optional chaining must
    // not throw; marker stays active because baseline slot resolves to undefined.
    const baselineNoPages = { content: {} };
    expect(() =>
      useReviewState.getState().initFromContent(
        { [sec]: { elements: { quote: 'edited but no baseline slot' } } },
        layouts, [sec], {}, baselineNoPages, 'some-page'
      )
    ).not.toThrow();
    expect(activeKeys().has(`${sec}::quote`)).toBe(true);
  });
});
