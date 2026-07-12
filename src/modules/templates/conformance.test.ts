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
// the store via `useEditStoreLegacy`/`useEditStoreApi` (block hooks + image
// toolbar) and `useEditStoreContext` (element-exclusion) — mock all three onto
// one vanilla store seeded from the shared block mocks. Per-file hoisted `vi.mock`
// shims (can't move to the harness); the store SHAPE builder lives in the harness.
const h = vi.hoisted(() => ({ store: null as any }));

vi.mock('@/hooks/useEditStoreLegacy', () => ({
  useEditStoreLegacy: (selector?: (s: any) => any) =>
    selector ? selector(h.store.getState()) : h.store.getState(),
  useEditStoreApi: () => h.store,
}));

vi.mock('@/components/EditProvider', () => ({
  useEditStoreContext: () => ({ store: h.store, isReady: true, isInitialized: true, error: null }),
}));

import { templateMeta } from './templateMeta';
import { blockManifests } from './blockManifest';
import { engineCoreSections } from '@/modules/engines/coreSections';
import { templateIds } from '@/types/service';
import { capabilityIds } from '@/types/brief';
import { getCollectionDef } from '@/modules/collections/registry';

import { resolveLumenBlock } from './lumen/resolveLumenBlock';
import { LumenPlaceholderBlock } from './lumen/LumenPlaceholderBlock';
import { createHarnessStore } from './blockMocks/harness';
import { ALL_BLOCK_MOCK_SECTIONS } from './blockMocks';

// phase 11b round-trip guard: prove atelier chrome keys survive the store→render
// read path (extractLayoutContent iterates ONLY schema keys — a non-schema key is
// dropped). Plain data imports; test-only.
import { extractLayoutContent } from '@/types/storeTypes';
import { getSchemaDefaults } from '@/modules/sections/layoutElementSchema';

// Hearth knob/looks pilot (template-factory phase 8). Pure data imports (tokens /
// palettes / service types) — no template-module (client) surface pulled in.
import { hearthKnobs, hearthVariants, buildHearthStylesheet } from './hearth/tokens';
import { hearthPalettes } from '@/types/service';
import { HearthSSRTokens } from './hearth/components/HearthSSRTokens';

// Atelier knob enrollment (phase 6). Pure data imports (tokens) + the published
// SSRTokens for the back-compat evidence — no client-only surface pulled in.
import { atelierKnobs, buildAtelierStylesheet } from './atelier/tokens';
import { AtelierSSRTokens } from './atelier/components/AtelierSSRTokens';

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
  // atelier (atelier-template phase 11) — 8 blocks, incl. the works image
  // collection (add/remove/reorder) + packages at 2/3/4 cards. Mocks in
  // blockMocks/index.ts; non-vacuous (empty mocks → the deferred-template branch).
  assertEditorBasics('atelier');

  // ── ROUND-TRIP PERSISTENCE (atelier-template phase 11b) ────────────────────
  // assertEditorBasics is marker-only: it proves a chrome key is WRAPPED in an
  // edit primitive, NOT that a value set for it SURVIVES the store→render read
  // (extractLayoutContent iterates ONLY schema keys, dropping non-schema ones).
  // Phase 11 shipped green while chrome keys leaked design placeholders precisely
  // because that round-trip was unchecked. This pins it for atelier's chrome keys:
  // a value set in `elements` must come back out of extractLayoutContent (i.e. the
  // key is in the schema) — the exact class of bug 11b fixed.
  describe('atelier chrome-key round-trip persistence (phase 11b)', () => {
    // (layout, key, value) — one representative chrome key per affected block.
    const CASES: Array<[string, string, string]> = [
      ['AtelierFooter', 'closer_headline', 'Let’s make yours.'],
      ['AtelierFooter', 'legal_text', 'Privacy · Terms'],
      ['AtelierContact', 'instagram', '@studioname'],
      ['AtelierAbout', 'badge_text', 'Maker · City'],
      ['AtelierWorkGallery', 'more_text', 'View the full portfolio →'],
      ['AtelierQuoteBand', 'headline', 'Kind words'],
    ];

    for (const [layout, key, value] of CASES) {
      it(`${layout}.${key} survives extractLayoutContent (schema-backed, not dropped)`, () => {
        const schema = getSchemaDefaults(layout);
        expect(schema, `${layout} has no schema defaults`).toBeTruthy();
        // The key must be part of the schema-derived contract...
        expect(Object.keys(schema!)).toContain(key);
        // ...and a set value must come back out unchanged (round-trip).
        const out = extractLayoutContent(
          { [key]: value } as any,
          schema as any,
          layout,
        );
        expect((out as any)[key]).toBe(value);
      });
    }

    it('a NON-schema key is still DROPPED (proves the check is real, not vacuous)', () => {
      const schema = getSchemaDefaults('AtelierFooter')!;
      const out = extractLayoutContent(
        { __not_a_schema_key__: 'leak' } as any,
        schema as any,
        'AtelierFooter',
      );
      expect((out as any).__not_a_schema_key__).toBeUndefined();
    });
  });

  // ── KNOB + LOOKS conformance (template-factory phase 8) ────────────────────
  // hearth is the FIRST template to opt into knobs (dormant rules from phase 3
  // activate here). The valid variant/palette id sets are passed in from hearth's
  // pure data so templateConformance stays free of template-module imports.
  const HEARTH_VARIANT_IDS = hearthVariants.map((v) => v.id);
  assertKnobConformance('hearth', hearthKnobs);
  // atelier (phase 6) — full 5-axis declaration: real alternates on buttonShape/
  // cardStyle/density, default-only typePairing/texture.
  assertKnobConformance('atelier', atelierKnobs);
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

  // ── back-compat + renderer-parity evidence (atelier knobs, phase 6) ────────
  // Same two claims as the hearth gate: (1) default emits nothing (byte-identical
  // to base+palette+variant); (2) a non-default knob emits scoped CSS + a wrapper
  // attr in the published renderer (AtelierSSRTokens consumes the prop — no silent
  // no-op). The edit-side AtelierThemeInjector shares buildAtelierStylesheet +
  // knobDataAttributes, so knob CSS + attrs are byte-identical across renderers.
  describe('phase-6 knob back-compat + parity evidence (atelier)', () => {
    const baselineStylesheet = buildAtelierStylesheet();

    it('default: no knobs / all-default knobs emit NOTHING (byte-identical stylesheet)', () => {
      expect(buildAtelierStylesheet()).toBe(baselineStylesheet);
      expect(buildAtelierStylesheet(null)).toBe(baselineStylesheet);
      expect(buildAtelierStylesheet({})).toBe(baselineStylesheet);
      // Explicit axis DEFAULTS still emit nothing (default = :root).
      expect(
        buildAtelierStylesheet({ buttonShape: 'rounded', cardStyle: 'hairline', density: 'comfortable', typePairing: 'classic', texture: 'none' }),
      ).toBe(baselineStylesheet);
      expect(baselineStylesheet).not.toContain('data-knob-');
    });

    it('default: AtelierSSRTokens published markup carries NO data-knob-* attr', () => {
      const html = renderToStaticMarkup(
        React.createElement(AtelierSSRTokens, { paletteId: 'vermilion' as any }),
      );
      expect(html).not.toContain('data-knob-');
    });

    it('non-default: a knob emits scoped CSS AND a wrapper attr in the published renderer', () => {
      const css = buildAtelierStylesheet({ buttonShape: 'pill' });
      expect(css).toContain('[data-knob-buttonShape="pill"]');
      expect(css).toContain('--btn-r:999px');
      expect(css.length).toBeGreaterThan(baselineStylesheet.length);

      const html = renderToStaticMarkup(
        React.createElement(AtelierSSRTokens, {
          paletteId: 'vermilion' as any,
          knobs: { buttonShape: 'pill', cardStyle: 'flat', density: 'compact' },
        }),
      );
      expect(html).toContain('data-knob-buttonShape="pill"');
      expect(html).toContain('data-knob-cardStyle="flat"');
      expect(html).toContain('data-knob-density="compact"');
      expect(html).toContain('[data-knob-buttonShape="pill"]');
      expect(html).toContain('[data-knob-cardStyle="flat"]');
      expect(html).toContain('[data-knob-density="compact"]');
    });

    // Dual-renderer parity guard (regression): the compact density knob is applied
    // on :root in the editor (documentElement) but on a wrapper <div> in published
    // (AtelierSSRTokens). Custom-property var() substitution resolves at the
    // DECLARING scope, so a wrapper-scoped `--space:0.82` would leave the :root-
    // declared `--sec-y`/`--pad-y`/`--pad-y-sm` uncompressed for descendants in the
    // PUBLISHED renderer (rhythm compresses in editor only). The compact block MUST
    // therefore redeclare the FINAL section-rhythm vars directly (not only --space).
    it('parity: compact density redeclares the FINAL section-rhythm vars, not only --space', () => {
      const css = buildAtelierStylesheet({ density: 'compact' });
      const block = css.slice(css.indexOf('[data-knob-density="compact"]'));
      expect(block).toContain('--space:0.82');
      // The load-bearing assertion — these must appear inside the wrapper-scoped
      // block so a :root-descendant knob still compresses rhythm in published.
      expect(block).toContain('--pad-y:');
      expect(block).toContain('--pad-y-sm:');
    });
  });

  // ── GLOBAL sanity: at least one manifest declaration exists to check ───────
  it('block manifests declare at least one variant to check', () => {
    const total = Object.values(blockManifests).reduce(
      (n, manifest) =>
        n + Object.values(manifest ?? {}).reduce((m, set) => m + set.variants.length, 0),
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

  // ── GLOBAL: (d) dormancy lock + regression + negative fixtures ─────────────
  describe('(d) scale-10: collection-family cross-template invariants', () => {
    // Dormancy lock: NO shipping template declares a collection-family
    // capability today (the per-template (d) check ships vacuous). If a rung-C
    // template adds one, this flips red and the implementer must supply the
    // block pair.
    it('DORMANT: no shipping template declares a collection-family capability (whole check is vacuous)', () => {
      for (const templateId of templateIds) {
        for (const cap of COLLECTION_FAMILY) {
          expect(
            templateMeta[templateId].capabilities,
            `${templateId} declares collection-family "${cap}" — the (d) check is no longer dormant; ensure its catalog+item block pair resolves`
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
    });
  });

  // ── TEMPLATE-SPECIFIC: techpremium retired (out of every check) ────────────
  it('techpremium is retired with empty engine/capability lists (out of every check)', () => {
    expect(templateMeta.techpremium.retired).toBe(true);
    expect(templateMeta.techpremium.copyEngines).toEqual([]);
    expect(templateMeta.techpremium.capabilities).toEqual([]);
  });
});
