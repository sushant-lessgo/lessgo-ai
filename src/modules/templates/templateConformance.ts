// Parameterized template-conformance suite — scalePlan §6a/§6b, template-factory
// phase 1. ONE call `templateConformance(templateId)` emits every per-template
// structural conformance check for that template. Adding a template later = add
// one `templateConformance(id)` line in `conformance.test.ts`.
//
// This module is the CONSOLIDATION of the two former suites:
//   - `conformance.test.ts` groups (a)/(b)/(b+)/(c)/(d)/(e) + techpremium/lumen
//   - `blockManifest.test.ts` (deleted): default∈variants, minCards≤maxCards,
//     consumes⊆getAllElements — folded into (c) and the block-manifest data group.
// The two identical local `contractFor(layoutName)` helpers are deduped into the
// single shared `contractFor` exported here.
//
// The "designer's bar": templateMeta declarations must be TRUE against the
// dispatch resolvers (the ground truth). A red test here means a declaration
// lies — fix the metadata (templateMeta / engineCoreSections), never weaken the
// assertions.
//
// ── Published/client boundary (cross-reference) ─────────────────────────────
// This suite does NOT check the 'use client' → published-renderer import
// boundary. That is enforced GLOBALLY by
// `src/modules/templates/publishedClientBoundary.test.ts`, which walks the
// filesystem across every `*.published.tsx` import graph — stronger than a
// per-template assertion (it covers templates not yet enrolled here). Keep that
// test standalone; do not reinvent it in this factory.
//
// Static imports of resolvers/placeholders/schemas are fine: this module is only
// ever imported by vitest files (never enters the app bundle), so the registry
// firewall is unaffected — same idiom as vestria/registration.test.ts.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';

import { templateMeta } from './templateMeta';
import { BLOCK_MOCKS } from './blockMocks';
import { blockManifests, defaultIsSlot, type BlockDeclaration } from './blockManifest';
import {
  isCopyCompatible,
  isBlockEligible,
  findIncompatibleCoEligiblePairs,
  type AssetFacts,
  type ConsumedKeyKind,
} from '@/modules/generation/blockEligibility';
import { resolveEngineSectionSchema } from '@/modules/engines/elementContracts';
import { productElementSchema } from '@/modules/audience/product/elementSchema';
import { serviceElementSchema } from '@/modules/audience/service/elementSchema';
import {
  isV2Schema,
  getAllElements,
  type UIBlockSchemaV2,
} from '@/modules/sections/layoutElementSchema';
import { engineCoreSections } from '@/modules/engines/coreSections';
import { type TemplateId } from '@/types/service';
import { type CapabilityId } from '@/types/brief';
import { type TemplateKnobDeclaration, type KnobAxis } from '@/types/template';
import { type TemplateLook } from './templateMeta';
import { STANDARD_KNOB_AXES, KNOB_AXES } from './knobs';
import { COLLECTIONS, getCollectionDef, type CollectionKey } from '@/modules/collections/registry';

import { resolveMeridianBlock } from './meridian/resolveMeridianBlock';
import { MeridianPlaceholderBlock } from './meridian/MeridianPlaceholderBlock';
import { resolveTechPremiumBlock } from './techpremium/resolveTechPremiumBlock';
import { TechPremiumPlaceholderBlock } from './techpremium/TechPremiumPlaceholderBlock';
import { resolveVestriaBlock } from './vestria/resolveVestriaBlock';
import { VestriaPlaceholderBlock } from './vestria/VestriaPlaceholderBlock';
import { resolveServiceBlock as resolveHearthBlock } from './hearth/resolveServiceBlock';
import { ServicePlaceholderBlock as HearthPlaceholderBlock } from './hearth/ServicePlaceholderBlock';
import { resolveServiceBlock as resolveLexBlock } from './lex/resolveServiceBlock';
import { LexPlaceholderBlock } from './lex/LexPlaceholderBlock';
import { resolveServiceBlock as resolveSurgeBlock } from './surge/resolveServiceBlock';
import { SurgePlaceholderBlock } from './surge/SurgePlaceholderBlock';
import { resolveGranthBlock } from './granth/resolveGranthBlock';
import { GranthPlaceholderBlock } from './granth/GranthPlaceholderBlock';
import { resolveLumenBlock } from './lumen/resolveLumenBlock';
import { LumenPlaceholderBlock } from './lumen/LumenPlaceholderBlock';
import { resolveAtelierBlock } from './atelier/resolveAtelierBlock';
import { AtelierPlaceholderBlock } from './atelier/AtelierPlaceholderBlock';
// Work-skeleton dispatch (dev id `atelier2`). Static import is fine here: this
// module is vitest-only infra (never enters the app bundle) — same idiom as the
// other resolvers above. NOT a firewall breach.
import { resolveWorkBlock } from '@/modules/skeletons/work/resolveWorkBlock';
import { WorkPlaceholderBlock } from '@/modules/skeletons/work/WorkPlaceholderBlock';

export type Mode = 'edit' | 'published';

export const RESOLVERS: Record<
  TemplateId,
  {
    resolve: (sectionType: string, mode: Mode, layoutName?: string) => unknown;
    placeholder: unknown;
  }
> = {
  meridian: { resolve: resolveMeridianBlock, placeholder: MeridianPlaceholderBlock },
  techpremium: { resolve: resolveTechPremiumBlock, placeholder: TechPremiumPlaceholderBlock },
  vestria: { resolve: resolveVestriaBlock, placeholder: VestriaPlaceholderBlock },
  hearth: { resolve: resolveHearthBlock, placeholder: HearthPlaceholderBlock },
  lex: { resolve: resolveLexBlock, placeholder: LexPlaceholderBlock },
  surge: { resolve: resolveSurgeBlock, placeholder: SurgePlaceholderBlock },
  granth: { resolve: resolveGranthBlock, placeholder: GranthPlaceholderBlock },
  lumen: { resolve: resolveLumenBlock, placeholder: LumenPlaceholderBlock },
  atelier: { resolve: resolveAtelierBlock, placeholder: AtelierPlaceholderBlock },
  atelier2: { resolve: resolveWorkBlock, placeholder: WorkPlaceholderBlock },
};

// Structural capabilities are NOT block-backed: `multipage` is page-menu
// machinery and `bilingual` is the platform content-locale layer — no single
// section/block evidences them, so they are exempt from the capability-evidence
// check (D-B) here.
// `bilingual` is no longer trust-on-declaration: its machinery (overlay
// resolver, per-locale static export, switcher asset, hreflang) is asserted
// STRUCTURALLY by `src/lib/i18n/i18nHonesty.test.ts` (i18n-phase-1 D5) — that
// is the "structural check" this exemption comment previously deferred to
// "spec 02+". `multipage`'s structural check remains a future gap.
export const STRUCTURAL_CAPABILITIES: readonly CapabilityId[] = ['multipage', 'bilingual'];

export const MODES: readonly Mode[] = ['edit', 'published'];

export function resolvesReal(
  templateId: TemplateId,
  sectionType: string,
  layoutName?: string
): void {
  const { resolve, placeholder } = RESOLVERS[templateId];
  const label = layoutName ? `${sectionType}@${layoutName}` : sectionType;
  for (const mode of MODES) {
    const block = resolve(sectionType, mode, layoutName);
    expect(block, `${templateId}/${label} (${mode}) must resolve`).toBeTruthy();
    expect(
      block,
      `${templateId}/${label} (${mode}) must not be the placeholder`
    ).not.toBe(placeholder);
  }
}

function resolveComponent(
  templateId: TemplateId,
  sectionType: string,
  mode: Mode,
  layoutName: string
): unknown {
  return RESOLVERS[templateId].resolve(sectionType, mode, layoutName);
}

// ── shared element-contract helper (deduped from the two former local copies in
//    conformance.test.ts (e) and blockManifest.test.ts) ────────────────────────
/**
 * Resolve the element contract a declaration's `consumes`/classification is
 * checked against. Thing-engine (meridian/vestria) sections use the unioned
 * engine contract; service (+ non-engine product) sections use the block's own
 * layout schema.
 */
export function contractFor(layoutName: string): UIBlockSchemaV2 | null {
  const engine = resolveEngineSectionSchema(layoutName);
  if (engine) return engine;
  const own = productElementSchema[layoutName] ?? serviceElementSchema[layoutName];
  return (own as UIBlockSchemaV2) ?? null;
}

/** All element key names exposed by a schema (top-level + `collection.field`). */
function contractKeys(schema: UIBlockSchemaV2): Set<string> {
  return new Set(getAllElements(schema).map((e) => e.element));
}

// Schema-based classifier for (e). FAILS LOUDLY (throws) rather than guessing
// when a consumed key's arrayness cannot be resolved from the contract.
export function classify(layoutName: string, key: string): ConsumedKeyKind {
  const schema = contractFor(layoutName);
  if (!schema || !isV2Schema(schema)) {
    throw new Error(`(e) classify: no V2 element contract for layout "${layoutName}"`);
  }
  if (schema.elements[key]) return 'scalar';
  if (schema.collections?.[key]) return 'collection';
  const [collName] = key.split('.');
  if (key.includes('.') && schema.collections?.[collName]) return 'collection';
  throw new Error(
    `(e) classify: cannot classify consumed key "${key}" in layout "${layoutName}" (not in elements or collections)`
  );
}

const ALL_ASSETS: AssetFacts = {
  hasPhotos: true,
  hasLogos: true,
  hasTestimonials: true,
  hasTestimonialPhotos: true,
};

function synthContent(decl: BlockDeclaration): Record<string, unknown> {
  const el: Record<string, unknown> = {};
  for (const k of decl.consumes) {
    el[k] = classify(decl.layoutName, k) === 'collection' ? [{ id: '1' }] : 'x';
  }
  return el;
}

// The collection FAMILY = exactly the CollectionKeys (registry) = the per-type
// collection capabilityIds (products · services · case-studies · works).
export const COLLECTION_FAMILY = Object.keys(COLLECTIONS) as CollectionKey[];

/**
 * (d) IF a template declares a collection-family capability K, THEN:
 *   - its capabilitySections must expose the def's catalogSectionType (the single
 *     `capabilitySections[K]` value — e.g. `works: 'workcatalog'`), AND
 *   - BOTH the catalogSectionType AND the itemSectionType (registry-derived) must
 *     resolve to a REAL (non-placeholder) block in BOTH renderers.
 *
 * D14 option (b) (work-onboarding-ingestion E2, rev 3): the ITEM-section
 * `toContain` requirement is DROPPED — `capabilitySections` stays typed
 * `Partial<Record<CapabilityId, string>>` (a SINGLE string per capability, no type
 * widening, zero reader-site blast radius). The item section is instead derived
 * from the registry (`def.itemSectionType`) and guarded by `resolvesReal` — which
 * is the actual closed-fail spine: an unbacked item section falls through to the
 * placeholder and `resolvesReal` bites regardless of capabilitySections. The
 * catalog `toContain` is KEPT (the one value the map does carry must be honest).
 *
 * Exported so `conformance.test.ts` can drive it with FAKE metadata for the
 * negative fixtures (proves the assertion bites).
 */
export function assertCollectionCapabilityBacked(
  templateId: TemplateId,
  capabilities: readonly string[],
  capabilitySections: Partial<Record<string, string>> | undefined
): void {
  const declaredSectionTypes = Object.values(capabilitySections ?? {});
  for (const capability of capabilities) {
    if (!COLLECTION_FAMILY.includes(capability as CollectionKey)) continue;
    const def = getCollectionDef(capability);
    expect(
      def,
      `${templateId} declares collection-family "${capability}" but the collections registry has no CollectionDef for it`
    ).toBeTruthy();

    // Coverage half — the ONE value the (single-string) map carries must name the
    // catalog section. (The item section is registry-derived, guarded below.)
    expect(
      declaredSectionTypes,
      `${templateId} declares collection "${capability}" but capabilitySections is missing its catalog section "${def!.catalogSectionType}"`
    ).toContain(def!.catalogSectionType);

    // Resolve half — the block PAIR (catalog + item) must resolve non-placeholder
    // in BOTH renderers. `resolvesReal(itemSectionType)` is the closed-fail guard
    // that replaces the dropped item-section `toContain`.
    resolvesReal(templateId, def!.catalogSectionType);
    resolvesReal(templateId, def!.itemSectionType);
  }
}

/**
 * Emit every per-template structural conformance check for `templateId`.
 * Retired (techpremium) / bespoke (lumen) exemptions are read from templateMeta
 * and applied here: retired||bespoke skip engine-core (a); every template still
 * runs capability evidence (b)/(b+), manifest checks, and (c)/(d)/(e) when it
 * has a block manifest.
 */
export function templateConformance(templateId: TemplateId): void {
  const meta = templateMeta[templateId];
  const manifest = blockManifests[templateId];

  describe(`templateConformance(${templateId})`, () => {
    // Guarantees a non-empty suite for every template (incl. retired
    // techpremium, which skips every structural group below).
    it('is a registered template (meta + resolver entry present)', () => {
      expect(meta).toBeTruthy();
      expect(RESOLVERS[templateId]).toBeTruthy();
    });

    // ── (a) engine-core: non-retired, non-bespoke templates ──────────────────
    // retired (techpremium) and bespoke (lumen, D-A #2) are skipped for (a).
    if (meta.retired !== true && meta.bespoke !== true) {
      describe('(a) engine-core sections resolve to real blocks in both modes', () => {
        for (const engine of meta.copyEngines) {
          describe(`engine "${engine}"`, () => {
            for (const sectionType of engineCoreSections[engine]) {
              it(`${sectionType}: real block (edit + published)`, () => {
                resolvesReal(templateId, sectionType);
              });
            }
          });
        }
      });
    }

    // ── (b) capability evidence: ALL templates incl. bespoke ─────────────────
    const blockBacked = meta.capabilities.filter(
      (c) => !STRUCTURAL_CAPABILITIES.includes(c)
    );
    if (blockBacked.length > 0) {
      describe('(b) declared block-backed capabilities are evidenced by a real section', () => {
        for (const capability of blockBacked) {
          it(`${capability}: has a capabilitySections entry that resolves non-placeholder`, () => {
            const sectionType = meta.capabilitySections?.[capability];
            expect(
              sectionType,
              `${templateId} declares "${capability}" but has no capabilitySections evidence entry`
            ).toBeTruthy();
            resolvesReal(templateId, sectionType!);
          });
        }
      });
    }

    // ── (b+) EVERY capabilitySections VALUE is a real block + no orphan ───────
    // Stronger than (b): walks the map itself, so a stale/undeclared entry
    // pointing at a dead section is also red. Both renderers via resolvesReal.
    const capEntries = Object.entries(meta.capabilitySections ?? {});
    if (capEntries.length > 0) {
      describe('(b+) every capabilitySections value resolves to a real block in BOTH renderers', () => {
        for (const [capability, sectionType] of capEntries) {
          it(`${capability} → "${sectionType}": real block (edit + published)`, () => {
            resolvesReal(templateId, sectionType!);
          });

          it(`${capability} → declared in the template's capabilities list (no orphan evidence)`, () => {
            expect(meta.capabilities).toContain(capability);
          });
        }
      });
    }

    // The remaining groups all walk the block manifest — skip cleanly if a
    // template ships no manifest (keeps the suite green for manifest-less ids).
    if (!manifest) return;

    // ── (c) scale-09: variant-aware resolveBlock resolution + distinctness ────
    // (a) resolveBlock → real, non-placeholder in BOTH modes;
    // (b) DISTINCTNESS: each NON-default variant resolves to a component `!==`
    //     the section DEFAULT's component (the ONLY guard against a
    //     misregistered/misspelled variant key silently falling back to the
    //     default). EXEMPTION: `internalDispatch: true` declarations share ONE
    //     dispatcher component ⇒ asserted SAME as default, not distinct.
    // Also folds blockManifest.test.ts (1): default ∈ variants (deduped here).
    describe('(c) scale-09: manifest variant resolution + distinctness (both modes)', () => {
      for (const [sectionType, set] of Object.entries(manifest)) {
        describe(sectionType, () => {
          it('default layout is one of the declared variants', () => {
            expect(set.variants.map((v) => v.layoutName)).toContain(set.default);
          });

          for (const variant of set.variants) {
            // SLOT (work-skeleton phase 1) — declared-but-not-built: no component
            // to resolve, so it is SKIPPED by the resolution + distinctness walk.
            if (variant.slot) continue;

            it(`${variant.layoutName}: resolves to a real block (edit + published)`, () => {
              resolvesReal(templateId, sectionType, variant.layoutName);
            });

            if (variant.layoutName === set.default) continue;

            if (variant.internalDispatch) {
              it(`${variant.layoutName}: internalDispatch ⇒ SAME component as default (both modes)`, () => {
                for (const mode of MODES) {
                  const v = resolveComponent(templateId, sectionType, mode, variant.layoutName);
                  const d = resolveComponent(templateId, sectionType, mode, set.default);
                  expect(
                    v,
                    `${templateId}/${sectionType} ${variant.layoutName} (${mode}) is internalDispatch — must share the default's dispatcher component`
                  ).toBe(d);
                }
              });
            } else {
              it(`${variant.layoutName}: DISTINCT component from default "${set.default}" (both modes)`, () => {
                for (const mode of MODES) {
                  const v = resolveComponent(templateId, sectionType, mode, variant.layoutName);
                  const d = resolveComponent(templateId, sectionType, mode, set.default);
                  expect(
                    v,
                    `${templateId}/${sectionType} ${variant.layoutName} (${mode}) resolves to the SAME component as default "${set.default}" — misregistered/misspelled variant key silently falls back to default`
                  ).not.toBe(d);
                }
              });
            }
          }
        });
      }
    });

    // ── block-manifest data conformance (scale-09 D18) — folded from
    //    blockManifest.test.ts (2)+(3). (1) default∈variants lives in (c) above.
    describe('block-manifest data conformance (scale-09 D18)', () => {
      // (2) capacity sanity: minCards ≤ maxCards.
      describe('every declared capacity has minCards ≤ maxCards', () => {
        const withCapacity = Object.entries(manifest).flatMap(([sectionType, set]) =>
          set.variants.filter((v) => v.capacity).map((v) => ({ sectionType, v }))
        );
        if (withCapacity.length === 0) {
          it('declares no capacities (nothing to check)', () => {
            expect(withCapacity).toEqual([]);
          });
        } else {
          for (const { sectionType, v } of withCapacity) {
            it(`${sectionType}/${v.layoutName}`, () => {
              expect(v.capacity!.minCards).toBeLessThanOrEqual(v.capacity!.maxCards);
            });
          }
        }
      });

      // SLOT (work-skeleton phase 1) — a slot is never a set default. A
      // declared-but-not-built capability must never be the block that renders.
      describe('a slot is NEVER a set default (INVARIANT)', () => {
        for (const [sectionType, set] of Object.entries(manifest)) {
          it(`${sectionType}: default "${set.default}" is not a slot`, () => {
            expect(
              defaultIsSlot(set),
              `${templateId}/${sectionType}: default "${set.default}" names a SLOT declaration — a slot (declared-but-not-built) must never be a set default`
            ).toBe(false);
          });
        }
      });

      // (3) copy-compatibility: consumes ⊆ contract (inventing a key is red).
      describe('every declaration consumes ⊆ its section element contract', () => {
        for (const [sectionType, set] of Object.entries(manifest)) {
          for (const decl of set.variants) {
            // SLOT — no built component, so no resolvable element contract to
            // check consumes against; skipped (work-skeleton phase 1).
            if (decl.slot) continue;
            it(`${sectionType}/${decl.layoutName}`, () => {
              const contract = contractFor(decl.layoutName);
              expect(
                contract,
                `${decl.layoutName} has no resolvable element contract`
              ).toBeTruthy();
              const keys = contractKeys(contract!);
              const invented = decl.consumes.filter((k) => !keys.has(k));
              expect(
                invented,
                `${templateId}/${sectionType}/${decl.layoutName} invents keys not in contract: ${invented.join(', ')}`
              ).toEqual([]);
            });
          }
        }
      });
    });

    // ── (d) scale-10: declared collection-family capability ⇒ block PAIR ──────
    // Quantified assertion — vacuous today (no shipping template declares a
    // family cap). Becomes LIVE the moment a rung-C template declares K.
    describe('(d) scale-10: declared collection-family capability ⇒ block pair (edit + published)', () => {
      const declaredFamily = meta.capabilities.filter((c) =>
        COLLECTION_FAMILY.includes(c as CollectionKey)
      );
      it(`every declared collection capability has a resolvable catalog+item pair`, () => {
        assertCollectionCapabilityBacked(
          templateId,
          meta.capabilities,
          meta.capabilitySections
        );
        // Records the dormancy fact for this template (informational).
        expect(Array.isArray(declaredFamily)).toBe(true);
      });
    });

    // ── (e) variant-swap-integrity: no both-ways-scalar-divergent co-eligible pair ─
    // A block-variant swap must never silently drop scalar copy in BOTH
    // directions. See conformance history for the surge testimonials case.
    describe('(e) variant-swap-integrity: no both-ways-scalar-divergent co-eligible pair', () => {
      // MAIN assertion — per section: the both-ways-divergent pair list is EMPTY.
      for (const [sectionType, set] of Object.entries(manifest)) {
        it(`${sectionType}: no co-eligible pair drops scalar copy both ways`, () => {
          const bad = findIncompatibleCoEligiblePairs(set, classify);
          expect(
            bad,
            `${templateId}/${sectionType} has both-ways-scalar-divergent co-eligible pair(s): ${bad
              .map((p) => `${p.a}↔${p.b}`)
              .join(', ')} — split them with distinct copyShape tags`
          ).toEqual([]);
        });
      }

      // CONSISTENCY assertion — every DIFFERENT-copyShape but asset-co-eligible
      // pair must ALSO be runtime-hidden by isCopyCompatible when fed content
      // synthesized from the OTHER variant's consumes.
      for (const [sectionType, set] of Object.entries(manifest)) {
        const variants = set.variants;
        for (let i = 0; i < variants.length; i++) {
          for (let j = i + 1; j < variants.length; j++) {
            const A = variants[i];
            const B = variants[j];
            // SLOT (work-skeleton phase 1) — a slot is never eligible/generated,
            // so it is never co-offered; skip it from the copyShape both-ways
            // consistency check (its layout has no resolvable contract anyway).
            if (A.slot || B.slot) continue;
            const sameShape = (A.copyShape ?? undefined) === (B.copyShape ?? undefined);
            const bothEligible =
              isBlockEligible(A, { assetFacts: ALL_ASSETS }) &&
              isBlockEligible(B, { assetFacts: ALL_ASSETS });
            if (sameShape || !bothEligible) continue; // only DIFFERENT-copyShape, asset-co-eligible pairs
            it(`${sectionType}: ${A.layoutName} ⇄ ${B.layoutName} are runtime-hidden from each other's content`, () => {
              expect(
                isCopyCompatible(B, synthContent(A)),
                `${B.layoutName} should be HIDDEN from ${A.layoutName}-shaped content`
              ).toBe(false);
              expect(
                isCopyCompatible(A, synthContent(B)),
                `${A.layoutName} should be HIDDEN from ${B.layoutName}-shaped content`
              ).toBe(false);
            });
          }
        }
      }

      // HYGIENE: a copyShape tag must never collide with a consumed
      // element-key name.
      it('copyShape (when set) never collides with a consumed key name', () => {
        for (const [sectionType, set] of Object.entries(manifest)) {
          for (const v of set.variants) {
            if (v.copyShape === undefined) continue;
            expect(
              v.consumes,
              `${templateId}/${sectionType}/${v.layoutName}: copyShape "${v.copyShape}" collides with a consumed key`
            ).not.toContain(v.copyShape);
          }
        }
      });
    });
  });
}

// ── editor-basics: machine-checkable subset (template-factory phase 2) ────────
// The spec's editor-basics v0 contract, machine-checkable part. Templates DECLARE
// a slot's edit primitive; the platform primitive OWNS the editing UI. The signal
// this asserts is the `data-edit-primitive` marker the template Editable wrappers
// (MeridianEditable / HearthEditable) emit alongside data-element-key/-section-id
// in the PREVIEW render path (jsdom can't drive contentEditable, so `mode:'edit'`
// is unreachable here — preview renders the same static wrapper path + marker).
//
// This is EXPORTED (not folded into templateConformance) and enrolled explicitly
// per template in conformance.test.ts, because only meridian + hearth ship the
// `editBasics` mocks this consumes (surge/vestria/lex deferred — plan Q6).
//
// CALLER CONTRACT: the enrolling test file MUST (a) `vi.mock`
// '@/hooks/useEditStore' (selector-honoring `useEditStore` +
// `useEditStoreApi`) and '@/components/EditProvider' (`useEditStoreContext`) onto
// a single vanilla store, and (b) seed that store from `ALL_BLOCK_MOCK_SECTIONS`
// (blockMocks/harness) so every `sectionId` below resolves content. Edit blocks
// read the store via those two entry points; published `.published.tsx` blocks do
// NOT, so the marker never reaches published HTML.
export function assertEditorBasics(templateId: TemplateId): void {
  const sections = BLOCK_MOCKS[templateId] ?? [];

  describe(`editor-basics edit-primitive markers (${templateId})`, () => {
    if (sections.length === 0) {
      it('no editor-basics mocks enrolled (deferred template)', () => {
        expect(sections).toEqual([]);
      });
      return;
    }

    for (const s of sections) {
      describe(`${s.sectionType} (${s.layout})`, () => {
        const Edit = RESOLVERS[templateId].resolve(s.sectionType, 'edit') as
          | React.ComponentType<{ sectionId: string }>
          | null;

        // Parse a FRESH render each assertion (cheap; keeps assertions isolated).
        const render = (): HTMLElement => {
          const div = document.createElement('div');
          div.innerHTML = renderToStaticMarkup(
            React.createElement(Edit as React.ComponentType<{ sectionId: string }>, {
              sectionId: s.sectionId,
            })
          );
          return div;
        };

        it('resolves a real (non-placeholder) edit block', () => {
          expect(Edit).toBeTruthy();
          expect(Edit).not.toBe(RESOLVERS[templateId].placeholder);
        });

        // TEXT: every contract text slot → exactly one text-primitive marker.
        for (const key of s.editBasics.text) {
          it(`text slot "${key}" → exactly one [data-edit-primitive="text"]`, () => {
            const hits = render().querySelectorAll(
              `[data-edit-primitive="text"][data-element-key="${key}"]`
            );
            expect(hits.length, `"${key}": expected 1 text marker, got ${hits.length}`).toBe(1);
          });
        }

        // BUTTON: every CTA slot → exactly one button-primitive marker (the
        // isButton wiring that makes Button Settings reachable).
        for (const key of s.editBasics.button) {
          it(`button slot "${key}" → exactly one [data-edit-primitive="button"]`, () => {
            const hits = render().querySelectorAll(
              `[data-edit-primitive="button"][data-element-key="${key}"]`
            );
            expect(hits.length, `"${key}": expected 1 button marker, got ${hits.length}`).toBe(1);
          });
        }

        // COLLECTIONS: N mock items → N item roots, pinned to a concrete per-item
        // marker prefix (one representative field rendered once per item).
        for (const coll of s.editBasics.collections) {
          it(`collection "${coll.key}" → ${coll.items} item roots ([data-element-key^="${coll.countPrefix}"])`, () => {
            const roots = render().querySelectorAll(
              `[data-element-key^="${coll.countPrefix}"]`
            );
            expect(
              roots.length,
              `"${coll.key}": expected ${coll.items} item roots, got ${roots.length}`
            ).toBe(coll.items);
          });
        }

        // NO-ORPHAN: every emitted marker maps to a declared slot (scalar) or a
        // collection item prefix — catches dead/undeclared markers, so the text
        // check can't pass vacuously.
        it('every emitted edit-primitive marker maps to a declared slot', () => {
          const allowedExact = new Set([...s.editBasics.text, ...s.editBasics.button]);
          const allowedPrefixes = s.editBasics.collections.flatMap((c) => c.itemPrefixes);
          const orphans = Array.from(render().querySelectorAll('[data-edit-primitive]'))
            .map((m) => m.getAttribute('data-element-key') || '')
            .filter((k) => !allowedExact.has(k) && !allowedPrefixes.some((p) => k.startsWith(p)));
          expect(orphans, `undeclared edit-primitive markers: ${orphans.join(', ')}`).toEqual([]);
        });
      });
    }

    // Explicitly NOT machine-checked in jsdom — DECLARED skipped-with-reason (not
    // silently absent). These land in the /manual-test editor-basics subsection
    // (phase 11) + parity QA.
    describe('NOT machine-checked in jsdom (→ /manual-test editor-basics, phase 11)', () => {
      it.skip('image-upload wiring (per-block inline uploadImage — no shared image primitive to mark yet)', () => {});
      it.skip('logo primitive interaction', () => {});
      it.skip('collection add/remove/reorder affordances (edit-only, absent in preview)', () => {});
      it.skip('Button-Settings popover actually opening', () => {});
    });
  });
}

// ── knob-set conformance: CONDITIONAL (template-factory phase 3) ──────────────
// A template that declares `knobs` (TemplateModule.knobs) must cover the FULL
// standard axis set (`STANDARD_KNOB_AXES`), and each axis' declared values must
// be a non-empty subset of that axis' standard vocabulary AND include the axis
// default (the default value is what emits `:root` — a template can't tokenize an
// axis while dropping its no-op baseline). This is the "declaration must be TRUE"
// bar applied to knobs.
//
// EXPORTED + enrolled per template (phase 8, in conformance.test.ts) exactly like
// `assertEditorBasics` — NOT auto-fired inside `templateConformance`, because no
// shipping template declares knobs yet (phase 3 lands the mechanism only). Passing
// `undefined` records the not-declared fact with a single green test, so a
// knob-unaware template stays green when/if enrolled.
//
// The looks-truthfulness half (a look must reference declared axes/values +
// real variant/palette refs) landed in phase 8 as `assertLooksConformance`
// (below), enrolled alongside this rule in conformance.test.ts.
export function assertKnobConformance(
  templateId: TemplateId,
  knobs: TemplateKnobDeclaration | undefined,
): void {
  describe(`knob-set conformance (${templateId})`, () => {
    if (!knobs) {
      it('does not declare knobs (mechanism-only; nothing to check)', () => {
        expect(knobs).toBeUndefined();
      });
      return;
    }

    it('declares the FULL standard knob axis set', () => {
      const declared = Object.keys(knobs.axes).sort();
      const standard = [...KNOB_AXES].sort();
      expect(
        declared,
        `${templateId} declares knobs but is missing standard axes: ${standard
          .filter((a) => !declared.includes(a))
          .join(', ')}`,
      ).toEqual(standard);
    });

    for (const axis of KNOB_AXES) {
      describe(`axis "${axis}"`, () => {
        const def = STANDARD_KNOB_AXES[axis];

        it('declares a non-empty value subset of the standard vocabulary', () => {
          const values = knobs.axes[axis] ?? [];
          expect(values.length, `${templateId}/${axis}: declares no values`).toBeGreaterThan(0);
          const invalid = values.filter((v) => !def.values.includes(v));
          expect(
            invalid,
            `${templateId}/${axis}: declares values outside the standard vocabulary: ${invalid.join(', ')}`,
          ).toEqual([]);
        });

        it(`includes the axis default "${def.default}" (its no-op :root baseline)`, () => {
          expect(
            knobs.axes[axis] ?? [],
            `${templateId}/${axis}: tokenizes the axis but omits its default "${def.default}"`,
          ).toContain(def.default);
        });
      });
    }
  });
}

// ── looks-truthfulness conformance: CONDITIONAL (template-factory phase 8) ─────
// A named look is a curated bundle; every reference it makes MUST be TRUE:
//   1. it declares an id + label + blurb;
//   2. every knob axis it sets is one the template TOKENIZES (`knobs.axes`), and
//      every value is in that axis' declared subset (which is itself a subset of
//      the standard vocabulary — checked by assertKnobConformance);
//   3. its `variantId` is a real template variant id;
//   4. its `paletteId` is a real template palette id.
// A look that references an undeclared axis/value or a phantom variant/palette is
// a lie that would silently resolve to the default at render time — this rule
// makes it red instead.
//
// EXPORTED + enrolled per template (phase 8, in conformance.test.ts). The valid
// variant/palette id sets are passed IN from the enrolling test (which can import
// the template's pure id lists) so this module stays free of template-module
// imports. Passing `undefined` looks records the not-declared fact and stays green.
export function assertLooksConformance(
  templateId: TemplateId,
  looks: readonly TemplateLook[] | undefined,
  knobs: TemplateKnobDeclaration | undefined,
  validVariantIds: readonly string[],
  validPaletteIds: readonly string[],
): void {
  describe(`looks-truthfulness conformance (${templateId})`, () => {
    if (!looks || looks.length === 0) {
      it('declares no looks (nothing to check)', () => {
        expect(looks ?? []).toEqual([]);
      });
      return;
    }

    it('a template with looks must also declare knobs (looks reference knob axes)', () => {
      expect(knobs, `${templateId} declares looks but no knobs`).toBeTruthy();
    });

    const declaredAxes = (knobs?.axes ?? {}) as Partial<Record<KnobAxis, readonly string[]>>;

    for (const look of looks) {
      describe(`look "${look.id}"`, () => {
        it('declares id + label + blurb', () => {
          expect(look.id, 'look id').toBeTruthy();
          expect(look.label, `${look.id}: label`).toBeTruthy();
          expect(look.blurb, `${look.id}: blurb`).toBeTruthy();
        });

        it('every knob axis/value it sets is declared by the template', () => {
          for (const [axis, value] of Object.entries(look.knobs)) {
            if (value === undefined) continue;
            const supported = declaredAxes[axis as KnobAxis];
            expect(
              supported,
              `${templateId}/${look.id}: sets undeclared knob axis "${axis}"`,
            ).toBeTruthy();
            expect(
              supported,
              `${templateId}/${look.id}: knob "${axis}=${value}" not in the template's declared values [${(supported ?? []).join(', ')}]`,
            ).toContain(value);
          }
        });

        it(`references a real variant id ("${look.variantId}")`, () => {
          expect(
            validVariantIds,
            `${templateId}/${look.id}: variantId "${look.variantId}" is not a real template variant`,
          ).toContain(look.variantId);
        });

        it(`references a real palette id ("${look.paletteId}")`, () => {
          expect(
            validPaletteIds,
            `${templateId}/${look.id}: paletteId "${look.paletteId}" is not a real template palette`,
          ).toContain(look.paletteId);
        });
      });
    }
  });
}
