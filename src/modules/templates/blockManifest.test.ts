// scale-09 phase 2 — block-manifest conformance (copy-compatibility D18).
//
// Verifies the PURE-DATA declarations in blockManifest.ts are internally
// consistent AND copy-compatible with the element contract:
//   1. `default` ∈ variants[].layoutName (no dangling default).
//   2. every `capacity` has minCards ≤ maxCards.
//   3. `consumes ⊆ getAllElements(contract)` — a variant may only consume keys
//      already in the section's element contract; inventing a key is a red test.
//
// Contract source per declaration (plan phase 2):
//   product (thing engine): resolveEngineSectionSchema(layoutName) — the
//     meridian∪vestria union — so a vestria hero variant that consumes the
//     full-bleed video keys passes (they are in the hero union).
//   service: the block's own layout schema (no engine contract for service).
//
// NO resolver / component-identity checks here — those need the variant-aware
// resolveBlock and land in phase 3's conformance suite.
//
// Static data imports only; this is a vitest file (never enters the app bundle).

import { describe, it, expect } from 'vitest';

import { blockManifests, type BlockDeclaration } from './blockManifest';
import { resolveEngineSectionSchema } from '@/modules/engines/elementContracts';
import {
  productElementSchema,
} from '@/modules/audience/product/elementSchema';
import { serviceElementSchema } from '@/modules/audience/service/elementSchema';
import {
  getAllElements,
  type UIBlockSchemaV2,
} from '@/modules/sections/layoutElementSchema';

/** Resolve the element contract a declaration's `consumes` must be a subset of. */
function contractFor(layoutName: string): UIBlockSchemaV2 | null {
  // Thing-engine (meridian/vestria) sections use the unioned contract.
  const engine = resolveEngineSectionSchema(layoutName);
  if (engine) return engine;
  // Service (+ non-engine product) sections use the block's own schema.
  const own = productElementSchema[layoutName] ?? serviceElementSchema[layoutName];
  return own ?? null;
}

/** All element key names exposed by a schema (top-level + `collection.field`). */
function contractKeys(schema: UIBlockSchemaV2): Set<string> {
  return new Set(getAllElements(schema).map((e) => e.element));
}

describe('block manifest conformance (scale-09 D18)', () => {
  const declarations: Array<{
    templateId: string;
    sectionType: string;
    isDefault: boolean;
    decl: BlockDeclaration;
    defaultLayout: string;
    variantNames: string[];
  }> = [];

  for (const [templateId, manifest] of Object.entries(blockManifests)) {
    if (!manifest) continue;
    for (const [sectionType, set] of Object.entries(manifest)) {
      const variantNames = set.variants.map((v) => v.layoutName);
      for (const decl of set.variants) {
        declarations.push({
          templateId,
          sectionType,
          isDefault: decl.layoutName === set.default,
          decl,
          defaultLayout: set.default,
          variantNames,
        });
      }
    }
  }

  it('has at least one declaration to check', () => {
    expect(declarations.length).toBeGreaterThan(0);
  });

  // ── (1) default membership ────────────────────────────────────────────────
  describe('every section default is one of its declared variants', () => {
    for (const [templateId, manifest] of Object.entries(blockManifests)) {
      if (!manifest) continue;
      for (const [sectionType, set] of Object.entries(manifest)) {
        it(`${templateId}/${sectionType}: default "${set.default}" ∈ variants`, () => {
          expect(set.variants.map((v) => v.layoutName)).toContain(set.default);
        });
      }
    }
  });

  // ── (2) capacity sanity ───────────────────────────────────────────────────
  describe('every declared capacity has minCards ≤ maxCards', () => {
    for (const d of declarations) {
      if (!d.decl.capacity) continue;
      it(`${d.templateId}/${d.sectionType}/${d.decl.layoutName}`, () => {
        expect(d.decl.capacity!.minCards).toBeLessThanOrEqual(d.decl.capacity!.maxCards);
      });
    }
  });

  // ── (3) copy-compatibility: consumes ⊆ contract ───────────────────────────
  describe('every declaration consumes ⊆ its section element contract', () => {
    for (const d of declarations) {
      it(`${d.templateId}/${d.sectionType}/${d.decl.layoutName}`, () => {
        const contract = contractFor(d.decl.layoutName);
        expect(
          contract,
          `${d.decl.layoutName} has no resolvable element contract`
        ).toBeTruthy();
        const keys = contractKeys(contract!);
        const invented = d.decl.consumes.filter((k) => !keys.has(k));
        expect(
          invented,
          `${d.templateId}/${d.sectionType}/${d.decl.layoutName} invents keys not in contract: ${invented.join(', ')}`
        ).toEqual([]);
      });
    }
  });
});
