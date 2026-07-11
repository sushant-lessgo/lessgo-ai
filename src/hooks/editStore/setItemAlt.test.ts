// editor phase-3 (phase 6) — setItemAlt writes the canonical alt store
// (2026-07-11 law): content[sectionId].elementMetadata[collectionKey].alt[itemId].
// Regression guard: alt must land under the COLLECTION key as an itemId-keyed map,
// never on the item itself and never clobbering sibling metadata (buttonConfig/cta).

import { describe, it, expect, beforeEach } from 'vitest';
import { createEditStore } from '@/stores/editStore';

type Store = ReturnType<typeof createEditStore>;

const SECTION = 'catalog-1';

function seed(store: Store) {
  store.getState().loadFromDraft(
    {
      tokenId: 'tok-alt',
      title: 'Alt',
      finalContent: {
        sections: [SECTION],
        sectionLayouts: { [SECTION]: 'VestriaCatalogueGrid' },
        content: {
          [SECTION]: {
            id: SECTION,
            layout: 'VestriaCatalogueGrid',
            elements: {
              items: [
                { id: 'a1', title: 'Alpha', image: 'https://x/a.jpg' },
                { id: 'b2', title: 'Beta', image: 'https://x/b.jpg' },
              ],
            },
            elementMetadata: {
              cta_href: { cta: { type: 'link', url: '#contact', label: 'Ask' } },
            },
          },
        },
        theme: {},
      },
    },
    'tok-alt',
  );
}

describe('setItemAlt (imageCollection alt-text law)', () => {
  let store: Store;

  beforeEach(() => {
    store = createEditStore('tok-alt');
    seed(store);
  });

  it('writes alt under elementMetadata[collectionKey].alt[itemId]', () => {
    store.getState().setItemAlt(SECTION, 'items', 'a1', 'Alpha product photo');
    const meta = store.getState().content[SECTION].elementMetadata!;
    expect(meta.items.alt).toEqual({ a1: 'Alpha product photo' });
  });

  it('merges multiple items into the same alt map without clobbering', () => {
    store.getState().setItemAlt(SECTION, 'items', 'a1', 'A');
    store.getState().setItemAlt(SECTION, 'items', 'b2', 'B');
    const meta = store.getState().content[SECTION].elementMetadata!;
    expect(meta.items.alt).toEqual({ a1: 'A', b2: 'B' });
  });

  it('overwrites an existing item alt in place', () => {
    store.getState().setItemAlt(SECTION, 'items', 'a1', 'first');
    store.getState().setItemAlt(SECTION, 'items', 'a1', 'second');
    const meta = store.getState().content[SECTION].elementMetadata!;
    expect((meta.items.alt as Record<string, string>).a1).toBe('second');
  });

  it('does not touch sibling metadata (buttonConfig/cta) or the items array', () => {
    const itemsBefore = store.getState().content[SECTION].elements.items;
    store.getState().setItemAlt(SECTION, 'items', 'a1', 'A');
    const section = store.getState().content[SECTION];
    // sibling cta metadata intact
    expect(section.elementMetadata!.cta_href).toEqual({
      cta: { type: 'link', url: '#contact', label: 'Ask' },
    });
    // the collection array itself is untouched (alt lives in metadata, not the item)
    expect(section.elements.items).toBe(itemsBefore);
    expect(section.elements.items[0]).not.toHaveProperty('alt');
  });

  it('marks the draft dirty', () => {
    store.getState().setItemAlt(SECTION, 'items', 'a1', 'A');
    expect(store.getState().persistence.isDirty).toBe(true);
  });
});
