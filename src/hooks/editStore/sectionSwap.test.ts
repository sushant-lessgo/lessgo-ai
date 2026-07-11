// variant-swap-integrity Phase 1 — a block-variant swap must be ONE undo entry
// that fully restores layout + elements + elementMetadata + clamped cards, with
// a working redo, on both dispatch paths. Regression guard for the root cause:
// the swap used to dispatch `'section-layout-update' as any`, which had no case
// in executeUndoableAction's type mapping and fell through to `'theme'` (whose
// undo restores only state.theme → cards silently lost).

import { describe, it, expect, beforeEach } from 'vitest';
import { createEditStore } from '@/stores/editStore';

type Store = ReturnType<typeof createEditStore>;

const SECTION = 'testimonials-1';

// Fresh card objects per seed so nothing is aliased across tests.
function makeCards() {
  return [
    { quote: 'Great product', author_name: 'Ana' },
    { quote: 'Loved it', author_name: 'Ben' },
    { quote: 'Highly recommend', author_name: 'Cara' },
    { quote: 'Five stars', author_name: 'Dev' },
  ];
}

function seed(store: Store) {
  store.getState().loadFromDraft(
    {
      tokenId: 'tok-swap',
      title: 'Swap',
      finalContent: {
        sections: [SECTION],
        sectionLayouts: { [SECTION]: 'ReviewGrid' },
        content: {
          [SECTION]: {
            id: SECTION,
            layout: 'ReviewGrid',
            elements: {
              headline: 'What people say',
              testimonials: makeCards(),
            },
            elementMetadata: {
              cta_button: { cta: { type: 'link', url: '/signup', label: 'Start' } },
            },
          },
        },
        theme: {},
      },
    },
    'tok-swap',
  );
}

describe('sectionSwap undo/redo (variant-swap-integrity Phase 1)', () => {
  let store: Store;

  beforeEach(() => {
    store = createEditStore('tok-swap');
    seed(store);
  });

  it('a clamped swap is ONE undo entry and fully round-trips', () => {
    const s = store.getState();
    const before = structuredClone(s.content[SECTION]);
    const baseLen = s.history.undoStack.length;

    // Clamp 4 → 2 cards inside a single sectionSwap action (mirrors
    // BlockVariantSelector.applyWithClamp).
    const clampedElements = {
      headline: 'What people say',
      testimonials: before.elements.testimonials.slice(0, 2),
    };

    store.getState().executeUndoableAction('sectionSwap', 'Changed testimonials block to PullQuoteWithMark', () => {
      store.getState().updateSectionLayout(SECTION, 'PullQuoteWithMark', { skipHistory: true });
      store.getState().setSection(SECTION, { elements: clampedElements });
    });

    // (a) exactly ONE history entry, typed sectionSwap.
    expect(store.getState().history.undoStack.length).toBe(baseLen + 1);
    expect(store.getState().history.undoStack.at(-1)!.type).toBe('sectionSwap');

    // Swap applied: layout mirror + content.layout + clamped cards.
    expect(store.getState().sectionLayouts[SECTION]).toBe('PullQuoteWithMark');
    expect(store.getState().content[SECTION].layout).toBe('PullQuoteWithMark');
    expect(store.getState().content[SECTION].elements.testimonials).toHaveLength(2);

    // (b) undo restores original layout, FULL card array, elementMetadata, and
    // the sectionLayouts mirror.
    store.getState().undo();
    let now = store.getState().content[SECTION];
    expect(store.getState().sectionLayouts[SECTION]).toBe('ReviewGrid');
    expect(now.layout).toBe('ReviewGrid');
    expect(now.elements.testimonials).toHaveLength(4);
    expect(now.elements.testimonials).toEqual(before.elements.testimonials);
    expect(now.elementMetadata).toEqual(before.elementMetadata);

    // (c) redo re-applies BOTH swapped layout and clamped elements.
    store.getState().redo();
    now = store.getState().content[SECTION];
    expect(store.getState().sectionLayouts[SECTION]).toBe('PullQuoteWithMark');
    expect(now.layout).toBe('PullQuoteWithMark');
    expect(now.elements.testimonials).toHaveLength(2);

    // (d) a second undo restores again.
    store.getState().undo();
    now = store.getState().content[SECTION];
    expect(store.getState().sectionLayouts[SECTION]).toBe('ReviewGrid');
    expect(now.layout).toBe('ReviewGrid');
    expect(now.elements.testimonials).toHaveLength(4);
    expect(now.elements.testimonials).toEqual(before.elements.testimonials);
    expect(now.elementMetadata).toEqual(before.elementMetadata);
  });

  it('(e) a plain non-clamped swap round-trips', () => {
    const s = store.getState();
    const before = structuredClone(s.content[SECTION]);
    const baseLen = s.history.undoStack.length;

    store.getState().executeUndoableAction('sectionSwap', 'Changed testimonials block to QuoteWall', () => {
      store.getState().updateSectionLayout(SECTION, 'QuoteWall', { skipHistory: true });
    });

    expect(store.getState().history.undoStack.length).toBe(baseLen + 1);
    expect(store.getState().sectionLayouts[SECTION]).toBe('QuoteWall');
    expect(store.getState().content[SECTION].layout).toBe('QuoteWall');
    // cards untouched by a layout-only swap
    expect(store.getState().content[SECTION].elements.testimonials).toHaveLength(4);

    store.getState().undo();
    expect(store.getState().sectionLayouts[SECTION]).toBe('ReviewGrid');
    expect(store.getState().content[SECTION].layout).toBe('ReviewGrid');
    expect(store.getState().content[SECTION].elements.testimonials).toEqual(before.elements.testimonials);

    store.getState().redo();
    expect(store.getState().sectionLayouts[SECTION]).toBe('QuoteWall');
    expect(store.getState().content[SECTION].layout).toBe('QuoteWall');
    expect(store.getState().content[SECTION].elements.testimonials).toHaveLength(4);
  });
});
