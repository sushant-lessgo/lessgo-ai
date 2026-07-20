// src/hooks/editStore/cmsActions.test.ts
//
// THE DUAL-PIN regression gate for `addCmsSection`.
//
// Why this file exists: `addCmsSection` must write the layout in BOTH places —
//   sectionLayouts[sectionId]   (what the EDIT renderer prefers)
//   content[sectionId].layout   (the ONLY thing the PUBLISHED renderer reads)
// The publish payload carries no `sectionLayouts` map, and
// `LandingPagePublishedRenderer` silently `return null`s a section whose
// `content[sid].layout` is missing. The edit renderer is forgiving
// (`sectionLayouts[id] || content[id]?.layout`), so pinning only the MAP looks
// perfect in the canvas and the section vanishes once published.
//
// ⚠️ The publish-side test (`materializePublish.test.ts`) does NOT cover this:
// `materializeCmsContent` DEFAULTS a missing layout to `CMS_COLLECTION_LAYOUT`
// (materializePublish.ts:148), so a map-only regression would publish an EMPTY
// block rather than vanishing — green suite, broken page. The content-half pin
// is only observable HERE, at the write site.

import { describe, it, expect, beforeEach } from 'vitest';
import { createEditStore } from '@/stores/editStore';
import {
  CMS_COLLECTION_LAYOUT,
  CMS_SECTION_TYPE,
  isCmsListingSectionId,
} from '@/modules/cms/materializePublish';

type Store = ReturnType<typeof createEditStore>;

function seed(store: Store) {
  store.getState().loadFromDraft(
    {
      tokenId: 'tok-cms',
      title: 'Test',
      finalContent: {
        sections: ['hero-1'],
        sectionLayouts: { 'hero-1': 'LayoutA' },
        content: { 'hero-1': { id: 'hero-1', layout: 'LayoutA', elements: {} } },
        theme: {},
      },
    },
    'tok-cms',
  );
}

describe('addCmsSection — the dual pin', () => {
  let store: Store;
  beforeEach(() => {
    store = createEditStore('tok-cms');
    seed(store);
  });

  it('writes the layout to BOTH sectionLayouts AND content[sid].layout', () => {
    const sid = store.getState().addCmsSection('col-1');
    const s = store.getState();

    // Half 1 — the edit-renderer map.
    expect(s.sectionLayouts[sid]).toBe(CMS_COLLECTION_LAYOUT);
    // Half 2 — the ONLY half the published renderer can see. Dropping this is
    // the silent-vanish bug; it must be asserted independently of half 1.
    expect(s.content[sid].layout).toBe(CMS_COLLECTION_LAYOUT);
    expect(s.content[sid].id).toBe(sid);
  });

  it('places the section and records the collection placement in content', () => {
    const sid = store.getState().addCmsSection('col-1');
    const s = store.getState();

    expect(sid.split('-')[0]).toBe(CMS_SECTION_TYPE);
    expect(s.sections).toEqual(['hero-1', sid]);
    expect(s.content[sid].elements.collectionId).toBe('col-1');
    expect(s.content[sid].elements.layoutHint).toBeUndefined();
    expect(s.persistence.isDirty).toBe(true);
  });

  // ── THE HYPHEN-FREE ID INVARIANT (prune safety, not cosmetics) ─────────────
  // `isCmsListingSectionId` distinguishes a page WE authored
  // (`cmscollection-listing-<collectionId>`) from a user's own subpage carrying a
  // placed block — and the load-bearing half of that test is `parts.length > 2`,
  // which holds ONLY because a placement id contains no hyphen after the type
  // prefix. Switch `newCmsSectionId` to `crypto.randomUUID()` (uuids have
  // hyphens) and a placement gains extra parts; one whose second segment spelled
  // `listing` would be claimed as ours and DELETED on toggle-off. So the id
  // FORMAT is a contract, pinned here rather than left to a comment.
  it('mints a HYPHEN-FREE id after the type prefix (the listing-prune invariant)', () => {
    for (let i = 0; i < 50; i++) {
      const sid = store.getState().addCmsSection('col-1');
      const parts = sid.split('-');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toBe(CMS_SECTION_TYPE);
      expect(parts[1]).not.toBe('');
      // …and the consequence that actually matters: the pruner does not own it.
      expect(isCmsListingSectionId(sid)).toBe(false);
    }
  });

  it('carries an explicit layoutHint and honours an insert position', () => {
    const sid = store.getState().addCmsSection('col-1', { layoutHint: 'grid', position: 0 });
    const s = store.getState();

    expect(s.sections).toEqual([sid, 'hero-1']);
    expect(s.content[sid].elements.layoutHint).toBe('grid');
    // …and the pin still holds on the non-default path.
    expect(s.sectionLayouts[sid]).toBe(CMS_COLLECTION_LAYOUT);
    expect(s.content[sid].layout).toBe(CMS_COLLECTION_LAYOUT);
  });

  it('removeCmsSection clears BOTH halves plus the sections entry', () => {
    const sid = store.getState().addCmsSection('col-1');
    store.getState().removeCmsSection(sid);
    const s = store.getState();

    expect(s.sections).toEqual(['hero-1']);
    expect(s.sectionLayouts[sid]).toBeUndefined();
    expect(s.content[sid]).toBeUndefined();
  });
});

// ── removeCmsSectionsForCollection ───────────────────────────────────────────
// A DESTRUCTIVE cross-page mutation: it deletes sections from the user's pages.
// It fires from CmsPanel right after a collection DELETE, because the server
// cascade cannot reach section content. Two ways it can go wrong, both bad:
//  · too little — a stored page keeps a placement pointing at a deleted row
//    (publishes as an empty block forever), because `addCmsSection` only ever
//    writes the ACTIVE slice and the user can place-then-switch-page;
//  · too much — it takes out a hero, or another collection's block.
describe('removeCmsSectionsForCollection — the cross-page sweep', () => {
  let store: Store;
  beforeEach(() => {
    store = createEditStore('tok-cms');
    seed(store);
  });

  /** A stored page slice carrying one cms section for `collectionId`. */
  function stashPage(store: Store, pageId: string, collectionId: string): string {
    const sid = `${CMS_SECTION_TYPE}-${pageId}`;
    store.setState((state: any) => {
      state.pages = state.pages || {};
      state.pages[pageId] = {
        id: pageId,
        archetypeKey: 'basic',
        pathSlug: `/${pageId}`,
        title: pageId,
        order: 1,
        sections: ['hero-x', sid],
        sectionLayouts: { 'hero-x': 'LayoutA', [sid]: CMS_COLLECTION_LAYOUT },
        content: {
          'hero-x': { id: 'hero-x', layout: 'LayoutA', elements: {} },
          [sid]: { id: sid, layout: CMS_COLLECTION_LAYOUT, elements: { collectionId } },
        },
      };
    });
    return sid;
  }

  it('removes the placement on the CURRENT page (both halves + sections entry)', () => {
    const sid = store.getState().addCmsSection('col-1');

    const removed = store.getState().removeCmsSectionsForCollection('col-1');
    const s = store.getState();

    expect(removed).toBe(1);
    expect(s.sections).toEqual(['hero-1']);
    expect(s.sectionLayouts[sid]).toBeUndefined();
    expect(s.content[sid]).toBeUndefined();
    expect(s.persistence.isDirty).toBe(true);
  });

  it('ALSO removes placements stored in state.pages[*] (place → switch page → delete)', () => {
    const active = store.getState().addCmsSection('col-1');
    const onPageA = stashPage(store, 'pageA', 'col-1');
    const onPageB = stashPage(store, 'pageB', 'col-1');

    const removed = store.getState().removeCmsSectionsForCollection('col-1');
    const s = store.getState() as any;

    expect(removed).toBe(3);
    expect(s.content[active]).toBeUndefined();
    for (const [pageId, sid] of [
      ['pageA', onPageA],
      ['pageB', onPageB],
    ] as const) {
      const page = s.pages[pageId];
      expect(page.sections).toEqual(['hero-x']);
      expect(page.sectionLayouts[sid]).toBeUndefined();
      expect(page.content[sid]).toBeUndefined();
    }
  });

  it('leaves a DIFFERENT collection’s placement completely alone', () => {
    const keep = store.getState().addCmsSection('col-2');
    const doomed = store.getState().addCmsSection('col-1');
    const keepOnPage = stashPage(store, 'pageA', 'col-2');

    const removed = store.getState().removeCmsSectionsForCollection('col-1');
    const s = store.getState() as any;

    expect(removed).toBe(1);
    expect(s.content[doomed]).toBeUndefined();
    expect(s.content[keep].elements.collectionId).toBe('col-2');
    expect(s.sectionLayouts[keep]).toBe(CMS_COLLECTION_LAYOUT);
    expect(s.pages.pageA.content[keepOnPage]).toBeDefined();
    expect(s.pages.pageA.sections).toContain(keepOnPage);
  });

  it('never touches a non-cms section, even one whose content names the collection', () => {
    // Type-prefix gate: only `cmscollection-*` ids are eligible. Without it a
    // hero that happened to carry a `collectionId` element would be deleted.
    store.setState((state: any) => {
      state.content['hero-1'].elements.collectionId = 'col-1';
    });
    const doomed = store.getState().addCmsSection('col-1');

    const removed = store.getState().removeCmsSectionsForCollection('col-1');
    const s = store.getState();

    expect(removed).toBe(1);
    expect(s.sections).toEqual(['hero-1']);
    expect(s.content['hero-1']).toBeDefined();
    expect(s.content[doomed]).toBeUndefined();
  });

  it('is a no-op (0 removed, draft not dirtied) when nothing references it', () => {
    store.setState((state: any) => {
      state.persistence.isDirty = false;
    });

    const removed = store.getState().removeCmsSectionsForCollection('col-nope');

    expect(removed).toBe(0);
    expect(store.getState().sections).toEqual(['hero-1']);
    expect(store.getState().persistence.isDirty).toBe(false);
  });
});
