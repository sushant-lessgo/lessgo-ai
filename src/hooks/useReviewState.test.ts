import { describe, it, expect } from 'vitest';
import {
  deriveGuideTasks,
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
