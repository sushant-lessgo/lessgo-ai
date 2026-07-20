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
import { CMS_COLLECTION_LAYOUT, CMS_SECTION_TYPE } from '@/modules/cms/materializePublish';

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
