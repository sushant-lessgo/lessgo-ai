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

import {
  templateConformance,
  RESOLVERS,
  STRUCTURAL_CAPABILITIES,
  COLLECTION_FAMILY,
  assertCollectionCapabilityBacked,
  assertEditorBasics,
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
