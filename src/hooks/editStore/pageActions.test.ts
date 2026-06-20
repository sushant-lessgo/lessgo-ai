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

// ---- Phase 2: shared chrome (combinatorial invariant across all 6 sites) ----

const hasChromeType = (ids: string[]) => ids.some((id) => /^(header|footer)/i.test(id));

/** Every stored page is body-only (no header/footer by type). */
function expectAllPagesBodyOnly(s: Store) {
  for (const p of Object.values(s.getState().pages)) {
    expect(hasChromeType(p.sections)).toBe(false);
  }
}

/** Working copy === chrome.header + pages[current].body + chrome.footer. */
function expectWorkingComposed(s: Store) {
  const st = s.getState();
  const body = st.pages[st.currentPageId].sections;
  const expected = [
    ...(st.chrome.header ? [st.chrome.header.id] : []),
    ...body,
    ...(st.chrome.footer ? [st.chrome.footer.id] : []),
  ];
  expect(st.sections).toEqual(expected);
}

function seedChrome(store: Store) {
  // Legacy single-page draft with header/hero/footer inline → triggers migration.
  store.getState().loadFromDraft(
    {
      tokenId: 'tok-c',
      title: 'Test',
      finalContent: {
        sections: ['header-1', 'hero-1', 'footer-1'],
        sectionLayouts: { 'header-1': 'Nav', 'hero-1': 'Hero', 'footer-1': 'Foot' },
        content: {
          'header-1': { id: 'header-1', layout: 'Nav', elements: { logo_text: 'Brand' } },
          'hero-1': { id: 'hero-1', layout: 'Hero', elements: {} },
          'footer-1': { id: 'footer-1', layout: 'Foot', elements: {} },
        },
        theme: {},
      },
    },
    'tok-c',
  );
}

describe('shared chrome', () => {
  let store: Store;
  beforeEach(() => {
    store = createEditStore('tok-c');
    seedChrome(store);
  });

  it('migrates inline header/footer into chrome; pages become body-only', () => {
    const s = store.getState();
    expect(s.chrome.header?.id).toBe('header-1');
    expect(s.chrome.footer?.id).toBe('footer-1');
    expect(s.pages.home.sections).toEqual(['hero-1']); // body-only
    expect(s.sections).toEqual(['header-1', 'hero-1', 'footer-1']); // working = chrome+body
    expectAllPagesBodyOnly(store);
    expectWorkingComposed(store);
  });

  it('addPage stays body-only and re-injects chrome into the working copy', () => {
    const id = store.getState().addPage({ title: 'Contact', pathSlug: '/contact' });
    const s = store.getState();
    expect(s.pages[id].sections).toEqual(['hero-1']); // body-only clone
    expect(s.sections).toEqual(['header-1', 'hero-1', 'footer-1']); // chrome injected
    expectAllPagesBodyOnly(store);
    expectWorkingComposed(store);
  });

  it('editing chrome on one page is visible on another (shared)', () => {
    store.getState().updateElementContent('header-1', 'logo_text', 'NewBrand');
    const id = store.getState().addPage({ title: 'Contact', pathSlug: '/contact' });
    // On the new page, the shared header carries the edit.
    const headerData: any = store.getState().content['header-1'];
    expect(headerData?.elements?.logo_text).toBe('NewBrand');
    expect((store.getState().chrome.header?.data as any)?.elements?.logo_text).toBe('NewBrand');
    // Switch back home — still there.
    store.getState().setCurrentPage('home');
    expect((store.getState().content['header-1'] as any)?.elements?.logo_text).toBe('NewBrand');
    expectWorkingComposed(store);
  });

  it('export emits chrome + body-only pages + body-only top-level', () => {
    store.getState().addPage({ title: 'Contact', pathSlug: '/contact' });
    const ex: any = store.getState().export();
    expect(ex.chrome.header.id).toBe('header-1');
    expect(ex.chrome.footer.id).toBe('footer-1');
    expect(ex.pages.home.sections).toEqual(['hero-1']);
    expect(ex.sections).toEqual(['hero-1']); // top-level body-only (== pages[home])
    for (const p of Object.values(ex.pages) as any[]) expect(hasChromeType(p.sections)).toBe(false);
  });

  it('moves body sections without the Immer crash; chrome stays pinned', () => {
    // Working copy after migration: [header-1, hero-1, footer-1]; add a 2nd body section.
    store.getState().reorderSections(['header-1', 'hero-1', 'feat-1', 'footer-1']);
    // Move a body section down — must not throw "[Immer] producer returned a value and modified draft".
    expect(() => store.getState().moveSectionDown('hero-1')).not.toThrow();
    expect(store.getState().sections).toEqual(['header-1', 'feat-1', 'hero-1', 'footer-1']);

    // Chrome is pinned: move/up-down on header/footer is a no-op.
    store.getState().moveSectionDown('header-1');
    expect(store.getState().sections[0]).toBe('header-1');
    store.getState().moveSectionUp('footer-1');
    expect(store.getState().sections[store.getState().sections.length - 1]).toBe('footer-1');
  });

  it('round-trips chrome through export → loadFromDraft', () => {
    store.getState().updateElementContent('header-1', 'logo_text', 'RT');
    store.getState().addPage({ title: 'Contact', pathSlug: '/contact' });
    const ex = store.getState().export();

    const fresh = createEditStore('tok-c2');
    fresh.getState().loadFromDraft({ tokenId: 'tok-c2', title: 'Test', finalContent: ex }, 'tok-c2');
    const s = fresh.getState();
    expect(s.chrome.header?.id).toBe('header-1');
    expect((s.chrome.header?.data as any)?.elements?.logo_text).toBe('RT');
    expectAllPagesBodyOnly(fresh);
    expectWorkingComposed(fresh);
  });
});
