// Template conformance tests — scalePlan §6a/§6b (template-factory phase 1).
//
// The per-template structural checks (a)/(b)/(b+)/(c)/(d)/(e) + the folded
// block-manifest data checks live in the PARAMETERIZED suite
// `templateConformance(templateId)` (`./templateConformance`). This file:
//   1. calls `templateConformance(id)` once per templateId (adding a template
//      later = add one line to the loop);
//   2. keeps the truly CROSS-TEMPLATE / GLOBAL assertions (resolver + meta key
//      parity, structural-cap subset, the (d) dormancy lock + negative
//      fixtures) and the TEMPLATE-SPECIFIC exemption proofs (lumen bespoke,
//      techpremium retired, vestria flat-grid) here.
//
// The "designer's bar": templateMeta declarations must be TRUE against the
// dispatch resolvers (the ground truth). A red test here means a declaration
// lies — fix the metadata (templateMeta / engineCoreSections), never weaken the
// assertions.
//
// Published/client boundary is enforced GLOBALLY by
// `src/modules/templates/publishedClientBoundary.test.ts` (filesystem walk over
// every `*.published.tsx` import graph) — not here; see that file + the
// `templateConformance` header for the cross-reference.
//
// Static imports of resolvers/placeholders/schemas are fine: test files never
// enter the app bundle (vitest-only), so the registry firewall is unaffected.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';

// ── editor-basics store mock (template-factory phase 2) ──────────────────────
// The editor-basics subset (assertEditorBasics) renders edit blocks in
// mode:'preview' to observe the `data-edit-primitive` markers. Edit blocks read
// the store via `useEditStore`/`useEditStoreApi` (block hooks + image
// toolbar) and `useEditStoreContext` (element-exclusion) — mock all three onto
// one vanilla store seeded from the shared block mocks. Per-file hoisted `vi.mock`
// shims (can't move to the harness); the store SHAPE builder lives in the harness.
const h = vi.hoisted(() => ({ store: null as any }));

vi.mock('@/hooks/useEditStore', () => ({
  useEditStore: (selector?: (s: any) => any) =>
    selector ? selector(h.store.getState()) : h.store.getState(),
  useEditStoreApi: () => h.store,
}));

vi.mock('@/components/EditProvider', () => ({
  useEditStoreContext: () => ({ store: h.store, isReady: true, isInitialized: true, error: null }),
}));

import { templateMeta } from './templateMeta';
import { blockManifests, builtVariantCount } from './blockManifest';
import { engineCoreSections } from '@/modules/engines/coreSections';
import { templateIds } from '@/types/service';
import { capabilityIds } from '@/types/brief';
import { getCollectionDef } from '@/modules/collections/registry';

import { resolveLumenBlock } from './lumen/resolveLumenBlock';
import { LumenPlaceholderBlock } from './lumen/LumenPlaceholderBlock';
import { createHarnessStore } from './blockMocks/harness';
import { ALL_BLOCK_MOCK_SECTIONS } from './blockMocks';

// Hearth knob/looks pilot (template-factory phase 8). Pure data imports (tokens /
// palettes / service types) — no template-module (client) surface pulled in.
import { hearthKnobs, hearthVariants, buildHearthStylesheet } from './hearth/tokens';
import { hearthPalettes } from '@/types/service';
import { HearthSSRTokens } from './hearth/components/HearthSSRTokens';

// atelier-skeleton-cutover: the OLD hand-written atelier skin's evidence blocks
// (chrome-key round-trip, knob conformance, knob back-compat/parity) are RETIRED
// here — atelier now rides the work-skeleton, so its coverage comes from the
// parameterized templateConformance('atelier') loop + the skeleton blocks below.
// The old-skin token/SSRToken imports are gone so the phase-4 dir delete can't
// break this file.

// Work-skeleton (atelier skin) — engine-core + skin-token BOUNDS conformance.
// Pure data imports: the registered skin data + the skeleton's loud bounds gate.
// The standard (a) engine-core loop covers atelier (non-bespoke); the explicit
// block below enforces it anyway so the work-skeleton coverage bites for real.
// assertSkinTokens is the AC-L122 "out-of-range fails loud" gate, run per
// registered skin + proven to throw.
import { atelierSkin } from './atelier2/skin';
import { assertSkinTokens, type WorkSkinTokens } from '@/modules/skeletons/work/tokenContract';
import { skeletonBackedTemplateIds } from '@/modules/skeletons/ids';

import {
  templateConformance,
  RESOLVERS,
  STRUCTURAL_CAPABILITIES,
  COLLECTION_FAMILY,
  assertCollectionCapabilityBacked,
  assertEditorBasics,
  assertKnobConformance,
  assertLooksConformance,
  resolvesReal,
} from './templateConformance';

// Seed the shared store from EVERY enrolled section so all sectionIds resolve.
h.store = createHarnessStore(ALL_BLOCK_MOCK_SECTIONS);

describe('template conformance (scalePlan §6a/§6b)', () => {
  // ── GLOBAL: registry / meta key parity (drives every per-template check) ────
  it('has a resolver entry for every templateId (drives both checks)', () => {
    expect(Object.keys(RESOLVERS).sort()).toEqual([...templateIds].sort());
    expect(Object.keys(templateMeta).sort()).toEqual([...templateIds].sort());
  });

  // ── PER-TEMPLATE suite: one parameterized call per template ────────────────
  // Adding a template later = the loop picks it up automatically.
  for (const templateId of templateIds) {
    templateConformance(templateId);
  }

  // ── EDITOR-BASICS subset (template-factory phase 2) ────────────────────────
  // Enrolled explicitly for the templates that ship editBasics mocks (meridian +
  // hearth). surge/vestria/lex/etc. deferred (plan Q6) — they carry no mocks yet.
  assertEditorBasics('meridian');
  assertEditorBasics('hearth');
  // atelier-skeleton-cutover: atelier is NO LONGER enrolled in assertEditorBasics.
  // It now rides the work-skeleton, whose edit blocks do not emit the
  // `data-edit-primitive` markers this helper asserts. The old hand-written atelier
  // editor-basics mocks + the phase-11b chrome-key round-trip block were retired
  // with the old skin. Skeleton edit/published parity is covered by the work
  // skeleton's own renderParity.work.test.tsx + the skeleton blocks below.

  // ── KNOB + LOOKS conformance (template-factory phase 8) ────────────────────
  // hearth is the FIRST template to opt into knobs (dormant rules from phase 3
  // activate here). The valid variant/palette id sets are passed in from hearth's
  // pure data so templateConformance stays free of template-module imports.
  const HEARTH_VARIANT_IDS = hearthVariants.map((v) => v.id);
  assertKnobConformance('hearth', hearthKnobs);
  // atelier-skeleton-cutover: the old-skin atelier knob conformance (atelierKnobs
  // from the retired skin) is dropped — the work-skeleton skin supplies its own
  // knob surface (exercised via the skeleton blocks).
  assertLooksConformance(
    'hearth',
    templateMeta.hearth.looks,
    hearthKnobs,
    HEARTH_VARIANT_IDS,
    [...hearthPalettes],
  );

  // ── HUMAN-GATE EVIDENCE (template-factory phase 8): back-compat by construction
  // Proves the two claims the founder checks at the gate:
  //   1. DEFAULT emits nothing → a knob-unaware (or all-default) hearth render is
  //      BYTE-IDENTICAL to the pre-phase-8 stylesheet + wrapper.
  //   2. A NON-DEFAULT knob produces CSS + a data-attr present in BOTH renderers
  //      (same shared builder), i.e. HearthSSRTokens CONSUMES the knob prop —
  //      it does not silently no-op while the editor shows a change.
  describe('phase-8 back-compat gate evidence (hearth knobs)', () => {
    // The pre-phase-8 stylesheet = base + palette + variant, with NO knob layer.
    const baselineStylesheet = buildHearthStylesheet();

    it('default: no knobs / all-default knobs emit NOTHING (byte-identical stylesheet)', () => {
      expect(buildHearthStylesheet()).toBe(baselineStylesheet);
      expect(buildHearthStylesheet(null)).toBe(baselineStylesheet);
      expect(buildHearthStylesheet({})).toBe(baselineStylesheet);
      // Explicit axis DEFAULTS still emit nothing (default = :root).
      expect(
        buildHearthStylesheet({ buttonShape: 'rounded', density: 'comfortable' }),
      ).toBe(baselineStylesheet);
      // The baseline contains NO knob selectors at all.
      expect(baselineStylesheet).not.toContain('data-knob-');
    });

    it('default: HearthSSRTokens published markup carries NO data-knob-* attr and NO knob CSS', () => {
      const html = renderToStaticMarkup(
        React.createElement(HearthSSRTokens, { paletteId: 'terracotta' as any }),
      );
      expect(html).not.toContain('data-knob-');
    });

    it('non-default: a knob emits scoped CSS AND a wrapper attr in the published renderer', () => {
      // Stylesheet gains the scoped knob block (shared builder = same string the
      // edit-side HearthThemeInjector injects).
      const css = buildHearthStylesheet({ buttonShape: 'pill' });
      expect(css).toContain('[data-knob-buttonShape="pill"]');
      expect(css).toContain('--r-md:999px');
      expect(css.length).toBeGreaterThan(baselineStylesheet.length);

      // HearthSSRTokens CONSUMES it: the wrapper carries the data-attr AND the
      // <style> inlines the same scoped block — no silent published no-op.
      const html = renderToStaticMarkup(
        React.createElement(HearthSSRTokens, {
          paletteId: 'terracotta' as any,
          knobs: { buttonShape: 'pill', density: 'compact' },
        }),
      );
      expect(html).toContain('data-knob-buttonShape="pill"');
      expect(html).toContain('data-knob-density="compact"');
      expect(html).toContain('[data-knob-buttonShape="pill"]');
      expect(html).toContain('[data-knob-density="compact"]');
    });
  });

  // atelier-skeleton-cutover phase 1: the phase-6 atelier knob back-compat +
  // renderer-parity evidence block (buildAtelierStylesheet / AtelierSSRTokens from
  // the retired old skin) is removed. The work-skeleton skin's token/knob behavior
  // is exercised through its own skin-token bounds + skeleton blocks below.

  // ── WORK-SKELETON (atelier): engine-core resolves to real blocks ─────────────
  // atelier is skeleton-backed and section-complete (hero·work·about·footer all
  // resolve real blocks). The standard (a) loop already covers it (atelier is
  // non-bespoke); this explicit block ENFORCES engine-core belt-and-suspenders.
  describe('atelier engine-core sections resolve to real blocks (work-skeleton)', () => {
    for (const sectionType of engineCoreSections.work) {
      it(`${sectionType}: real block (edit + published)`, () => {
        resolvesReal('atelier', sectionType);
      });
    }
  });

  // ── SKIN-TOKEN BOUNDS conformance (AC-L122: out-of-range fails loud) ─────────
  // Run assertSkinTokens over every REGISTERED work skin, then prove the gate
  // BITES: an out-of-bounds fixture skin throws with the offending token listed.
  describe('work-skeleton skin-token bounds (assertSkinTokens, AC-L122)', () => {
    // The only skeleton-backed template today is atelier → its registered skin.
    it('skeletonBackedTemplateIds is exactly the work skins under bounds check', () => {
      expect(skeletonBackedTemplateIds).toContain('atelier');
    });

    it('the registered atelier skin passes assertSkinTokens (all tokens in range)', () => {
      expect(() => assertSkinTokens(atelierSkin)).not.toThrow();
    });

    it('an OUT-OF-BOUNDS skin FAILS LOUD with the offending token in the message', () => {
      // radiusPx max is 48 → 999 is out of range. Clone so the real skin is intact.
      const badTokens: WorkSkinTokens = { ...atelierSkin.tokens, radiusPx: 999 };
      const badSkin = { id: 'atelier-oob-fixture', tokens: badTokens };
      expect(() => assertSkinTokens(badSkin)).toThrow(/radiusPx/);
      expect(() => assertSkinTokens(badSkin)).toThrow(/out of range/);
    });

    it('collects EVERY violation (multiple out-of-range tokens all listed)', () => {
      const badTokens: WorkSkinTokens = {
        ...atelierSkin.tokens,
        radiusPx: 999,      // > 48
        fsBodyPx: 4,        // < 12
        displayWeight: 123, // not an enum value
      };
      let msg = '';
      try {
        assertSkinTokens({ id: 'multi-oob', tokens: badTokens });
      } catch (e) {
        msg = (e as Error).message;
      }
      expect(msg).toMatch(/radiusPx/);
      expect(msg).toMatch(/fsBodyPx/);
      expect(msg).toMatch(/displayWeight/);
      expect(msg).toMatch(/3 token violation/);
    });
  });

  // ── GLOBAL sanity: at least one manifest declaration exists to check ───────
  it('block manifests declare at least one variant to check', () => {
    // builtVariantCount (NOT raw set.variants.length) so a declared-but-not-built
    // SLOT (e.g. work-skeleton WorkHeroVideo) never inflates the coverage stat.
    const total = Object.values(blockManifests).reduce(
      (n, manifest) =>
        n + Object.values(manifest ?? {}).reduce((m, set) => m + builtVariantCount(set), 0),
      0
    );
    expect(total).toBeGreaterThan(0);
  });

  // ── GLOBAL sanity: the STRUCTURAL exemption stays inside the closed vocab ──
  it('structural capability list is a subset of the closed capability vocab', () => {
    for (const c of STRUCTURAL_CAPABILITIES) {
      expect(capabilityIds).toContain(c);
    }
  });

  // ── TEMPLATE-SPECIFIC: D-A #2 — lumen skipped by (a), exercised by (b) ─────
  describe('lumen bespoke exemption (D-A #2)', () => {
    it('is bespoke → SKIPPED by engine-core (a), even though it declares "work"', () => {
      expect(templateMeta.lumen.bespoke).toBe(true);
      expect(templateMeta.lumen.copyEngines).toContain('work');
      // Proof the exemption is load-bearing: lumen does NOT satisfy work-core
      // (granth's canonical 6 — lumen has no books/writing/praise sections).
      const missing = engineCoreSections.work.filter(
        (s) => resolveLumenBlock(s, 'edit') === LumenPlaceholderBlock
      );
      expect(missing.length).toBeGreaterThan(0);
    });

    it('is still EXERCISED by capability evidence (b): gallery + lead-form resolve', () => {
      const blockBacked = templateMeta.lumen.capabilities.filter(
        (c) => !STRUCTURAL_CAPABILITIES.includes(c)
      );
      expect(blockBacked.sort()).toEqual(['gallery', 'lead-form']);
      for (const capability of blockBacked) {
        const sectionType = templateMeta.lumen.capabilitySections?.[capability];
        expect(sectionType).toBeTruthy();
        resolvesReal('lumen', sectionType!);
      }
    });
  });

  // ── GLOBAL: (d) cross-template net + regression + negative fixtures ─────────
  describe('(d) scale-10: collection-family cross-template invariants', () => {
    // CROSS-TEMPLATE NET (E2 / phase 2 — was the dormancy lock): every template
    // that declares ANY collection-family capability runs the assert; templates
    // declaring none stay vacuously green (the loop body `continue`s). This keeps
    // the global guarantee — a NEW family declaration on ANY template must supply a
    // resolving catalog+item block pair — while atelier's `works` capability now
    // exercises it for real (no longer vacuous).
    it('every template with a declared collection-family capability resolves its catalog+item pair', () => {
      for (const templateId of templateIds) {
        assertCollectionCapabilityBacked(
          templateId,
          templateMeta[templateId].capabilities,
          templateMeta[templateId].capabilitySections
        );
      }
    });

    // The `works` capability is LIVE: the works collection resolves its workcatalog +
    // workdetail pair in both renderers. atelier-skeleton-cutover: the live `atelier`
    // id declares `works` (it is skeleton-backed).
    it.each(['atelier'] as const)(
      '%s declares `works` → workcatalog + workdetail pair resolves real (both renderers)',
      (id) => {
        expect(templateMeta[id].capabilities).toContain('works');
        expect(templateMeta[id].capabilitySections?.works).toBe('workcatalog');
        assertCollectionCapabilityBacked(
          id,
          templateMeta[id].capabilities,
          templateMeta[id].capabilitySections
        );
      },
    );

    // No template BEYOND the work look (atelier) declares a collection-family
    // capability yet — a scoped regression lock (narrower than the old whole-vocab
    // dormancy check, so the honest `works` declaration doesn't trip it).
    const WORKS_TEMPLATES = new Set(['atelier']);
    it('no template OTHER than the work look declares a collection-family capability', () => {
      for (const templateId of templateIds) {
        if (WORKS_TEMPLATES.has(templateId)) continue;
        for (const cap of COLLECTION_FAMILY) {
          expect(
            templateMeta[templateId].capabilities,
            `${templateId} declares collection-family "${cap}" — supply its catalog+item block pair (see the atelier works flip)`
          ).not.toContain(cap);
        }
      }
    });

    // Regression lock (plan-review issue-1): vestria's flat-grid `catalog`
    // stays OUT of the collection family.
    it('vestria stays flat-grid: declares `catalog`, NEVER a collection-family capability', () => {
      expect(templateMeta.vestria.capabilities).toContain('catalog');
      for (const cap of COLLECTION_FAMILY) {
        expect(
          templateMeta.vestria.capabilities,
          `vestria declares collection-family "${cap}" — flat-grid catalog must stay out of the family`
        ).not.toContain(cap);
      }
    });

    // Negative fixtures — proves the assertion BITES (fails) rather than being
    // silently vacuous. Feeds FAKE template metadata to the same assertion
    // helper and asserts it THROWS, so the real suite never goes red.
    describe('negative fixtures (assertion bites — contained, never fails the suite)', () => {
      it('declaring `products` with NO capabilitySections evidence throws', () => {
        expect(() =>
          assertCollectionCapabilityBacked('meridian', ['products'], {})
        ).toThrow();
      });

      it('declaring `services` whose section types resolve to a PLACEHOLDER throws', () => {
        // The `services` def's section types (servicecatalog/servicedetail) are
        // rung-C placeholders that NO shipping template resolves. Listing them
        // in capabilitySections satisfies the coverage check but the block-pair
        // resolution still fails — proving the resolve half of the assertion
        // bites, not just the coverage half.
        const services = getCollectionDef('services')!;
        expect(() =>
          assertCollectionCapabilityBacked('meridian', ['services'], {
            services: services.catalogSectionType,
            'services-item': services.itemSectionType,
          })
        ).toThrow();
      });

      // ── D14 option (b) closed-fail proofs for the relaxed `works` assert ─────
      it('declaring `works` WITHOUT its workcatalog value throws (relaxed coverage half still bites)', () => {
        // atelier DOES resolve both work blocks — so this proves the coverage
        // half, not the resolve half: an empty capabilitySections has no
        // `workcatalog` value, so the retained catalog `toContain` throws.
        expect(() =>
          assertCollectionCapabilityBacked('atelier', ['works'], {})
        ).toThrow();
      });

      it('declaring `works` on a resolver with NO work blocks (meridian) throws (resolve half bites)', () => {
        // Coverage passes (workcatalog IS in the map), but meridian resolves
        // neither workcatalog nor workdetail — so `resolvesReal` bites, proving
        // closed-fail with the item section registry-derived (no capabilitySections
        // entry for it).
        const works = getCollectionDef('works')!;
        expect(() =>
          assertCollectionCapabilityBacked('meridian', ['works'], {
            works: works.catalogSectionType, // 'workcatalog'
          })
        ).toThrow();
      });
    });
  });

  // ── TEMPLATE-SPECIFIC: techpremium retired (out of every check) ────────────
  it('techpremium is retired with empty engine/capability lists (out of every check)', () => {
    expect(templateMeta.techpremium.retired).toBe(true);
    expect(templateMeta.techpremium.copyEngines).toEqual([]);
    expect(templateMeta.techpremium.capabilities).toEqual([]);
  });
});
