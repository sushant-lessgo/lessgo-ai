// Template conformance tests — scalePlan §6a/§6b (scale-01 phase 4, rule D-B).
// The "designer's bar": templateMeta declarations must be TRUE against the
// dispatch resolvers (the ground truth). A red test here means a declaration
// lies — fix the metadata (templateMeta / engineCoreSections), never weaken
// the assertions.
//
// (a) engine-core: every template with retired!==true AND bespoke!==true must,
//     for every engine it declares, resolve every section in that engine's
//     core set to a REAL block in BOTH modes ('edit' + 'published') — truthy
//     and not the template's placeholder. retired (techpremium) and bespoke
//     (lumen, D-A #2) are skipped for (a).
// (b) capability evidence: every declared BLOCK-BACKED capability must carry a
//     capabilitySections entry, and that section must resolve non-placeholder
//     in both modes. Runs for lumen too — bespoke exempts only (a), not (b).
//
// Static imports of resolvers/placeholders are fine here: test files never
// enter the app bundle (vitest-only), so the registry firewall is unaffected —
// same idiom as vestria/registration.test.ts.

import { describe, it, expect } from 'vitest';

import { templateMeta } from './templateMeta';
import { blockManifests, type BlockDeclaration } from './blockManifest';
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
import { isV2Schema, type UIBlockSchemaV2 } from '@/modules/sections/layoutElementSchema';
import { engineCoreSections } from '@/modules/engines/coreSections';
import { templateIds, type TemplateId } from '@/types/service';
import { capabilityIds, type CapabilityId } from '@/types/brief';
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

type Mode = 'edit' | 'published';

const RESOLVERS: Record<
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
const STRUCTURAL_CAPABILITIES: readonly CapabilityId[] = ['multipage', 'bilingual'];

const MODES: readonly Mode[] = ['edit', 'published'];

function resolvesReal(
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

describe('template conformance (scalePlan §6a/§6b)', () => {
  it('has a resolver entry for every templateId (drives both checks)', () => {
    expect(Object.keys(RESOLVERS).sort()).toEqual([...templateIds].sort());
    expect(Object.keys(templateMeta).sort()).toEqual([...templateIds].sort());
  });

  // ── (a) engine-core: non-retired, non-bespoke templates ────────────────────
  describe('(a) engine-core sections resolve to real blocks in both modes', () => {
    for (const templateId of templateIds) {
      const meta = templateMeta[templateId];
      if (meta.retired === true || meta.bespoke === true) continue;

      for (const engine of meta.copyEngines) {
        describe(`${templateId} · engine "${engine}"`, () => {
          for (const sectionType of engineCoreSections[engine]) {
            it(`${sectionType}: real block (edit + published)`, () => {
              resolvesReal(templateId, sectionType);
            });
          }
        });
      }
    }
  });

  // ── (b) capability evidence: ALL templates incl. bespoke ───────────────────
  describe('(b) declared block-backed capabilities are evidenced by a real section', () => {
    for (const templateId of templateIds) {
      const meta = templateMeta[templateId];
      const blockBacked = meta.capabilities.filter(
        (c) => !STRUCTURAL_CAPABILITIES.includes(c)
      );
      if (blockBacked.length === 0) continue;

      describe(templateId, () => {
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
  });

  // ── (b+) scale-07 phase 2: EVERY capabilitySections VALUE is a real block ──
  // Stronger than (b): (b) walks declared capabilities → entry; this walks the
  // map itself, so a stale/undeclared entry pointing at a dead section is also
  // red. Both renderers ('edit' + 'published') via resolvesReal.
  describe('(b+) every capabilitySections value resolves to a real block in BOTH renderers', () => {
    for (const templateId of templateIds) {
      const meta = templateMeta[templateId];
      const entries = Object.entries(meta.capabilitySections ?? {});
      if (entries.length === 0) continue;

      describe(templateId, () => {
        for (const [capability, sectionType] of entries) {
          it(`${capability} → "${sectionType}": real block (edit + published)`, () => {
            resolvesReal(templateId, sectionType!);
          });

          it(`${capability} → declared in the template's capabilities list (no orphan evidence)`, () => {
            expect(meta.capabilities).toContain(capability);
          });
        }
      });
    }
  });

  // ── sanity: the STRUCTURAL exemption stays inside the closed vocab ─────────
  it('structural capability list is a subset of the closed capability vocab', () => {
    for (const c of STRUCTURAL_CAPABILITIES) {
      expect(capabilityIds).toContain(c);
    }
  });

  // ── D-A #2 documented in code: lumen skipped by (a), exercised by (b) ──────
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

  // ── (c) scale-09: variant-aware resolveBlock resolution + distinctness ─────
  // Walks EVERY block-manifest declaration and, in BOTH modes, asserts:
  //   (a) resolveBlock(sectionType, mode, layoutName) → real, non-placeholder;
  //   (b) DISTINCTNESS (the critical guard): each NON-default variant resolves
  //       to a component `!==` (strict identity) the section DEFAULT's
  //       component. This is the ONLY automated guard for the variation
  //       mechanism: a misregistered/misspelled variant key makes
  //       `variants[layoutName] ?? default` silently return the default
  //       (truthy + non-placeholder), so resolution (a) alone stays green while
  //       the swap no-ops. Identity comparison catches that.
  //   EXEMPTION: `internalDispatch: true` declarations (surge testimonials,
  //       vestria hero) intentionally share ONE dispatcher component that
  //       branches internally on the stored layout — so their variants are
  //       asserted to be the SAME component as the default, not distinct.
  describe('(c) scale-09: manifest variant resolution + distinctness (both modes)', () => {
    for (const [tid, manifest] of Object.entries(blockManifests)) {
      const templateId = tid as TemplateId;
      describe(templateId, () => {
        for (const [sectionType, set] of Object.entries(manifest!)) {
          describe(sectionType, () => {
            it('default layout is one of the declared variants', () => {
              expect(set.variants.map((v) => v.layoutName)).toContain(set.default);
            });

            for (const variant of set.variants) {
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
    }
  });

  // ── (d) scale-10: declared collection-family capability ⇒ block PAIR ───────
  // The collection contract that lets block pairs ship demand-gated (rung C).
  // The collection FAMILY = exactly the CollectionKeys (registry) = the
  // per-type collection capabilityIds (products · services · case-studies ·
  // works). vestria's flat-grid `catalog` is deliberately NOT in this family
  // (no CollectionDef keyed `catalog` by construction — phase-1 firewall), so
  // it never triggers this check.
  //
  // Assertion (quantified over templates × the family): IF a template declares
  // a collection-family capability K, THEN its capabilitySections must expose
  // BOTH the def's catalogSectionType AND itemSectionType, and each must
  // resolve to a REAL (non-placeholder) block in BOTH modes ('edit' +
  // 'published'). That is the block PAIR (catalog + item) that rung-C ships.
  //
  // DORMANT TODAY: no shipping template declares a family capability
  // (techpremium retired; naayom grandfathered; vestria = flat-grid catalog
  // only), so the per-template loop body never executes → the assertion is
  // VACUOUSLY TRUE and green. It becomes LIVE the moment a rung-C template
  // declares K in templateMeta — at which point a missing block pair goes red.
  const COLLECTION_FAMILY = Object.keys(COLLECTIONS) as CollectionKey[];

  function assertCollectionCapabilityBacked(
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

      expect(
        declaredSectionTypes,
        `${templateId} declares collection "${capability}" but capabilitySections is missing its catalog section "${def!.catalogSectionType}"`
      ).toContain(def!.catalogSectionType);
      expect(
        declaredSectionTypes,
        `${templateId} declares collection "${capability}" but capabilitySections is missing its item section "${def!.itemSectionType}"`
      ).toContain(def!.itemSectionType);

      // The block PAIR must resolve non-placeholder in BOTH renderers.
      resolvesReal(templateId, def!.catalogSectionType);
      resolvesReal(templateId, def!.itemSectionType);
    }
  }

  describe('(d) scale-10: declared collection-family capability ⇒ block pair (edit + published)', () => {
    // Quantified assertion — vacuous today (no template declares a family cap).
    for (const templateId of templateIds) {
      const meta = templateMeta[templateId];
      const declaredFamily = meta.capabilities.filter((c) =>
        COLLECTION_FAMILY.includes(c as CollectionKey)
      );
      it(`${templateId}: every declared collection capability has a resolvable catalog+item pair`, () => {
        assertCollectionCapabilityBacked(
          templateId,
          meta.capabilities,
          meta.capabilitySections
        );
        // Records the dormancy fact for this template (informational).
        expect(Array.isArray(declaredFamily)).toBe(true);
      });
    }

    // Dormancy lock: NO shipping template declares a collection-family
    // capability today (the whole check ships vacuous). If a rung-C template
    // adds one, this flips red and the implementer must supply the block pair.
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
    // stays OUT of the collection family. It must keep `catalog` and never
    // gain a family capability — otherwise the flat grid would (wrongly) be
    // pulled into the generation→collections bridge.
    it('vestria stays flat-grid: declares `catalog`, NEVER a collection-family capability', () => {
      expect(templateMeta.vestria.capabilities).toContain('catalog');
      for (const cap of COLLECTION_FAMILY) {
        expect(
          templateMeta.vestria.capabilities,
          `vestria declares collection-family "${cap}" — flat-grid catalog must stay out of the family`
        ).not.toContain(cap);
      }
    });

    // Negative fixture — proves the assertion BITES (fails) rather than being
    // silently vacuous. Fully self-contained: it feeds FAKE template metadata
    // to the same assertion helper and asserts it THROWS, so the real suite
    // never goes red. No real template is mutated.
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

  // ── (e) variant-swap-integrity: no both-ways-scalar-divergent co-eligible pair ─
  // A block-variant swap must never silently drop scalar copy in BOTH
  // directions. For every SectionBlockSet, every CO-ELIGIBLE variant pair (same
  // copyShape group + both asset-eligible under identical all-present facts,
  // internalDispatch INCLUDED) must NOT be both-ways scalar-divergent. Any such
  // pair is genuinely content-incompatible and must be split by distinct
  // `copyShape` tags — surge testimonials (ReviewGrid vs PullQuote) is the
  // corrected case; meridian/hearth/vestria pairs are superset/equal ⇒ PASS.
  //
  // Static SCALAR/COLLECTION classification comes from the ELEMENT SCHEMA (tests
  // may import schemas — the firewall is a runtime-bundle rule only), injected
  // into the shared helper as `classify` so blockEligibility.ts imports no schema.
  // This is intentionally a DIFFERENT method from the runtime predicate's
  // value-arrayness classification; check (e)'s consistency assertion bridges the two.
  describe('(e) variant-swap-integrity: no both-ways-scalar-divergent co-eligible pair', () => {
    // Reuse the blockManifest.test contract seam: thing-engine (meridian/vestria)
    // sections resolve to the unioned contract; service sections to the own schema.
    function contractFor(layoutName: string): UIBlockSchemaV2 | null {
      const engine = resolveEngineSectionSchema(layoutName);
      if (engine) return engine;
      const own = productElementSchema[layoutName] ?? serviceElementSchema[layoutName];
      return (own as UIBlockSchemaV2) ?? null;
    }

    // Schema-based classifier. FAILS LOUDLY (throws) rather than guessing when a
    // consumed key's arrayness cannot be resolved from the contract.
    function classify(layoutName: string, key: string): ConsumedKeyKind {
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

    // MAIN assertion — per (template, section): the both-ways-divergent pair list is EMPTY.
    for (const [tid, manifest] of Object.entries(blockManifests)) {
      describe(tid, () => {
        for (const [sectionType, set] of Object.entries(manifest!)) {
          it(`${sectionType}: no co-eligible pair drops scalar copy both ways`, () => {
            const bad = findIncompatibleCoEligiblePairs(set, classify);
            expect(
              bad,
              `${tid}/${sectionType} has both-ways-scalar-divergent co-eligible pair(s): ${bad
                .map((p) => `${p.a}↔${p.b}`)
                .join(', ')} — split them with distinct copyShape tags`
            ).toEqual([]);
          });
        }
      });
    }

    // CONSISTENCY assertion — copyShape-exclusion and the runtime filter must not
    // drift: every DIFFERENT-copyShape but asset-co-eligible pair must ALSO be
    // runtime-hidden by isCopyCompatible when fed content synthesized from the
    // OTHER variant's consumes (proves surge PullQuote is hidden from a
    // reviews-shaped section by the scalar-drop rule alone, not only by copyShape).
    function synthContent(decl: BlockDeclaration): Record<string, unknown> {
      const el: Record<string, unknown> = {};
      for (const k of decl.consumes) {
        el[k] = classify(decl.layoutName, k) === 'collection' ? [{ id: '1' }] : 'x';
      }
      return el;
    }

    for (const [tid, manifest] of Object.entries(blockManifests)) {
      for (const [sectionType, set] of Object.entries(manifest!)) {
        const variants = set.variants;
        for (let i = 0; i < variants.length; i++) {
          for (let j = i + 1; j < variants.length; j++) {
            const A = variants[i];
            const B = variants[j];
            const sameShape = (A.copyShape ?? undefined) === (B.copyShape ?? undefined);
            const bothEligible =
              isBlockEligible(A, { assetFacts: ALL_ASSETS }) &&
              isBlockEligible(B, { assetFacts: ALL_ASSETS });
            if (sameShape || !bothEligible) continue; // only DIFFERENT-copyShape, asset-co-eligible pairs
            it(`${tid}/${sectionType}: ${A.layoutName} ⇄ ${B.layoutName} are runtime-hidden from each other's content`, () => {
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
    }

    // HYGIENE (plan-review non-blocking guidance): a copyShape tag must never
    // collide with a consumed element-key name (keeps the group label distinct
    // from content keys, avoiding accidental semantic overlap).
    it('copyShape (when set) never collides with a consumed key name', () => {
      for (const [tid, manifest] of Object.entries(blockManifests)) {
        for (const [sectionType, set] of Object.entries(manifest!)) {
          for (const v of set.variants) {
            if (v.copyShape === undefined) continue;
            expect(
              v.consumes,
              `${tid}/${sectionType}/${v.layoutName}: copyShape "${v.copyShape}" collides with a consumed key`
            ).not.toContain(v.copyShape);
          }
        }
      }
    });
  });

  // ── retired: techpremium out of both checks by declaration shape ───────────
  it('techpremium is retired with empty engine/capability lists (out of every check)', () => {
    expect(templateMeta.techpremium.retired).toBe(true);
    expect(templateMeta.techpremium.copyEngines).toEqual([]);
    expect(templateMeta.techpremium.capabilities).toEqual([]);
  });
});
