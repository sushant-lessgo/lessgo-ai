// i18n-phase-1 Phase 3a — editor store STATE layer.
// No render/read threading exists yet (that's 3b), so this phase is validated
// entirely via the store: write-branch matrix, locale-shared structural write,
// history behaviour, full-map export invariant, page-flush carry, regen guard,
// and hydrate/back-compat. Mirrors Phase-2 test(f)'s `declaredLocalesFullyPresent`
// so the store-side flush plugs into the same fixture shape.

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createEditStore } from '@/stores/editStore';

type Store = ReturnType<typeof createEditStore>;

const HERO = 'hero-1';
const CONFIG_EN_NL = { locales: ['en', 'nl'], defaultLocale: 'en' } as const;

function seed(store: Store, opts: { localeConfig?: any } = {}) {
  store.getState().loadFromDraft(
    {
      tokenId: 'tok-i18n-3a',
      title: 'i18n 3a',
      ...(opts.localeConfig ? { localeConfig: opts.localeConfig } : {}),
      finalContent: {
        sections: [HERO],
        sectionLayouts: { [HERO]: 'LayoutA' },
        content: {
          [HERO]: {
            id: HERO,
            layout: 'LayoutA',
            elements: {
              headline: 'Hello',
              subheadline: 'World',
              bullets: ['a', 'b'],
              // object-array collection (locale-SHARED structure, not text)
              cards: [{ id: 'c1', title: 'A' }, { id: 'c2', title: 'B' }],
            },
            aiMetadata: { aiGenerated: false, isCustomized: false, aiGeneratedElements: [] },
            editMetadata: { lastModified: 0, validationStatus: { isValid: true, errors: [], warnings: [], missingRequired: [], lastValidated: 0 } },
          },
        },
        theme: {},
      },
    },
    'tok-i18n-3a',
  );
}

// Mirror of Phase-2 test(f): every declared non-default locale must be present +
// non-empty in the map (a partial/empty map would wipe an authored locale).
const declaredLocalesFullyPresent = (config: any, lc: any) =>
  (config.locales as string[])
    .filter((l) => l !== config.defaultLocale)
    .every((l) => lc?.[l] && Object.keys(lc[l]).length > 0);

describe('i18n Phase 3a — store state layer', () => {
  let store: Store;
  beforeEach(() => {
    store = createEditStore('tok-i18n-3a');
    seed(store, { localeConfig: CONFIG_EN_NL });
  });

  // ===== Deliverable #1: text-write branch matrix =====
  describe('write-branch matrix', () => {
    it('default locale writes base content, no overlay created', () => {
      store.getState().updateElementContent(HERO, 'headline', 'Hello edited');
      const s = store.getState();
      expect(s.content[HERO].elements.headline).toBe('Hello edited');
      expect(Object.keys(s.localeContent)).toEqual([]);
    });

    it('non-default locale writes the overlay and leaves base untouched (string)', () => {
      store.getState().setActiveLocale('nl');
      store.getState().updateElementContent(HERO, 'headline', 'Hallo');
      const s = store.getState();
      expect(s.localeContent.nl[HERO].headline).toBe('Hallo');
      expect(s.content[HERO].elements.headline).toBe('Hello'); // base intact
    });

    it('non-default locale overlays string[] text', () => {
      store.getState().setActiveLocale('nl');
      store.getState().updateElementContent(HERO, 'bullets', ['x', 'y']);
      const s = store.getState();
      expect(s.localeContent.nl[HERO].bullets).toEqual(['x', 'y']);
      expect(s.content[HERO].elements.bullets).toEqual(['a', 'b']); // base intact
    });

    it('bulkUpdateSection overlays text under a non-default locale, base untouched', () => {
      store.getState().setActiveLocale('nl');
      store.getState().bulkUpdateSection(HERO, { headline: 'Hallo', subheadline: 'Wereld' });
      const s = store.getState();
      expect(s.localeContent.nl[HERO].headline).toBe('Hallo');
      expect(s.localeContent.nl[HERO].subheadline).toBe('Wereld');
      expect(s.content[HERO].elements.headline).toBe('Hello');
    });

    it('switching back to default resumes base writes without touching the overlay', () => {
      store.getState().setActiveLocale('nl');
      store.getState().updateElementContent(HERO, 'headline', 'Hallo');
      store.getState().setActiveLocale('en');
      store.getState().updateElementContent(HERO, 'headline', 'Hello v2');
      const s = store.getState();
      expect(s.content[HERO].elements.headline).toBe('Hello v2');
      expect(s.localeContent.nl[HERO].headline).toBe('Hallo'); // overlay preserved
    });
  });

  // ===== Deliverable #2: locale-shared structural write =====
  describe('locale-shared structure (setSection)', () => {
    it("a structural setSection under activeLocale='nl' mutates base only, overlay untouched", () => {
      store.getState().setActiveLocale('nl');
      // seed an overlay so we can prove it is left untouched
      store.getState().updateElementContent(HERO, 'headline', 'Hallo');
      const before = JSON.stringify(store.getState().localeContent);

      // structural element-map replacement (the shape every setSection caller sends)
      store.getState().setSection(HERO, {
        elements: {
          headline: 'Hello',
          subheadline: 'World',
          bullets: ['a', 'b'],
          newBlock: 'added',
        } as any,
      });

      const s = store.getState();
      expect(s.content[HERO].elements.newBlock).toBe('added'); // base mutated
      expect(JSON.stringify(s.localeContent)).toBe(before); // overlay untouched
    });
  });

  // ===== locale-aware undo/redo (step 4) =====
  describe('undo/redo', () => {
    it('default-locale edit pushes a history entry and undo restores base', () => {
      const base0 = store.getState().history.undoStack.length;
      store.getState().updateElementContent(HERO, 'headline', 'Hello edited');
      expect(store.getState().history.undoStack.length).toBe(base0 + 1);
      store.getState().undo();
      expect(store.getState().content[HERO].elements.headline).toBe('Hello');
    });

    it('non-default-locale edit pushes a locale-tagged entry; undo restores the NL overlay value, EN base untouched; redo re-applies to the overlay', () => {
      store.getState().setActiveLocale('nl');
      // two non-coalescing NL edits to the SAME key (interleaved with a different
      // key so the second headline edit is a fresh entry, not a coalesce).
      store.getState().updateElementContent(HERO, 'headline', 'Hallo');
      store.getState().updateElementContent(HERO, 'subheadline', 'Ondertitel');
      store.getState().updateElementContent(HERO, 'headline', 'Hallo v2');

      const top = store.getState().history.undoStack.at(-1)!;
      expect(top.type).toBe('content');
      expect(top.locale).toBe('nl');

      // undo → headline overlay back to the PREVIOUS NL value; EN base intact.
      store.getState().undo();
      let s = store.getState();
      expect(s.localeContent.nl[HERO].headline).toBe('Hallo');
      expect(s.content[HERO].elements.headline).toBe('Hello'); // base untouched

      // redo → re-applies to the overlay (not base).
      store.getState().redo();
      s = store.getState();
      expect(s.localeContent.nl[HERO].headline).toBe('Hallo v2');
      expect(s.content[HERO].elements.headline).toBe('Hello');
    });

    it('undo of the FIRST NL edit reverts the overlay to base fallback, EN base intact', () => {
      store.getState().setActiveLocale('nl');
      store.getState().updateElementContent(HERO, 'headline', 'Hallo');
      store.getState().undo();
      const s = store.getState();
      // overlay no longer holds a value → readers fall back to base
      expect(s.localeContent.nl?.[HERO]?.headline).toBeUndefined();
      expect(s.content[HERO].elements.headline).toBe('Hello');
    });

    it('a locale-shared collection object-array edit under NL writes base + undoes against base (never mis-routed to the overlay)', () => {
      store.getState().setActiveLocale('nl');
      // object-array (not text) → falls through to the BASE write even under 'nl'
      store.getState().updateElementContent(HERO, 'cards', [{ id: 'c1', title: 'A' }, { id: 'c2', title: 'C' }] as any);
      let s = store.getState();
      expect(s.content[HERO].elements.cards).toEqual([{ id: 'c1', title: 'A' }, { id: 'c2', title: 'C' }]);
      // no non-text array injected into the text-only overlay
      expect(s.localeContent.nl?.[HERO]?.cards).toBeUndefined();
      // the base-write history entry is stamped with the DEFAULT locale, not 'nl'
      expect(s.history.undoStack.at(-1)!.locale).toBe('en');

      // undo reverts the BASE array; overlay stays empty
      store.getState().undo();
      s = store.getState();
      expect(s.content[HERO].elements.cards).toEqual([{ id: 'c1', title: 'A' }, { id: 'c2', title: 'B' }]);
      expect(s.localeContent.nl?.[HERO]?.cards).toBeUndefined();
    });

    it('history survives a locale switch; an EN edit after switch-back undoes against base while the NL overlay is left intact', () => {
      store.getState().setActiveLocale('nl');
      store.getState().updateElementContent(HERO, 'headline', 'Hallo'); // NL entry
      store.getState().setActiveLocale('en'); // history preserved (no clear)
      store.getState().updateElementContent(HERO, 'headline', 'Hello v2'); // EN entry

      // undo the EN edit → base reverts; NL overlay untouched.
      store.getState().undo();
      let s = store.getState();
      expect(s.content[HERO].elements.headline).toBe('Hello');
      expect(s.localeContent.nl[HERO].headline).toBe('Hallo');

      // undo again → reverts the NL edit (overlay), base still base.
      store.getState().undo();
      s = store.getState();
      expect(s.localeContent.nl?.[HERO]?.headline).toBeUndefined();
      expect(s.content[HERO].elements.headline).toBe('Hello');
    });
  });

  // ===== Deliverable: full-map export invariant (contract i) =====
  describe('export / full-map invariant', () => {
    it('export ships the COMPLETE overlay inside finalContent and passes declaredLocalesFullyPresent', () => {
      store.getState().setActiveLocale('nl');
      store.getState().updateElementContent(HERO, 'headline', 'Hallo');
      const exported: any = store.getState().export();
      expect(exported.localeContent.nl[HERO].headline).toBe('Hallo');
      expect(declaredLocalesFullyPresent(CONFIG_EN_NL, exported.localeContent)).toBe(true);
    });

    it('legacy (no overlay) export omits the localeContent key entirely', () => {
      const legacy = createEditStore('tok-legacy-3a');
      seed(legacy); // no localeConfig
      const exported: any = legacy.getState().export();
      expect('localeContent' in exported).toBe(false);
    });
  });

  // ===== save() payload — contract ii (never send null localeConfig) =====
  describe('save() payload', () => {
    const realFetch = global.fetch;
    afterEach(() => { global.fetch = realFetch; });

    async function captureSaveBody(s: Store): Promise<any> {
      const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }) as any);
      global.fetch = fetchMock as any;
      await s.getState().save();
      const call = fetchMock.mock.calls.find((c: any) => String(c[0]).includes('/api/saveDraft'));
      return JSON.parse((call![1] as any).body);
    }

    it('multi-locale save sends top-level localeConfig + overlay inside finalContent', async () => {
      store.getState().setActiveLocale('nl');
      store.getState().updateElementContent(HERO, 'headline', 'Hallo');
      const body = await captureSaveBody(store);
      expect(body.localeConfig).toEqual(CONFIG_EN_NL);
      expect(body.finalContent.localeContent.nl[HERO].headline).toBe('Hallo');
    });

    it('legacy save OMITS localeConfig entirely (never sends null)', async () => {
      const legacy = createEditStore('tok-legacy-save');
      seed(legacy); // no localeConfig → state.localeConfig === null
      const body = await captureSaveBody(legacy);
      expect('localeConfig' in body).toBe(false);
      expect(body.finalContent.localeContent).toBeUndefined();
    });
  });

  // ===== page-flush carry (step 6) =====
  describe('multi-page carry', () => {
    it('activeLocale + overlay survive a page switch (project-global, keyed by unique sectionId)', () => {
      store.getState().setActiveLocale('nl');
      store.getState().updateElementContent(HERO, 'headline', 'Hallo');
      const newId = store.getState().addPage({ title: 'Contact', pathSlug: '/contact' }); // switches page
      let s = store.getState();
      expect(s.currentPageId).toBe(newId);
      expect(s.activeLocale).toBe('nl'); // project-global, survives
      expect(s.localeContent.nl[HERO].headline).toBe('Hallo'); // overlay intact
      store.getState().setCurrentPage('home');
      s = store.getState();
      expect(s.activeLocale).toBe('nl');
      expect(s.localeContent.nl[HERO].headline).toBe('Hallo');
    });
  });

  // ===== regen guard (step 5) =====
  describe('regen guard', () => {
    it('regenerateSection no-ops on a non-default locale (no base mutation)', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      store.getState().setActiveLocale('nl');
      await store.getState().regenerateSection(HERO);
      expect(store.getState().content[HERO].elements.headline).toBe('Hello');
      expect(store.getState().aiGeneration.isGenerating).toBe(false);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    it('updateFromAIResponse no-ops on a non-default locale (base not clobbered)', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      store.getState().setActiveLocale('nl');
      store.getState().updateFromAIResponse({ success: true, content: { [HERO]: { headline: 'AI EN' } } });
      expect(store.getState().content[HERO].elements.headline).toBe('Hello');
      warn.mockRestore();
    });
  });

  // ===== hydrate / back-compat =====
  describe('hydrate', () => {
    it('loadFromDraft restores localeConfig, activeLocale=default, and the overlay', () => {
      const fresh = createEditStore('tok-hyd');
      fresh.getState().loadFromDraft(
        {
          tokenId: 'tok-hyd',
          title: 'H',
          localeConfig: CONFIG_EN_NL,
          finalContent: {
            sections: [HERO],
            sectionLayouts: { [HERO]: 'LayoutA' },
            content: { [HERO]: { id: HERO, layout: 'LayoutA', elements: { headline: 'Hello' } } },
            localeContent: { nl: { [HERO]: { headline: 'Hallo' } } },
            theme: {},
          },
        },
        'tok-hyd',
      );
      const s = fresh.getState();
      expect(s.localeConfig).toEqual(CONFIG_EN_NL);
      expect(s.activeLocale).toBe('en'); // default on load
      expect(s.localeContent.nl[HERO].headline).toBe('Hallo');
    });

    it('legacy hydrate → null config, activeLocale=en, empty overlay', () => {
      const legacy = createEditStore('tok-legacy-hyd');
      seed(legacy); // no localeConfig / no overlay
      const s = legacy.getState();
      expect(s.localeConfig).toBeNull();
      expect(s.activeLocale).toBe('en');
      expect(s.localeContent).toEqual({});
    });
  });
});
