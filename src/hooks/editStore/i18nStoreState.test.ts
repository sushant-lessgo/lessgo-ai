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

  // ===== Phase-4 fix: engaged flag + clear-contract emission + dirty gate =====
  describe('engaged flag / clear-contract (Phase 4)', () => {
    const realFetch = global.fetch;
    afterEach(() => {
      global.fetch = realFetch;
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    async function captureSaveBody(s: Store): Promise<any> {
      const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }) as any);
      global.fetch = fetchMock as any;
      await s.getState().save();
      const call = fetchMock.mock.calls.find((c: any) => String(c[0]).includes('/api/saveDraft'));
      return call ? JSON.parse((call[1] as any).body) : null;
    }

    it('loadFromDraft with a config/overlay marks the store localeEngaged', () => {
      // beforeEach seeds CONFIG_EN_NL → engaged
      expect(store.getState().localeEngaged).toBe(true);
    });

    it('legacy hydrate leaves localeEngaged false (never engaged)', () => {
      const legacy = createEditStore('tok-legacy-engaged');
      seed(legacy); // no config, no overlay
      expect(legacy.getState().localeEngaged).toBe(false);
    });

    it('clearing config while engaged sends EXPLICIT null localeConfig + empty {} localeContent (so the route clears both)', async () => {
      // language-settings phase 1: driven through the REAL removeLocale action
      // (this used to simulate LocaleSettings' closure with its own setState
      // recipe — a drift trap). en-default ⇒ drop-to-single clears to null.
      // Fake timers so the action's own triggerAutoSave flush leaves no stray
      // real 2s timer behind after the test.
      vi.useFakeTimers();
      store.getState().setActiveLocale('nl');
      store.getState().updateElementContent(HERO, 'headline', 'Hallo');
      store.getState().removeLocale('nl');
      expect(store.getState().localeConfig).toBeNull();
      const body = await captureSaveBody(store);
      expect(body.localeConfig).toBeNull();               // explicit clear signal
      expect(body.finalContent.localeContent).toEqual({}); // explicit map replace
    });

    it('never-engaged legacy save OMITS both keys (byte-identical)', async () => {
      const legacy = createEditStore('tok-legacy-omit');
      seed(legacy);
      expect(legacy.getState().localeEngaged).toBe(false);
      const body = await captureSaveBody(legacy);
      expect('localeConfig' in body).toBe(false);
      expect(body.finalContent.localeContent).toBeUndefined();
    });

    it('export() emits localeContent:{} when engaged-but-empty, omits it when never engaged', () => {
      store.setState((s: any) => { s.localeContent = {}; s.localeEngaged = true; });
      expect((store.getState().export() as any).localeContent).toEqual({});

      const legacy = createEditStore('tok-legacy-export');
      seed(legacy);
      expect('localeContent' in (legacy.getState().export() as any)).toBe(false);
    });

    it('dirty gate: the REAL addLocale action marks isDirty and its own flush actually saves (declare-then-leave persists)', async () => {
      // The live triggerAutoSave (uiActions) debounces via setTimeout(2000) and
      // only schedules when isDirty — without addLocale's isDirty set it no-ops
      // and nothing is ever persisted.
      vi.useFakeTimers();
      const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }) as any);
      global.fetch = fetchMock as any;

      const proj = createEditStore('tok-dirty');
      seed(proj); // legacy: no config, isDirty=false after load
      proj.getState().addLocale('nl'); // real action: seeds config + engaged + isDirty + flush
      expect(proj.getState().persistence.isDirty).toBe(true); // the #1 fix

      await vi.advanceTimersByTimeAsync(2100);

      const call = fetchMock.mock.calls.find((c: any) => String(c[0]).includes('/api/saveDraft'));
      expect(call).toBeTruthy(); // the debounced save actually fired (was isDirty)
      const body = JSON.parse((call![1] as any).body);
      expect(body.localeConfig).toEqual({ locales: ['en', 'nl'], defaultLocale: 'en' });
    });
  });

  // ===== language-settings phase 1 — the extracted locale mutator ACTIONS =====
  // These replace LocaleSettings' component closures. The load-bearing case is
  // ruling 10: drop-to-single must PRESERVE a declared non-English site language
  // (localeConfig is its only durable record) while still clearing to null for
  // an English default (legacy zero-diff).
  describe('locale mutator actions (addLocale / removeLocale / setSwitcherStyle)', () => {
    const realFetch = global.fetch;
    beforeEach(() => {
      vi.useFakeTimers(); // actions call triggerAutoSave → 2s debounce
    });
    afterEach(() => {
      global.fetch = realFetch;
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    async function captureSaveBody(s: Store): Promise<any> {
      const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }) as any);
      global.fetch = fetchMock as any;
      await s.getState().save();
      const call = fetchMock.mock.calls.find((c: any) => String(c[0]).includes('/api/saveDraft'));
      return call ? JSON.parse((call[1] as any).body) : null;
    }

    function storeWith(localeConfig: any, token = 'tok-mut') {
      const s = createEditStore(token);
      seed(s, { localeConfig });
      return s;
    }

    it('addLocale on a legacy store seeds [default, added] with the original language as default', () => {
      const legacy = createEditStore('tok-add-legacy');
      seed(legacy);
      legacy.getState().addLocale('nl');
      const s = legacy.getState();
      expect(s.localeConfig).toEqual({ locales: ['en', 'nl'], defaultLocale: 'en' });
      expect(s.localeEngaged).toBe(true);
    });

    it('addLocale on an existing config appends and never duplicates', () => {
      const proj = storeWith(CONFIG_EN_NL, 'tok-add-existing');
      proj.getState().addLocale('de');
      expect(proj.getState().localeConfig!.locales).toEqual(['en', 'nl', 'de']);
      proj.getState().addLocale('de'); // idempotent
      expect(proj.getState().localeConfig!.locales).toEqual(['en', 'nl', 'de']);
    });

    it('addLocale on a declared single-NL project keeps NL as the default (base copy is Dutch)', () => {
      const proj = storeWith({ locales: ['nl'], defaultLocale: 'nl' }, 'tok-add-nl');
      proj.getState().addLocale('en');
      expect(proj.getState().localeConfig).toEqual({ locales: ['nl', 'en'], defaultLocale: 'nl' });
    });

    // ---- ruling 10, branch A: English default ⇒ clear ----
    it('removeLocale down to a single EN default CLEARS the config to null and drops the overlay', () => {
      const proj = storeWith(CONFIG_EN_NL, 'tok-drop-en');
      proj.getState().setActiveLocale('nl');
      proj.getState().updateElementContent(HERO, 'headline', 'Hallo');
      expect(proj.getState().localeContent.nl).toBeTruthy();

      proj.getState().removeLocale('nl');
      const s = proj.getState();
      expect(s.localeConfig).toBeNull();          // en default ⇒ platform default ⇒ null
      expect(s.localeContent.nl).toBeUndefined(); // removed overlay never rides a save
      expect(s.activeLocale).toBe('en');
      expect(s.localeEngaged).toBe(true);         // so the save sends an EXPLICIT null
    });

    // ---- ruling 10, branch B: non-English default ⇒ PRESERVE ----
    it('removeLocale down to a single NL default PRESERVES {locales:[nl],defaultLocale:nl} (the site language is NOT lost)', () => {
      const proj = storeWith({ locales: ['nl', 'en'], defaultLocale: 'nl' }, 'tok-drop-nl');
      proj.getState().setActiveLocale('en');
      proj.getState().updateElementContent(HERO, 'headline', 'Hello');

      proj.getState().removeLocale('en');
      const s = proj.getState();
      expect(s.localeConfig).not.toBeNull(); // the pre-ruling-10 behavior would be null here
      expect(s.localeConfig).toEqual({ locales: ['nl'], defaultLocale: 'nl' });
      expect(s.localeContent.en).toBeUndefined();
      expect(s.activeLocale).toBe('nl');
    });

    it('the preserved NL declaration is actually SENT on save (not just held in memory)', async () => {
      const proj = storeWith({ locales: ['nl', 'en'], defaultLocale: 'nl' }, 'tok-drop-nl-save');
      proj.getState().removeLocale('en');
      const body = await captureSaveBody(proj);
      expect(body.localeConfig).toEqual({ locales: ['nl'], defaultLocale: 'nl' });
      expect(body.localeConfig).not.toBeNull();
    });

    it('a preserved single-NL declaration routes text writes to BASE (activeLocale === default ⇒ no overlay)', () => {
      // Proves the six audited readers (aiActions/generationActions/contentActions/
      // historyHelpers/uiActions, all `localeConfig?.defaultLocale ?? "en"`) stay
      // correct with a non-null single-locale config: regen is unblocked and edits
      // go to base exactly as on a legacy project — now with the right language.
      const proj = storeWith({ locales: ['nl'], defaultLocale: 'nl' }, 'tok-single-nl');
      expect(proj.getState().activeLocale).toBe('nl');
      proj.getState().updateElementContent(HERO, 'headline', 'Hallo daar');
      const s = proj.getState();
      expect(s.content[HERO].elements.headline).toBe('Hallo daar');
      expect(s.localeContent).toEqual({}); // no overlay was created
    });

    it('multi→multi removeLocale keeps every surviving locale', () => {
      const proj = storeWith({ locales: ['en', 'nl', 'de'], defaultLocale: 'en' }, 'tok-multi');
      proj.getState().removeLocale('nl');
      expect(proj.getState().localeConfig).toEqual({ locales: ['en', 'de'], defaultLocale: 'en' });
    });

    // ---- switcherStyle ----
    it('setSwitcherStyle round-trips into the config and the save payload', async () => {
      const proj = storeWith(CONFIG_EN_NL, 'tok-style');
      proj.getState().setSwitcherStyle('none');
      expect(proj.getState().localeConfig!.switcherStyle).toBe('none');
      const body = await captureSaveBody(proj);
      expect(body.localeConfig).toEqual({ locales: ['en', 'nl'], defaultLocale: 'en', switcherStyle: 'none' });
    });

    it('setSwitcherStyle is a NO-OP with no localeConfig (never materializes one — zero-diff)', async () => {
      const legacy = createEditStore('tok-style-legacy');
      seed(legacy);
      legacy.getState().setSwitcherStyle('none');
      expect(legacy.getState().localeConfig).toBeNull();
      expect(legacy.getState().localeEngaged).toBe(false); // still never engaged
      expect(legacy.getState().persistence.isDirty).toBe(false);
      const body = await captureSaveBody(legacy);
      expect('localeConfig' in body).toBe(false); // key ABSENT, not null
    });

    it('an engaged config without switcherStyle serializes WITHOUT the key (absent ⇒ dropdown)', async () => {
      const proj = storeWith(CONFIG_EN_NL, 'tok-style-absent');
      proj.getState().addLocale('de');
      const body = await captureSaveBody(proj);
      expect('switcherStyle' in body.localeConfig).toBe(false);
    });

    it('switcherStyle survives the ruling-10 drop-to-single preservation', () => {
      const proj = storeWith({ locales: ['nl', 'en'], defaultLocale: 'nl' }, 'tok-style-drop');
      proj.getState().setSwitcherStyle('none');
      proj.getState().removeLocale('en');
      expect(proj.getState().localeConfig).toEqual({
        locales: ['nl'],
        defaultLocale: 'nl',
        switcherStyle: 'none',
      });
    });
  });

  // ===== reset-on-load invariant (bilingual-editing phase 2) =====
  // Locks persistenceActions.ts:467-468: a reload ALWAYS re-derives activeLocale
  // to the defaultLocale — a persisted non-default editing locale never survives
  // a reload — WHILE the authored overlay round-trips losslessly. Driven through
  // the real store-level path (export() → loadFromDraft), no fetch theatre.
  describe('reset-on-load (activeLocale re-derive)', () => {
    it('after editing in NL, a reload re-derives activeLocale to the default (en) and the NL overlay survives', () => {
      // beforeEach seeded CONFIG_EN_NL. Author an NL overlay while active in NL.
      store.getState().setActiveLocale('nl');
      store.getState().updateElementContent(HERO, 'headline', 'Hallo');
      expect(store.getState().activeLocale).toBe('nl');
      expect(store.getState().localeContent.nl[HERO].headline).toBe('Hallo');

      // Round-trip through the persistence shape: export() is exactly what save()
      // would ship; feed it back as a fresh loadFromDraft (the reset path).
      const exported: any = store.getState().export();
      store.getState().loadFromDraft(
        {
          tokenId: 'tok-i18n-3a',
          title: 'i18n 3a',
          localeConfig: CONFIG_EN_NL,
          finalContent: exported,
        },
        'tok-i18n-3a',
      );

      const s = store.getState();
      // (1) reset: editing locale re-derived to the default, NOT the persisted 'nl'.
      expect(s.activeLocale).toBe('en');
      // (2) lossless: the authored NL overlay round-tripped intact (switch never dropped it).
      expect(s.localeContent.nl[HERO].headline).toBe('Hallo');
      // base copy untouched.
      expect(s.content[HERO].elements.headline).toBe('Hello');
    });

    it('a single-locale / no-config reload falls activeLocale back to en (no defaultLocale to derive)', () => {
      // Park the store in a non-default editing locale first.
      store.getState().setActiveLocale('nl');
      expect(store.getState().activeLocale).toBe('nl');

      // Reload WITHOUT a localeConfig (legacy / single-locale project).
      store.getState().loadFromDraft(
        {
          tokenId: 'tok-i18n-3a',
          title: 'i18n 3a',
          finalContent: {
            sections: [HERO],
            sectionLayouts: { [HERO]: 'LayoutA' },
            content: { [HERO]: { id: HERO, layout: 'LayoutA', elements: { headline: 'Hello' } } },
            theme: {},
          },
        },
        'tok-i18n-3a',
      );

      const s = store.getState();
      expect(s.localeConfig).toBeNull();
      expect(s.activeLocale).toBe('en'); // fallback, not the stale 'nl'
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
