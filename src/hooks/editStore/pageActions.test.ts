// Multi-page store axis — mirror-invariant regression (Phase 1).
// The contract: at every commit boundary (page switch + export) the active
// page's stored slice (pages[currentPageId]) deep-equals the live top-level
// working copy. This guards the shallow-merge / stale-state trap the PO flagged.

import { describe, it, expect, beforeEach } from 'vitest';
import { createEditStore } from '@/stores/editStore';

type Store = ReturnType<typeof createEditStore>;

const slice = (s: any) => ({
  sections: s.sections,
  sectionLayouts: s.sectionLayouts,
  sectionSpacing: s.sectionSpacing,
  content: s.content,
});

/** The invariant: stored active page === live top-level slice. */
function expectMirror(store: Store) {
  const s = store.getState();
  expect(s.pages[s.currentPageId]).toBeTruthy();
  const stored = slice(s.pages[s.currentPageId]);
  expect(stored).toEqual(slice(s));
}

function seedHome(store: Store) {
  store.getState().loadFromDraft(
    {
      tokenId: 'tok-test',
      title: 'Test',
      finalContent: {
        sections: ['hero-1'],
        sectionLayouts: { 'hero-1': 'LayoutA' },
        content: { 'hero-1': { id: 'hero-1', layout: 'LayoutA', elements: {} } },
        theme: {},
      },
    },
    'tok-test',
  );
}

describe('multi-page store axis', () => {
  let store: Store;
  beforeEach(() => {
    store = createEditStore('tok-test');
    seedHome(store);
  });

  it('wraps a single-page draft into a home page', () => {
    const s = store.getState();
    expect(s.currentPageId).toBe('home');
    expect(s.pages.home).toBeTruthy();
    expect(s.pages.home.pathSlug).toBe('/');
    expect(s.pages.home.sections).toEqual(['hero-1']);
    expectMirror(store);
  });

  it('addPage clones the home slice and switches to it', () => {
    const id = store.getState().addPage({ title: 'Contact', pathSlug: '/contact' });
    const s = store.getState();
    expect(s.currentPageId).toBe(id);
    expect(Object.keys(s.pages)).toHaveLength(2);
    expect(s.pages[id].sections).toEqual(['hero-1']); // cloned from home
    expect(s.sections).toEqual(['hero-1']);
    expectMirror(store);
  });

  it('preserves per-page edits across switches (no cross-page bleed)', () => {
    const id = store.getState().addPage({ title: 'Contact', pathSlug: '/contact' });
    // Edit the new page's working copy.
    store.getState().reorderSections(['hero-9']);
    expect(store.getState().sections).toEqual(['hero-9']);

    // Switch to home: commits the new page, loads home (unchanged).
    store.getState().setCurrentPage('home');
    expect(store.getState().sections).toEqual(['hero-1']);
    expect(store.getState().pages[id].sections).toEqual(['hero-9']); // committed
    expectMirror(store);

    // Switch back: the edit is intact.
    store.getState().setCurrentPage(id);
    expect(store.getState().sections).toEqual(['hero-9']);
    expectMirror(store);
  });

  it('export commits the active page and always includes a home entry', () => {
    const id = store.getState().addPage({ title: 'Contact', pathSlug: '/contact' });
    store.getState().reorderSections(['hero-9']);
    const exported = store.getState().export();
    expect(exported.currentPageId).toBe(id);
    expect(exported.pages.home.sections).toEqual(['hero-1']);
    expect(exported.pages[id].sections).toEqual(['hero-9']);
  });

  it('round-trips pages through export → loadFromDraft', () => {
    const id = store.getState().addPage({ title: 'Contact', pathSlug: '/contact' });
    store.getState().reorderSections(['hero-9']);
    const exported = store.getState().export();

    const fresh = createEditStore('tok-test-2');
    fresh.getState().loadFromDraft({ tokenId: 'tok-test-2', title: 'Test', finalContent: exported }, 'tok-test-2');
    const s = fresh.getState();
    expect(Object.keys(s.pages)).toHaveLength(2);
    expect(s.currentPageId).toBe(id);
    expect(s.sections).toEqual(['hero-9']);
    expect(s.pages.home.sections).toEqual(['hero-1']);
    expectMirror(fresh);
  });

  it('home page cannot be deleted; other pages can', () => {
    const id = store.getState().addPage({ title: 'Contact', pathSlug: '/contact' });
    store.getState().deletePage('home');
    expect(store.getState().pages.home).toBeTruthy(); // no-op

    store.getState().setCurrentPage('home');
    store.getState().deletePage(id);
    expect(store.getState().pages[id]).toBeUndefined();
    expect(store.getState().currentPageId).toBe('home');
    expectMirror(store);
  });
});
